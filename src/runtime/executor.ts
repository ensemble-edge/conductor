/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */

import { Parser, type EnsembleConfig, type FlowStep, type MemberConfig } from './parser';
import { StateManager } from './state-manager';
import type { BaseMember, MemberExecutionContext, MemberResponse } from '../members/base-member';
import { FunctionMember } from '../members/function-member';
import { ThinkMember } from '../members/think-member';
import { DataMember } from '../members/data-member';
import { APIMember } from '../members/api-member';
import { Result, type AsyncResult } from '../types/result';
import {
	Errors,
	type ConductorError,
	MemberExecutionError,
	EnsembleExecutionError,
	ConfigurationError
} from '../errors/error-types';
import { MemberType } from '../types/constants';

export interface ExecutorConfig {
	env: Env;
	ctx: ExecutionContext;
}

/**
 * Successful execution output
 */
export interface ExecutionOutput {
	output: any;
	metrics: ExecutionMetrics;
	stateReport?: any;
}

/**
 * Legacy execution result for backwards compatibility
 * New code should use Result<ExecutionOutput, ConductorError>
 */
export interface ExecutionResult {
	success: boolean;
	output?: any;
	error?: string;
	metrics: ExecutionMetrics;
	stateReport?: any;
}

export interface ExecutionMetrics {
	ensemble: string;
	totalDuration: number;
	members: MemberMetric[];
	cacheHits: number;
	stateAccess?: any;
}

export interface MemberMetric {
	name: string;
	duration: number;
	cached: boolean;
	success: boolean;
}

/**
 * Core execution engine for ensembles with Result-based error handling
 */
export class Executor {
	private env: Env;
	private ctx: ExecutionContext;
	private memberRegistry: Map<string, BaseMember>;

	constructor(config: ExecutorConfig) {
		this.env = config.env;
		this.ctx = config.ctx;
		this.memberRegistry = new Map();
	}

	/**
	 * Register a member for use in ensembles
	 */
	registerMember(member: BaseMember): void {
		this.memberRegistry.set(member.getName(), member);
	}

	/**
	 * Resolve a member by reference with explicit error handling
	 * Supports both simple names and versioned references (name@version)
	 *
	 * @param memberRef - Member reference (e.g., "greet" or "analyze-company@production")
	 * @returns Result containing the member or an error
	 */
	private async resolveMember(memberRef: string): AsyncResult<BaseMember, ConductorError> {
		const { name, version } = Parser.parseMemberReference(memberRef);

		// If no version specified, get from registry
		if (!version) {
			const member = this.memberRegistry.get(name);
			if (!member) {
				return Result.err(Errors.memberNotFound(name));
			}
			return Result.ok(member);
		}

		// Version specified - check cache first
		const versionedKey = `${name}@${version}`;
		if (this.memberRegistry.has(versionedKey)) {
			const member = this.memberRegistry.get(versionedKey)!;
			return Result.ok(member);
		}

		// Try to load from local registry (Edgit not yet integrated)
		const localMember = this.memberRegistry.get(name);
		if (localMember) {
			// Cache it under versioned key
			this.memberRegistry.set(versionedKey, localMember);
			return Result.ok(localMember);
		}

		// Not found
		return Result.err(
			Errors.memberConfig(
				memberRef,
				'Versioned member loading requires Edgit integration. ' +
				'Register members manually using executor.registerMember()'
			)
		);
	}

	/**
	 * Create a member instance from config
	 * Used for dynamically loading members from Edgit
	 */
	private createMemberFromConfig(config: MemberConfig): Result<BaseMember, ConductorError> {
		switch (config.type) {
			case MemberType.Think:
				return Result.ok(new ThinkMember(config));

			case MemberType.Data:
				return Result.ok(new DataMember(config));

			case MemberType.API:
				return Result.ok(new APIMember(config));

			case MemberType.Function:
				return Result.err(
					Errors.memberConfig(
						config.name,
						'Function members require code implementation and must be registered manually'
					)
				);

			case MemberType.MCP:
				return Result.err(
					Errors.memberConfig(config.name, 'MCP member type not yet implemented')
				);

			case MemberType.Scoring:
				return Result.err(
					Errors.memberConfig(config.name, 'Scoring member type not yet implemented')
				);

			default:
				return Result.err(
					Errors.memberConfig(config.name, `Unknown member type: ${config.type}`)
				);
		}
	}

	/**
	 * Execute an ensemble with Result-based error handling
	 * @param ensemble - Parsed ensemble configuration
	 * @param input - Input data for the ensemble
	 * @returns Result containing execution output or error
	 */
	async executeEnsembleV2(
		ensemble: EnsembleConfig,
		input: Record<string, any>
	): AsyncResult<ExecutionOutput, ConductorError> {
		const startTime = Date.now();
		const metrics: ExecutionMetrics = {
			ensemble: ensemble.name,
			totalDuration: 0,
			members: [],
			cacheHits: 0
		};

		// Initialize state manager if configured
		let stateManager = ensemble.state ? new StateManager(ensemble.state) : null;

		// Context for resolving interpolations
		const executionContext: Record<string, any> = {
			input,
			state: stateManager ? stateManager.getState() : {}
		};

		// Execute flow steps sequentially
		for (const step of ensemble.flow) {
			const memberStartTime = Date.now();

			// Resolve input interpolations
			const resolvedInput = step.input
				? Parser.resolveInterpolation(step.input, executionContext)
				: {};

			// Resolve member - error handling is explicit
			const memberResult = await this.resolveMember(step.member);
			if (!memberResult.success) {
				return Result.err(
					new EnsembleExecutionError(ensemble.name, step.member, memberResult.error)
				);
			}
			const member = memberResult.value;

			// Create member execution context
			const memberContext: MemberExecutionContext = {
				input: resolvedInput,
				env: this.env,
				ctx: this.ctx,
				previousOutputs: executionContext
			};

			// Add state context if available and track updates
			let getPendingUpdates: (() => { updates: Record<string, any>; newLog: any[] }) | null = null;
			if (stateManager && step.state) {
				const { context, getPendingUpdates: getUpdates } = stateManager.getStateForMember(step.member, step.state);
				memberContext.state = context.state;
				memberContext.setState = context.setState;
				getPendingUpdates = getUpdates;
			}

			// Execute member
			const response = await member.execute(memberContext);

			// Apply pending state updates (immutable pattern - returns new StateManager)
			if (stateManager && getPendingUpdates) {
				const { updates, newLog } = getPendingUpdates();
				stateManager = stateManager.applyPendingUpdates(updates, newLog);
			}

			// Track metrics
			const memberDuration = Date.now() - memberStartTime;
			metrics.members.push({
				name: step.member,
				duration: memberDuration,
				cached: response.cached,
				success: response.success
			});

			if (response.cached) {
				metrics.cacheHits++;
			}

			// Handle member execution errors explicitly
			if (!response.success) {
				return Result.err(
					new MemberExecutionError(
						step.member,
						response.error || 'Unknown error',
						undefined
					)
				);
			}

			// Store member output in context for future interpolations
			executionContext[step.member] = {
				output: response.data
			};

			// Update state context with new state from immutable StateManager
			if (stateManager) {
				executionContext.state = stateManager.getState();
			}
		}

		// Resolve final output
		const finalOutput = ensemble.output
			? Parser.resolveInterpolation(ensemble.output, executionContext)
			: executionContext;

		// Calculate total duration
		metrics.totalDuration = Date.now() - startTime;

		// Get state report if available
		const stateReport = stateManager?.getAccessReport();

		return Result.ok({
			output: finalOutput,
			metrics,
			stateReport
		});
	}

	/**
	 * Execute an ensemble (legacy interface for backwards compatibility)
	 * New code should use executeEnsembleV2 which returns Result
	 */
	async executeEnsemble(
		ensemble: EnsembleConfig,
		input: Record<string, any>
	): Promise<ExecutionResult> {
		const result = await this.executeEnsembleV2(ensemble, input);

		if (result.success) {
			return {
				success: true,
				output: result.value.output,
				metrics: result.value.metrics,
				stateReport: result.value.stateReport
			};
		}

		// Convert error to legacy format
		return {
			success: false,
			error: result.error.message,
			metrics: {
				ensemble: ensemble.name,
				totalDuration: 0,
				members: [],
				cacheHits: 0
			}
		};
	}

	/**
	 * Load and execute an ensemble from YAML with Result-based error handling
	 */
	async executeFromYAMLV2(
		yamlContent: string,
		input: Record<string, any>
	): AsyncResult<ExecutionOutput, ConductorError> {
		// Parse YAML
		const parseResult = Result.fromThrowable(() => Parser.parseEnsemble(yamlContent));
		if (!parseResult.success) {
			return Result.err(
				Errors.ensembleParse(
					'unknown',
					parseResult.error.message
				)
			);
		}
		const ensemble = parseResult.value;

		// Validate member references
		const availableMembers = new Set(this.memberRegistry.keys());
		const validationResult = Result.fromThrowable(() =>
			Parser.validateMemberReferences(ensemble, availableMembers)
		);
		if (!validationResult.success) {
			return Result.err(
				Errors.ensembleParse(
					ensemble.name,
					validationResult.error.message
				)
			);
		}

		// Execute the ensemble
		return await this.executeEnsembleV2(ensemble, input);
	}

	/**
	 * Load and execute an ensemble from YAML (legacy interface)
	 */
	async executeFromYAML(
		yamlContent: string,
		input: Record<string, any>
	): Promise<ExecutionResult> {
		const result = await this.executeFromYAMLV2(yamlContent, input);

		if (result.success) {
			return {
				success: true,
				output: result.value.output,
				metrics: result.value.metrics,
				stateReport: result.value.stateReport
			};
		}

		return {
			success: false,
			error: result.error.message,
			metrics: {
				ensemble: 'unknown',
				totalDuration: 0,
				members: [],
				cacheHits: 0
			}
		};
	}

	/**
	 * Get all registered member names
	 */
	getRegisteredMembers(): string[] {
		return Array.from(this.memberRegistry.keys());
	}

	/**
	 * Check if a member is registered
	 */
	hasMember(memberName: string): boolean {
		return this.memberRegistry.has(memberName);
	}
}
