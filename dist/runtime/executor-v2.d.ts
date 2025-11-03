/**
 * Core Executor V2 - Refactored with Result Types
 *
 * Orchestrates ensemble execution with explicit error handling using Result types.
 * Makes all error cases explicit and checked at compile time.
 */
import { type EnsembleConfig } from './parser';
import type { BaseMember } from '../members/base-member';
import { type AsyncResult } from '../types/result';
import { type ConductorError } from '../errors/error-types';
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
export declare class ExecutorV2 {
    private env;
    private ctx;
    private memberRegistry;
    constructor(config: ExecutorConfig);
    /**
     * Register a member for use in ensembles
     */
    registerMember(member: BaseMember): void;
    /**
     * Resolve a member by reference with explicit error handling
     * Supports both simple names and versioned references (name@version)
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
     * Execute an ensemble with Result-based error handling
     * @param ensemble - Parsed ensemble configuration
     * @param input - Input data for the ensemble
     * @returns Result containing execution output or error
     */
    executeEnsembleV2(ensemble: EnsembleConfig, input: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
    /**
     * Execute an ensemble (legacy interface for backwards compatibility)
     * New code should use executeEnsembleV2 which returns Result
     */
    executeEnsemble(ensemble: EnsembleConfig, input: Record<string, any>): Promise<ExecutionResult>;
    /**
     * Load and execute an ensemble from YAML with Result-based error handling
     */
    executeFromYAMLV2(yamlContent: string, input: Record<string, any>): AsyncResult<ExecutionOutput, ConductorError>;
    /**
     * Load and execute an ensemble from YAML (legacy interface)
     */
    executeFromYAML(yamlContent: string, input: Record<string, any>): Promise<ExecutionResult>;
    /**
     * Get all registered member names
     */
    getRegisteredMembers(): string[];
    /**
     * Check if a member is registered
     */
    hasMember(memberName: string): boolean;
}
export { ExecutorV2 as Executor };
//# sourceMappingURL=executor-v2.d.ts.map