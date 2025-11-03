/**
 * Core Executor - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */
import { type EnsembleConfig } from './parser';
import { type AccessReport } from './state-manager';
import type { BaseMember } from '../members/base-member';
import type { ConductorEnv } from '../types/env';
import { type AsyncResult } from '../types/result';
import { type ConductorError } from '../errors/error-types';
import { type ScoringState } from './scoring/index.js';
import { type SuspendedExecutionState } from './resumption-manager.js';
import { type Logger } from '../observability';
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
 * Core execution engine for ensembles with Result-based error handling
 */
export declare class Executor {
    private env;
    private ctx;
    private memberRegistry;
    private logger;
    constructor(config: ExecutorConfig);
    /**
     * Register a member for use in ensembles
     */
    registerMember(member: BaseMember): void;
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
    private resolveMember;
    /**
     * Create a member instance from config
     * Used for dynamically loading members from Edgit
     */
    private createMemberFromConfig;
    /**
     * Execute a single flow step with all associated logic
     * @private
     */
    private executeStep;
    /**
     * Execute ensemble flow from a given step
     * @private
     */
    private executeFlow;
    /**
     * Execute an ensemble with Result-based error handling
     * @param ensemble - Parsed ensemble configuration
     * @param input - Input data for the ensemble
     * @returns Result containing execution output or error
     */
    executeEnsemble(ensemble: EnsembleConfig, input: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
    /**
     * Load and execute an ensemble from YAML with Result-based error handling
     */
    executeFromYAML(yamlContent: string, input: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
    /**
     * Get all registered member names (both built-in and user-defined)
     */
    getRegisteredMembers(): string[];
    /**
     * Check if a member is registered (checks both built-in and user-defined)
     */
    hasMember(memberName: string): boolean;
    /**
     * Get all built-in member metadata
     */
    getBuiltInMembers(): import("../members/built-in").BuiltInMemberMetadata[];
    /**
     * Resume execution from suspended state
     * Used for HITL approval workflows and webhook resumption
     */
    resumeExecution(suspendedState: SuspendedExecutionState, resumeInput?: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
}
//# sourceMappingURL=executor.d.ts.map