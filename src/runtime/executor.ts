/**
 * Core Executor - Heart of the Conductor runtime
 *
 * Orchestrates ensemble execution: loads YAML, manages state, executes members sequentially,
 * resolves input interpolations, and returns standardized responses
 */

import { Parser, type EnsembleConfig, type FlowStep, type MemberConfig } from './parser';
import { StateManager } from './state-manager';
import type { BaseMember, MemberExecutionContext, MemberResponse } from '../members/base-member';
import { FunctionMember } from '../members/function-member';
import { ThinkMember } from '../members/think-member';
import { DataMember } from '../members/data-member';
import { APIMember } from '../members/api-member';

export interface ExecutorConfig {
	env: Env;
	ctx: ExecutionContext;
}

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
 * Core execution engine for ensembles
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
	 * @param member - Member instance to register
	 */
	registerMember(member: BaseMember): void {
		this.memberRegistry.set(member.getName(), member);
	}

	/**
	 * Get or load a member by reference
	 * Supports both simple names and versioned references (name@version)
	 *
	 * @param memberRef - Member reference (e.g., "greet" or "analyze-company@production")
	 * @returns Member instance
	 */
	private async resolveMember(memberRef: string): Promise<BaseMember> {
		const { name, version } = Parser.parseMemberReference(memberRef);

		// If no version specified, get from registry
		if (!version) {
			const member = this.memberRegistry.get(name);
			if (!member) {
				throw new Error(`Member "${name}" not found in registry`);
			}
			return member;
		}

		// Version specified - need to load from Edgit
		// Check if we already have this exact version in registry (cached)
		const versionedKey = `${name}@${version}`;
		if (this.memberRegistry.has(versionedKey)) {
			return this.memberRegistry.get(versionedKey)!;
		}

		// Load member config from Edgit
		try {
			// TODO: This will work once Edgit is integrated
			// For now, we'll try to load from local registry and provide helpful error
			const localMember = this.memberRegistry.get(name);
			if (localMember) {
				// Member exists locally but version was requested
				// Cache it under versioned key for future use
				this.memberRegistry.set(versionedKey, localMember);
				return localMember;
			}

			throw new Error(
				`Cannot load versioned member "${memberRef}". ` +
				`Edgit integration not yet available. ` +
				`Register members manually for now using executor.registerMember()`
			);

			// Future implementation when Edgit is available:
			// import { loadMemberConfig } from '../sdk/edgit';
			// const config = await loadMemberConfig(memberRef, this.env);
			// const member = this.createMemberFromConfig(config);
			// this.memberRegistry.set(versionedKey, member);
			// return member;
		} catch (error) {
			throw new Error(
				`Failed to load member "${memberRef}": ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Create a member instance from config
	 * Used for dynamically loading members from Edgit
	 */
	private createMemberFromConfig(config: MemberConfig): BaseMember {
		switch (config.type) {
			case 'Think':
				return new ThinkMember(config);
			case 'Data':
				return new DataMember(config);
			case 'API':
				return new APIMember(config);
			case 'Function':
				throw new Error(
					`Cannot dynamically load Function member "${config.name}". ` +
					`Function members require code implementation and must be registered manually.`
				);
			case 'MCP':
				throw new Error('MCP member type not yet implemented');
			case 'Scoring':
				throw new Error('Scoring member type not yet implemented');
			default:
				throw new Error(`Unknown member type: ${config.type}`);
		}
	}

	/**
	 * Execute an ensemble from parsed configuration
	 * @param ensemble - Parsed ensemble configuration
	 * @param input - Input data for the ensemble
	 * @returns Execution result
	 */
	async executeEnsemble(ensemble: EnsembleConfig, input: Record<string, any>): Promise<ExecutionResult> {
		const startTime = Date.now();
		const metrics: ExecutionMetrics = {
			ensemble: ensemble.name,
			totalDuration: 0,
			members: [],
			cacheHits: 0
		};

		try {
			// Initialize state manager if configured
			const stateManager = ensemble.state ? new StateManager(ensemble.state) : null;

			// Context for resolving interpolations
			const executionContext: Record<string, any> = {
				input,
				state: stateManager ? stateManager.getState() : {}
			};

			// Execute flow steps sequentially
			for (const step of ensemble.flow) {
				const memberStartTime = Date.now();

				// Resolve input interpolations
				const resolvedInput = step.input ? Parser.resolveInterpolation(step.input, executionContext) : {};

				// Resolve member (supports versioned references like "member@version")
				const member = await this.resolveMember(step.member);

				// Create member execution context
				const memberContext: MemberExecutionContext = {
					input: resolvedInput,
					env: this.env,
					ctx: this.ctx,
					previousOutputs: executionContext
				};

				// Add state context if available
				if (stateManager && step.state) {
					const stateContext = stateManager.getStateForMember(step.member, step.state);
					memberContext.state = stateContext.state;
					memberContext.setState = stateContext.setState;
				}

				// Execute member
				const response = await member.execute(memberContext);

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

				// Handle errors
				if (!response.success) {
					throw new Error(`Member "${step.member}" failed: ${response.error}`);
				}

				// Store member output in context for future interpolations
				executionContext[step.member] = {
					output: response.data
				};

				// Update state context if state manager exists
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

			return {
				success: true,
				output: finalOutput,
				metrics,
				stateReport
			};
		} catch (error) {
			metrics.totalDuration = Date.now() - startTime;

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				metrics
			};
		}
	}

	/**
	 * Load and execute an ensemble from YAML content
	 * @param yamlContent - Ensemble YAML content
	 * @param input - Input data
	 * @returns Execution result
	 */
	async executeFromYAML(yamlContent: string, input: Record<string, any>): Promise<ExecutionResult> {
		try {
			// Parse the YAML
			const ensemble = Parser.parseEnsemble(yamlContent);

			// Validate that all referenced members exist
			const availableMembers = new Set(this.memberRegistry.keys());
			Parser.validateMemberReferences(ensemble, availableMembers);

			// Execute the ensemble
			return await this.executeEnsemble(ensemble, input);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				metrics: {
					ensemble: 'unknown',
					totalDuration: 0,
					members: [],
					cacheHits: 0
				}
			};
		}
	}

	/**
	 * Get all registered member names
	 * @returns Array of member names
	 */
	getRegisteredMembers(): string[] {
		return Array.from(this.memberRegistry.keys());
	}

	/**
	 * Check if a member is registered
	 * @param memberName - Name of the member
	 * @returns True if member is registered
	 */
	hasMember(memberName: string): boolean {
		return this.memberRegistry.has(memberName);
	}
}
