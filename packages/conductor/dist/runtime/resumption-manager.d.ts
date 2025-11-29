/**
 * Resumption Manager
 *
 * Handles storing and retrieving suspended execution state for workflow resumption.
 * Uses HITLState Durable Object with alarm-based TTL for strong consistency.
 */
import type { EnsembleConfig } from './parser.js';
import { type AsyncResult } from '../types/result.js';
import { type ConductorError } from '../errors/error-types.js';
import type { AgentMetric } from './executor.js';
import type { ScoringState } from './scoring/types.js';
import type { ExecutionId, RequestId } from '../types/branded.js';
/**
 * Suspended execution state
 */
export interface SuspendedExecutionState {
    /**
     * Resumption token (unique ID)
     */
    token: string;
    /**
     * Execution ID for tracing and observability - branded type for type safety
     */
    executionId?: ExecutionId;
    /**
     * Request ID from original request - branded type for type safety
     */
    requestId?: RequestId;
    /**
     * Ensemble configuration
     */
    ensemble: EnsembleConfig;
    /**
     * Current execution context
     */
    executionContext: Record<string, unknown>;
    /**
     * State manager snapshot (if state is enabled)
     */
    stateSnapshot?: Record<string, unknown>;
    /**
     * Scoring state snapshot (if scoring is enabled)
     */
    scoringSnapshot?: ScoringState;
    /**
     * Current flow step index (where to resume from)
     */
    resumeFromStep: number;
    /**
     * Metrics accumulated so far
     */
    metrics: {
        startTime: number;
        agents: AgentMetric[];
        cacheHits: number;
    };
    /**
     * Suspension metadata
     */
    metadata: {
        suspendedAt: number;
        suspendedBy: string;
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
    metadata?: Record<string, unknown>;
}
/**
 * Resumption Manager
 * Handles HITLState Durable Object-based storage for suspended execution state
 */
export declare class ResumptionManager {
    private readonly namespace;
    constructor(namespace: DurableObjectNamespace);
    /**
     * Generate a cryptographically secure unique resumption token
     */
    static generateToken(): string;
    /**
     * Suspend execution and store state in HITLState DO
     */
    suspend(ensemble: EnsembleConfig, executionContext: Record<string, unknown>, resumeFromStep: number, suspendedBy: string, metrics: {
        startTime: number;
        agents: AgentMetric[];
        cacheHits: number;
    }, options?: ResumptionOptions): AsyncResult<string, ConductorError>;
    /**
     * Resume execution by loading state from HITLState DO
     */
    resume(token: string): AsyncResult<SuspendedExecutionState, ConductorError>;
    /**
     * Cancel a resumption token (delete from HITLState DO)
     */
    cancel(token: string): AsyncResult<void, ConductorError>;
    /**
     * Get resumption token metadata (without full state)
     */
    getMetadata(token: string): AsyncResult<SuspendedExecutionState['metadata'], ConductorError>;
    /**
     * Approve a HITL request
     * Approves the suspended execution and marks it ready for resumption
     */
    approve(token: string, actor: string, approvalData?: unknown): AsyncResult<void, ConductorError>;
    /**
     * Reject a HITL request
     * Rejects the suspended execution and cancels it
     */
    reject(token: string, actor: string, reason?: string): AsyncResult<void, ConductorError>;
}
//# sourceMappingURL=resumption-manager.d.ts.map