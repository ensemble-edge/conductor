/**
 * HITLState Durable Object
 *
 * Manages HITL (Human-in-the-Loop) resumption state with alarm-based TTL.
 * Provides strong consistency for state transitions and real-time notifications.
 */
import { DurableObject } from 'cloudflare:workers';
import type { SuspendedExecutionState } from '../runtime/resumption-manager.js';
/**
 * HITL status types
 */
export type HITLStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'resumed';
/**
 * HITL event types
 */
export interface HITLEvent {
    type: 'suspended' | 'approved' | 'rejected' | 'expired' | 'resumed';
    timestamp: number;
    actor?: string;
    data?: unknown;
}
/**
 * Stored HITL state
 */
export interface StoredHITLState {
    token: string;
    status: HITLStatus;
    suspendedState: SuspendedExecutionState;
    suspendedAt: number;
    expiresAt: number;
    approvalData?: unknown;
    rejectionReason?: string;
    events: HITLEvent[];
}
/**
 * HITLState Durable Object
 *
 * Single-threaded, strongly consistent HITL state management with alarm-based TTL.
 */
export declare class HITLState extends DurableObject {
    private state;
    private connections;
    constructor(ctx: DurableObjectState, env: Env);
    /**
     * HTTP handler for state queries and updates
     */
    fetch(request: Request): Promise<Response>;
    /**
     * Alarm handler for TTL expiration
     */
    alarm(): Promise<void>;
    /**
     * Handle WebSocket connection for live notifications
     */
    private handleWebSocket;
    /**
     * Get current HITL status
     */
    private handleGetStatus;
    /**
     * Suspend execution and create HITL state
     */
    private handleSuspend;
    /**
     * Approve and prepare for resumption
     */
    private handleApprove;
    /**
     * Reject and cancel execution
     */
    private handleReject;
    /**
     * Mark as resumed (called after successful resumption)
     */
    private handleMarkResumed;
    /**
     * Delete HITL state
     */
    private handleDelete;
    /**
     * Broadcast event to all connected WebSocket clients
     */
    private broadcast;
}
//# sourceMappingURL=hitl-state.d.ts.map