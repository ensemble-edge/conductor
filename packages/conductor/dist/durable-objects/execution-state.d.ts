/**
 * ExecutionState Durable Object
 *
 * Tracks async execution state with strong consistency.
 * Provides real-time status queries and optional WebSocket streaming.
 */
import { DurableObject } from 'cloudflare:workers';
import type { ExecutionMetrics } from '../runtime/executor.js';
/**
 * Execution status types
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
/**
 * Execution progress event
 */
export interface ExecutionProgressEvent {
    type: 'progress';
    executionId: string;
    step: string;
    stepIndex: number;
    totalSteps: number;
    output?: unknown;
    timestamp: number;
}
/**
 * Execution completion event
 */
export interface ExecutionCompletionEvent {
    type: 'completed' | 'failed' | 'cancelled';
    executionId: string;
    result?: unknown;
    error?: string;
    timestamp: number;
}
/**
 * Combined execution event
 */
export type ExecutionEvent = ExecutionProgressEvent | ExecutionCompletionEvent;
/**
 * Stored execution state
 */
export interface StoredExecutionState {
    executionId: string;
    ensembleName: string;
    status: ExecutionStatus;
    startedAt: number;
    completedAt?: number;
    currentStep?: string;
    stepIndex?: number;
    totalSteps?: number;
    outputs: Record<string, unknown>;
    metrics: ExecutionMetrics;
    result?: unknown;
    error?: string;
    events: ExecutionEvent[];
}
/**
 * ExecutionState Durable Object
 *
 * Single-threaded, strongly consistent state tracking for async executions.
 */
export declare class ExecutionState extends DurableObject {
    private state;
    private connections;
    constructor(ctx: DurableObjectState, env: Env);
    /**
     * HTTP handler for state queries and updates
     */
    fetch(request: Request): Promise<Response>;
    /**
     * Handle WebSocket connection for live updates
     */
    private handleWebSocket;
    /**
     * Get current execution status
     */
    private handleGetStatus;
    /**
     * Start execution tracking
     */
    private handleStart;
    /**
     * Update execution progress
     */
    private handleProgress;
    /**
     * Mark execution as completed
     */
    private handleComplete;
    /**
     * Mark execution as failed
     */
    private handleFail;
    /**
     * Cancel execution
     */
    private handleCancel;
    /**
     * Broadcast event to all connected WebSocket clients
     */
    private broadcast;
}
//# sourceMappingURL=execution-state.d.ts.map