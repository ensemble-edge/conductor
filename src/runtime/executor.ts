/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */

import { Parser, type EnsembleConfig, type FlowStep, type MemberConfig } from './parser';
import { StateManager, type AccessReport, type AccessLogEntry } from './state-manager';
import type { BaseMember, MemberExecutionContext, MemberResponse } from '../members/base-member';
import type { ConductorEnv } from '../types/env';
import { FunctionMember } from '../members/function-member';
import { ThinkMember } from '../members/think-member';
import { DataMember } from '../members/data-member';
import { APIMember } from '../members/api-member';
import { getBuiltInRegistry } from '../members/built-in/registry';
import { Result, type AsyncResult } from '../types/result';
import {
	Errors,
	type ConductorError,
	MemberExecutionError,
	EnsembleExecutionError,
	ConfigurationError
} from '../errors/error-types';
import { MemberType } from '../types/constants';
import { ScoringExecutor, EnsembleScorer, type ScoringState, type ScoringResult, type MemberScoringConfig, type EnsembleScoringConfig } from './scoring/index.js';
import { ResumptionManager, type SuspendedExecutionState } from './resumption-manager.js';
import { createLogger, type Logger } from '../observability';

export interface ExecutorConfig {
	env: ConductorEnv;
	ctx: ExecutionContext;
	logger?: Logger;
}

/**
 * Successful execution output
 */
export interface ExecutionOutput {
	output: unknown;
	metrics: ExecutionMetrics;
	stateReport?: AccessReport;
	scoring?: ScoringState;
}

/**
 * Legacy execution result for backwards compatibility
 * New code should use Result<ExecutionOutput, ConductorError>
 */
export interface ExecutionResult {
	success: boolean;
	output?: unknown;
	error?: string;
	metrics: ExecutionMetrics;
	stateReport?: AccessReport;
}

export interface ExecutionMetrics {
	ensemble: string;
	totalDuration: number;
	members: MemberMetric[];
	cacheHits: number;
	stateAccess?: AccessReport;
}

export interface MemberMetric {
	name: string;
	duration: number;
	cached: boolean;
	success: boolean;
}

/**
 * Internal context for flow execution
 * Encapsulates shared state during ensemble execution
 */
interface FlowExecutionContext {
	ensemble: EnsembleConfig;
	executionContext: Record<string, unknown>;
	metrics: ExecutionMetrics;
	stateManager: StateManager | null;
	scoringState: ScoringState | null;
	ensembleScorer: EnsembleScorer | null;
	scoringExecutor: ScoringExecutor;
	startTime: number;
}

/**
 * Core execution engine for ensembles with Result-based error handling
 */
export class Executor {
	private env: ConductorEnv;
	private ctx: ExecutionContext;
	private memberRegistry: Map<string, BaseMember>;
	private logger: Logger;

	constructor(config: ExecutorConfig) {
		this.env = config.env;
		this.ctx = config.ctx;
		this.memberRegistry = new Map();
		this.logger = config.logger || createLogger({ serviceName: 'executor' }, this.env.ANALYTICS);
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
	 * Loading priority:
	 * 1. Check built-in members (scrape, validate, rag, hitl, fetch)
	 * 2. Check user-defined members (registered via registerMember)
	 * 3. Error if not found
	 *
	 * @param memberRef - Member reference (e.g., "greet" or "analyze-company@production")
	 * @returns Result containing the member or an error
	 */
	private async resolveMember(memberRef: string): AsyncResult<BaseMember, ConductorError> {
		const { name, version } = Parser.parseMemberReference(memberRef);

		// If no version specified, check both built-in and user registries
		if (!version) {
			// 1. Check if it's a built-in member first
			const builtInRegistry = getBuiltInRegistry();
			if (builtInRegistry.isBuiltIn(name)) {
				try {
					// Create a minimal MemberConfig for built-in members
					const config: MemberConfig = {
						name: name,
						type: builtInRegistry.getMetadata(name)?.type || MemberType.Function,
						config: {}
					};
					const member = builtInRegistry.create(name, config, this.env);
					return Result.ok(member);
				} catch (error) {
					return Result.err(
						Errors.memberConfig(
							name,
							`Failed to load built-in member: ${error instanceof Error ? error.message : 'Unknown error'}`
						)
					);
				}
			}

			// 2. Check user-defined member registry
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
	 * Execute a single flow step with all associated logic
	 * @private
	 */
	private async executeStep(
		step: FlowStep,
		flowContext: FlowExecutionContext,
		stepIndex: number
	): AsyncResult<void, ConductorError> {
		const { ensemble, executionContext, metrics, stateManager, scoringState, ensembleScorer, scoringExecutor } = flowContext;
		const memberStartTime = Date.now();

		// Resolve input interpolations
		let resolvedInput: unknown;
		if (step.input) {
			// User specified explicit input mapping
			resolvedInput = Parser.resolveInterpolation(step.input, executionContext);
		} else if (stepIndex > 0) {
			// Default to previous member's output for chaining
			const previousMemberName = ensemble.flow[stepIndex - 1].member;
			resolvedInput = executionContext[previousMemberName]?.output || {};
		} else {
			// First step with no input - use original ensemble input
			resolvedInput = executionContext.input || {};
		}

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
			input: resolvedInput as Record<string, any>,
			env: this.env,
			ctx: this.ctx,
			previousOutputs: executionContext
		};

		// Add state context if available and track updates
		let getPendingUpdates: (() => { updates: Record<string, unknown>; newLog: AccessLogEntry[] }) | null = null;
		if (stateManager && step.state) {
			const { context, getPendingUpdates: getUpdates } = stateManager.getStateForMember(step.member, step.state);
			memberContext.state = context.state;
			memberContext.setState = context.setState;
			getPendingUpdates = getUpdates;
		}

		// Execute member (with scoring if configured)
		let response: MemberResponse;
		let scoringResult: ScoringResult | undefined;

		if (step.scoring && scoringState && ensembleScorer) {
			// Execute with scoring and retry logic
			const scoringConfig = step.scoring as MemberScoringConfig;
			const scoredResult = await scoringExecutor.executeWithScoring(
				// Member execution function
				async () => {
					const resp = await member.execute(memberContext);
					// Apply state updates after each attempt
					if (stateManager && getPendingUpdates) {
						const { updates, newLog } = getPendingUpdates();
						flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog);
					}
					return resp;
				},
				// Evaluator function
				async (output, attempt, previousScore) => {
					// Resolve the evaluator member
					const evaluatorResult = await this.resolveMember(scoringConfig.evaluator);
					if (!evaluatorResult.success) {
						throw new Error(`Failed to resolve evaluator member: ${evaluatorResult.error.message}`);
					}

					const evaluator = evaluatorResult.value;

					// Create evaluation context with the output to score
					const evalContext: MemberExecutionContext = {
						input: {
							output: output.success ? output.data : null,
							attempt,
							previousScore,
							criteria: scoringConfig.criteria || ensemble.scoring?.criteria
						},
						env: this.env,
						ctx: this.ctx,
						previousOutputs: executionContext
					};

					// Execute evaluator
					const evalResponse = await evaluator.execute(evalContext);

					if (!evalResponse.success) {
						throw new Error(`Evaluator failed: ${evalResponse.error || 'Unknown error'}`);
					}

					// Parse evaluator output as ScoringResult
					const evalData = evalResponse.data as Record<string, unknown> | number;
					const score = typeof evalData === 'number' ? evalData :
					             (typeof evalData === 'object' && evalData !== null && 'score' in evalData ? (evalData.score as number) :
					              typeof evalData === 'object' && evalData !== null && 'value' in evalData ? (evalData.value as number) : 0);

					const threshold = scoringConfig.thresholds?.minimum ||
					                 ensemble.scoring?.defaultThresholds?.minimum || 0.7;

					return {
						score,
						passed: score >= threshold,
						feedback: typeof evalData === 'object' && evalData !== null && 'feedback' in evalData ? String(evalData.feedback) :
						         typeof evalData === 'object' && evalData !== null && 'message' in evalData ? String(evalData.message) : '',
						breakdown: typeof evalData === 'object' && evalData !== null && 'breakdown' in evalData ? (evalData.breakdown as Record<string, number>) : {},
						metadata: {
							attempt,
							evaluator: scoringConfig.evaluator,
							timestamp: Date.now()
						}
					};
				},
				scoringConfig
			);

			// Extract response and scoring result
			response = scoredResult.output;
			scoringResult = scoredResult.score;

			// Update scoring state
			scoringState.scoreHistory.push({
				member: step.member,
				score: scoringResult.score,
				passed: scoringResult.passed,
				feedback: scoringResult.feedback,
				breakdown: scoringResult.breakdown,
				timestamp: Date.now(),
				attempt: scoredResult.attempts
			});

			// Track retry count
			scoringState.retryCount[step.member] = scoredResult.attempts - 1;

			// Handle scoring status
			if (scoredResult.status === 'max_retries_exceeded') {
				this.logger.warn('Member exceeded max retries', {
					memberName: step.member,
					score: scoringResult.score,
					attempts: scoredResult.attempts,
					ensembleName: ensemble.name
				});
			}
		} else {
			// Normal execution without scoring
			response = await member.execute(memberContext);

			// Apply pending state updates
			if (stateManager && getPendingUpdates) {
				const { updates, newLog } = getPendingUpdates();
				flowContext.stateManager = stateManager.applyPendingUpdates(updates, newLog);
			}
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
		if (flowContext.stateManager) {
			executionContext.state = flowContext.stateManager.getState();
		}

		// Update scoring context for interpolations
		if (scoringState) {
			executionContext.scoring = scoringState;
		}

		return Result.ok(undefined);
	}

	/**
	 * Execute ensemble flow from a given step
	 * @private
	 */
	private async executeFlow(
		flowContext: FlowExecutionContext,
		startStep: number = 0
	): AsyncResult<ExecutionOutput, ConductorError> {
		const { ensemble, executionContext, metrics, stateManager, scoringState, ensembleScorer, startTime } = flowContext;

		// Execute flow steps sequentially from startStep
		for (let i = startStep; i < ensemble.flow.length; i++) {
			const step = ensemble.flow[i];
			const stepResult = await this.executeStep(step, flowContext, i);

			if (!stepResult.success) {
				return Result.err(stepResult.error);
			}
		}

		// Calculate final ensemble score if scoring was enabled
		if (scoringState && ensembleScorer && scoringState.scoreHistory.length > 0) {
			scoringState.finalScore = ensembleScorer.calculateEnsembleScore(scoringState.scoreHistory);
			scoringState.qualityMetrics = ensembleScorer.calculateQualityMetrics(scoringState.scoreHistory);
		}

		// Resolve final output
		let finalOutput: unknown;
		if (ensemble.output) {
			// User specified output interpolation
			finalOutput = Parser.resolveInterpolation(ensemble.output, executionContext);
		} else if (ensemble.flow.length > 0) {
			// Default to last member's output
			const lastMemberName = ensemble.flow[ensemble.flow.length - 1].member;
			finalOutput = executionContext[lastMemberName]?.output;
		} else {
			// No flow steps - return empty
			finalOutput = {};
		}

		// Calculate total duration
		metrics.totalDuration = Date.now() - startTime;

		// Get state report if available
		const stateReport = flowContext.stateManager?.getAccessReport();

		// Build execution output with scoring data
		const executionOutput: ExecutionOutput = {
			output: finalOutput,
			metrics,
			stateReport
		};

		// Add scoring data if available
		if (scoringState) {
			executionOutput.scoring = scoringState;
		}

		return Result.ok(executionOutput);
	}

	/**
	 * Execute an ensemble with Result-based error handling
	 * @param ensemble - Parsed ensemble configuration
	 * @param input - Input data for the ensemble
	 * @returns Result containing execution output or error
	 */
	async executeEnsemble(
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
		const stateManager = ensemble.state ? new StateManager(ensemble.state) : null;

		// Initialize scoring if enabled
		let scoringState: ScoringState | null = null;
		let ensembleScorer: EnsembleScorer | null = null;
		const scoringExecutor = new ScoringExecutor();

		if (ensemble.scoring?.enabled) {
			ensembleScorer = new EnsembleScorer(ensemble.scoring as EnsembleScoringConfig);
			scoringState = {
				scoreHistory: [],
				retryCount: {},
				qualityMetrics: undefined,
				finalScore: undefined
			};
		}

		// Context for resolving interpolations
		const executionContext: Record<string, unknown> = {
			input,
			state: stateManager ? stateManager.getState() : {},
			scoring: scoringState || {}
		};

		// Create flow execution context
		const flowContext: FlowExecutionContext = {
			ensemble,
			executionContext,
			metrics,
			stateManager,
			scoringState,
			ensembleScorer,
			scoringExecutor,
			startTime
		};

		// Execute flow from the beginning
		return await this.executeFlow(flowContext, 0);
	}


	/**
	 * Load and execute an ensemble from YAML with Result-based error handling
	 */
	async executeFromYAML(
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
		return await this.executeEnsemble(ensemble, input);
	}

	/**
	 * Get all registered member names (both built-in and user-defined)
	 */
	getRegisteredMembers(): string[] {
		const builtInRegistry = getBuiltInRegistry();
		const builtInNames = builtInRegistry.getAvailableNames();
		const userDefinedNames = Array.from(this.memberRegistry.keys());

		// Combine both, user-defined members take precedence (can override built-in)
		const allNames = new Set([...builtInNames, ...userDefinedNames]);
		return Array.from(allNames);
	}

	/**
	 * Check if a member is registered (checks both built-in and user-defined)
	 */
	hasMember(memberName: string): boolean {
		const builtInRegistry = getBuiltInRegistry();
		return builtInRegistry.isBuiltIn(memberName) || this.memberRegistry.has(memberName);
	}

	/**
	 * Get all built-in member metadata
	 */
	getBuiltInMembers() {
		const builtInRegistry = getBuiltInRegistry();
		return builtInRegistry.list();
	}

	/**
	 * Resume execution from suspended state
	 * Used for HITL approval workflows and webhook resumption
	 */
	async resumeExecution(
		suspendedState: SuspendedExecutionState,
		resumeInput?: Record<string, any>
	): AsyncResult<ExecutionOutput, ConductorError> {
		const ensemble = suspendedState.ensemble;
		const executionContext = suspendedState.executionContext;

		// Merge resume input if provided (e.g., HITL approval data)
		if (resumeInput) {
			executionContext.resumeInput = resumeInput;
		}

		// Restore state manager if it existed
		let stateManager: StateManager | null = null;
		if (suspendedState.stateSnapshot) {
			// Create state manager from snapshot
			if (ensemble.state) {
				stateManager = new StateManager(ensemble.state);
				// TODO: Restore state from snapshot
				// This requires StateManager to support state restoration
			}
		}

		// Restore scoring state if it existed
		let scoringState: ScoringState | null = null;
		let ensembleScorer: EnsembleScorer | null = null;
		const scoringExecutor = new ScoringExecutor();

		if (suspendedState.scoringSnapshot) {
			scoringState = suspendedState.scoringSnapshot as ScoringState;
			if (ensemble.scoring?.enabled) {
				ensembleScorer = new EnsembleScorer(ensemble.scoring as EnsembleScoringConfig);
			}
		}

		// Restore metrics
		const metrics: ExecutionMetrics = {
			ensemble: ensemble.name,
			totalDuration: 0,
			members: suspendedState.metrics.members || [],
			cacheHits: suspendedState.metrics.cacheHits || 0
		};

		const startTime = suspendedState.metrics.startTime || Date.now();

		// Update execution context with restored state
		if (stateManager) {
			executionContext.state = stateManager.getState();
		}
		if (scoringState) {
			executionContext.scoring = scoringState;
		}

		// Create flow execution context
		const flowContext: FlowExecutionContext = {
			ensemble,
			executionContext,
			metrics,
			stateManager,
			scoringState,
			ensembleScorer,
			scoringExecutor,
			startTime
		};

		// Resume from the specified step
		const resumeFromStep = suspendedState.resumeFromStep;

		// Execute flow from the resume point
		return await this.executeFlow(flowContext, resumeFromStep);
	}
}
