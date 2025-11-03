/**
 * Resumption Manager
 *
 * Handles storing and retrieving suspended execution state for workflow resumption.
 * Uses KV with TTL for ephemeral resumption tokens (similar to webhook concept).
 */

import type { EnsembleConfig } from './parser';
import type { StateManager } from './state-manager';
import { Result, type AsyncResult } from '../types/result';
import { Errors, type ConductorError } from '../errors/error-types';

/**
 * Suspended execution state
 */
export interface SuspendedExecutionState {
	/**
	 * Resumption token (unique ID)
	 */
	token: string;

	/**
	 * Ensemble configuration
	 */
	ensemble: EnsembleConfig;

	/**
	 * Current execution context
	 */
	executionContext: Record<string, any>;

	/**
	 * State manager snapshot (if state is enabled)
	 */
	stateSnapshot?: any;

	/**
	 * Scoring state snapshot (if scoring is enabled)
	 */
	scoringSnapshot?: any;

	/**
	 * Current flow step index (where to resume from)
	 */
	resumeFromStep: number;

	/**
	 * Metrics accumulated so far
	 */
	metrics: {
		startTime: number;
		members: any[];
		cacheHits: number;
	};

	/**
	 * Suspension metadata
	 */
	metadata: {
		suspendedAt: number;
		suspendedBy: string; // Member name that triggered suspension (e.g., 'hitl')
		reason?: string;
		expiresAt: number;
	};
}

/**
 * Resumption options
 */
export interface ResumptionOptions {
	/**
	 * TTL for resumption token (seconds)
	 * @default 86400 (24 hours)
	 */
	ttl?: number;

	/**
	 * Additional metadata to store
	 */
	metadata?: Record<string, any>;
}

/**
 * Resumption Manager
 * Handles KV-based storage for suspended execution state
 */
export class ResumptionManager {
	private readonly kv: KVNamespace;
	private readonly keyPrefix: string;

	constructor(kv: KVNamespace, keyPrefix: string = 'resumption:') {
		this.kv = kv;
		this.keyPrefix = keyPrefix;
	}

	/**
	 * Generate a unique resumption token
	 */
	static generateToken(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		const random2 = Math.random().toString(36).substring(2, 15);
		return `resume_${timestamp}_${random}${random2}`;
	}

	/**
	 * Suspend execution and store state in KV
	 */
	async suspend(
		ensemble: EnsembleConfig,
		executionContext: Record<string, any>,
		resumeFromStep: number,
		suspendedBy: string,
		metrics: any,
		options: ResumptionOptions = {}
	): AsyncResult<string, ConductorError> {
		try {
			const token = ResumptionManager.generateToken();
			const ttl = options.ttl || 86400; // 24 hours default
			const expiresAt = Date.now() + (ttl * 1000);

			const state: SuspendedExecutionState = {
				token,
				ensemble,
				executionContext,
				stateSnapshot: executionContext.state || undefined,
				scoringSnapshot: executionContext.scoring || undefined,
				resumeFromStep,
				metrics: {
					startTime: metrics.startTime || Date.now(),
					members: metrics.members || [],
					cacheHits: metrics.cacheHits || 0
				},
				metadata: {
					suspendedAt: Date.now(),
					suspendedBy,
					reason: options.metadata?.reason,
					expiresAt,
					...options.metadata
				}
			};

			// Store in KV with TTL
			const key = this.getKey(token);
			await this.kv.put(key, JSON.stringify(state), {
				expirationTtl: ttl
			});

			return Result.ok(token);
		} catch (error) {
			return Result.err(
				Errors.internal(
					`Failed to suspend execution: ${error instanceof Error ? error.message : 'Unknown error'}`
				)
			);
		}
	}

	/**
	 * Resume execution by loading state from KV
	 */
	async resume(token: string): AsyncResult<SuspendedExecutionState, ConductorError> {
		try {
			const key = this.getKey(token);
			const stateJson = await this.kv.get(key, 'text');

			if (!stateJson) {
				return Result.err(
					Errors.storageNotFound(token, 'resumption-kv')
				);
			}

			const state = JSON.parse(stateJson) as SuspendedExecutionState;

			// Check if expired (shouldn't happen due to KV TTL, but extra safety)
			if (state.metadata.expiresAt < Date.now()) {
				// Clean up expired token
				await this.kv.delete(key);
				return Result.err(
					Errors.storageNotFound(token, 'resumption-kv (expired)')
				);
			}

			return Result.ok(state);
		} catch (error) {
			return Result.err(
				Errors.internal(
					`Failed to resume execution: ${error instanceof Error ? error.message : 'Unknown error'}`
				)
			);
		}
	}

	/**
	 * Cancel a resumption token (delete from KV)
	 */
	async cancel(token: string): AsyncResult<void, ConductorError> {
		try {
			const key = this.getKey(token);
			await this.kv.delete(key);
			return Result.ok(undefined);
		} catch (error) {
			return Result.err(
				Errors.internal(
					`Failed to cancel resumption token: ${error instanceof Error ? error.message : 'Unknown error'}`
				)
			);
		}
	}

	/**
	 * Get resumption token metadata (without full state)
	 */
	async getMetadata(token: string): AsyncResult<SuspendedExecutionState['metadata'], ConductorError> {
		try {
			const key = this.getKey(token);
			const stateJson = await this.kv.get(key, 'text');

			if (!stateJson) {
				return Result.err(
					Errors.storageNotFound(token, 'resumption-kv')
				);
			}

			const state = JSON.parse(stateJson) as SuspendedExecutionState;
			return Result.ok(state.metadata);
		} catch (error) {
			return Result.err(
				Errors.internal(
					`Failed to get resumption metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
				)
			);
		}
	}

	/**
	 * List all active resumption tokens for an ensemble
	 * Note: This is expensive - scans KV with prefix. Use sparingly.
	 */
	async listActiveTokens(ensembleName?: string): AsyncResult<string[], ConductorError> {
		try {
			// KV list with prefix
			const list = await this.kv.list({ prefix: this.keyPrefix });

			const tokens: string[] = [];
			for (const key of list.keys) {
				const token = key.name.replace(this.keyPrefix, '');

				// If filtering by ensemble, load and check
				if (ensembleName) {
					const stateJson = await this.kv.get(key.name, 'text');
					if (stateJson) {
						const state = JSON.parse(stateJson) as SuspendedExecutionState;
						if (state.ensemble.name === ensembleName) {
							tokens.push(token);
						}
					}
				} else {
					tokens.push(token);
				}
			}

			return Result.ok(tokens);
		} catch (error) {
			return Result.err(
				Errors.internal(
					`Failed to list resumption tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
				)
			);
		}
	}

	/**
	 * Get full KV key for a token
	 */
	private getKey(token: string): string {
		return `${this.keyPrefix}${token}`;
	}
}
