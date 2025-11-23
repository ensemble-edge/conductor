/**
 * Resumption Manager
 *
 * Handles storing and retrieving suspended execution state for workflow resumption.
 * Uses HITLState Durable Object with alarm-based TTL for strong consistency.
 */
import { Result } from '../types/result.js';
import { Errors } from '../errors/error-types.js';
import { TTL } from '../config/constants.js';
/**
 * Resumption Manager
 * Handles HITLState Durable Object-based storage for suspended execution state
 */
export class ResumptionManager {
    constructor(namespace) {
        this.namespace = namespace;
    }
    /**
     * Generate a cryptographically secure unique resumption token
     */
    static generateToken() {
        // Use crypto.randomUUID() for cryptographically secure random tokens
        // Format: resume_<uuid> for easy identification and secure randomness
        return `resume_${crypto.randomUUID()}`;
    }
    /**
     * Suspend execution and store state in HITLState DO
     */
    async suspend(ensemble, executionContext, resumeFromStep, suspendedBy, metrics, options = {}) {
        try {
            const token = ResumptionManager.generateToken();
            const ttl = options.ttl || TTL.RESUMPTION_TOKEN;
            const suspendedState = {
                token,
                ensemble,
                executionContext,
                stateSnapshot: executionContext.state,
                scoringSnapshot: executionContext.scoring,
                resumeFromStep,
                metrics: {
                    startTime: metrics.startTime || Date.now(),
                    agents: metrics.agents || [],
                    cacheHits: metrics.cacheHits || 0,
                },
                metadata: {
                    suspendedAt: Date.now(),
                    suspendedBy,
                    reason: options.metadata?.reason,
                    expiresAt: Date.now() + ttl * 1000,
                    ...options.metadata,
                },
            };
            // Get HITLState DO stub
            const id = this.namespace.idFromName(token);
            const stub = this.namespace.get(id);
            // Suspend execution in DO
            const response = await stub.fetch(new Request('http://do/suspend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    suspendedState,
                    ttl,
                }),
            }));
            if (!response.ok) {
                const error = (await response.json());
                return Result.err(Errors.internal(`Failed to suspend execution: ${error.error || 'Unknown error'}`));
            }
            return Result.ok(token);
        }
        catch (error) {
            return Result.err(Errors.internal(`Failed to suspend execution: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    /**
     * Resume execution by loading state from HITLState DO
     */
    async resume(token) {
        try {
            // Get HITLState DO stub
            const id = this.namespace.idFromName(token);
            const stub = this.namespace.get(id);
            // Get status from DO
            const response = await stub.fetch(new Request('http://do/status', {
                method: 'GET',
            }));
            if (!response.ok) {
                return Result.err(Errors.storageNotFound(token, 'hitl-state-do'));
            }
            const state = (await response.json());
            // Check if already expired
            if (state.status === 'expired') {
                return Result.err(Errors.storageNotFound(token, 'hitl-state-do (expired)'));
            }
            // Check if already approved (ready to resume)
            if (state.status === 'approved') {
                if (!state.suspendedState) {
                    return Result.err(Errors.internal('Suspended state not found in approved HITL request'));
                }
                return Result.ok(state.suspendedState);
            }
            // If still pending, return error
            if (state.status === 'pending') {
                return Result.err(Errors.internal('Execution still pending approval'));
            }
            // If rejected, return error
            if (state.status === 'rejected') {
                return Result.err(Errors.internal(`Execution rejected: ${state.rejectionReason || 'No reason provided'}`));
            }
            return Result.err(Errors.internal(`Invalid HITL state: ${state.status}`));
        }
        catch (error) {
            return Result.err(Errors.internal(`Failed to resume execution: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    /**
     * Cancel a resumption token (delete from HITLState DO)
     */
    async cancel(token) {
        try {
            // Get HITLState DO stub
            const id = this.namespace.idFromName(token);
            const stub = this.namespace.get(id);
            // Delete DO state
            const response = await stub.fetch(new Request('http://do/', {
                method: 'DELETE',
            }));
            if (!response.ok) {
                const error = (await response.json());
                return Result.err(Errors.internal(`Failed to cancel resumption token: ${error.error || 'Unknown error'}`));
            }
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`Failed to cancel resumption token: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    /**
     * Get resumption token metadata (without full state)
     */
    async getMetadata(token) {
        try {
            // Get HITLState DO stub
            const id = this.namespace.idFromName(token);
            const stub = this.namespace.get(id);
            // Get status from DO
            const response = await stub.fetch(new Request('http://do/status', {
                method: 'GET',
            }));
            if (!response.ok) {
                return Result.err(Errors.storageNotFound(token, 'hitl-state-do'));
            }
            const state = (await response.json());
            // Return metadata from suspended state
            if (state.suspendedState) {
                return Result.ok(state.suspendedState.metadata);
            }
            // Construct metadata from HITL state
            return Result.ok({
                suspendedAt: state.suspendedAt || Date.now(),
                suspendedBy: 'hitl',
                expiresAt: state.expiresAt || Date.now(),
            });
        }
        catch (error) {
            return Result.err(Errors.internal(`Failed to get resumption metadata: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    /**
     * Approve a HITL request
     * Approves the suspended execution and marks it ready for resumption
     */
    async approve(token, actor, approvalData) {
        try {
            // Get HITLState DO stub
            const id = this.namespace.idFromName(token);
            const stub = this.namespace.get(id);
            // Send approve request
            const response = await stub.fetch(new Request('http://do/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor, approvalData }),
            }));
            if (!response.ok) {
                const error = (await response.json());
                return Result.err(Errors.internal(`Failed to approve HITL request: ${error.error || 'Unknown error'}`));
            }
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`Failed to approve HITL request: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    /**
     * Reject a HITL request
     * Rejects the suspended execution and cancels it
     */
    async reject(token, actor, reason) {
        try {
            // Get HITLState DO stub
            const id = this.namespace.idFromName(token);
            const stub = this.namespace.get(id);
            // Send reject request
            const response = await stub.fetch(new Request('http://do/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor, reason }),
            }));
            if (!response.ok) {
                const error = (await response.json());
                return Result.err(Errors.internal(`Failed to reject HITL request: ${error.error || 'Unknown error'}`));
            }
            return Result.ok(undefined);
        }
        catch (error) {
            return Result.err(Errors.internal(`Failed to reject HITL request: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
}
