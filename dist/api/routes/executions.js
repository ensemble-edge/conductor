/**
 * Execution Routes
 *
 * API endpoints for querying and managing async execution state.
 * Integrates with ExecutionState Durable Object for real-time status.
 */
import { Hono } from 'hono';
const app = new Hono();
/**
 * Get execution status
 * GET /executions/:id/status
 *
 * Returns current execution state from ExecutionState DO
 */
app.get('/:id/status', async (c) => {
    const executionId = c.req.param('id');
    const env = c.env;
    try {
        // Get ExecutionState DO binding
        const namespace = env.EXECUTION_STATE;
        if (!namespace) {
            return c.json({
                error: 'ExecutionState Durable Object not configured',
                message: 'Missing EXECUTION_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this execution
        const id = namespace.idFromName(executionId);
        const stub = namespace.get(id);
        // Query status
        const response = await stub.fetch(new Request('http://do/status', {
            method: 'GET',
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const state = await response.json();
        return c.json(state);
    }
    catch (error) {
        return c.json({
            error: 'Failed to query execution status',
            message: error instanceof Error ? error.message : 'Unknown error',
            executionId,
        }, 500);
    }
});
/**
 * Stream execution progress via WebSocket
 * GET /executions/:id/stream (WebSocket upgrade)
 *
 * Establishes WebSocket connection to ExecutionState DO for live updates
 */
app.get('/:id/stream', async (c) => {
    const executionId = c.req.param('id');
    const env = c.env;
    try {
        // Check for WebSocket upgrade request
        const upgradeHeader = c.req.header('Upgrade');
        if (upgradeHeader !== 'websocket') {
            return c.json({
                error: 'WebSocket upgrade required',
                message: 'Set Upgrade: websocket header',
            }, 426);
        }
        // Get ExecutionState DO binding
        const namespace = env.EXECUTION_STATE;
        if (!namespace) {
            return c.json({
                error: 'ExecutionState Durable Object not configured',
                message: 'Missing EXECUTION_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this execution
        const id = namespace.idFromName(executionId);
        const stub = namespace.get(id);
        // Forward WebSocket upgrade to DO
        const response = await stub.fetch(new Request('http://do/stream', {
            headers: {
                Upgrade: 'websocket',
            },
        }));
        return response;
    }
    catch (error) {
        return c.json({
            error: 'Failed to establish WebSocket connection',
            message: error instanceof Error ? error.message : 'Unknown error',
            executionId,
        }, 500);
    }
});
/**
 * Cancel execution
 * POST /executions/:id/cancel
 *
 * Cancels a running execution
 */
app.post('/:id/cancel', async (c) => {
    const executionId = c.req.param('id');
    const env = c.env;
    try {
        // Get ExecutionState DO binding
        const namespace = env.EXECUTION_STATE;
        if (!namespace) {
            return c.json({
                error: 'ExecutionState Durable Object not configured',
                message: 'Missing EXECUTION_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this execution
        const id = namespace.idFromName(executionId);
        const stub = namespace.get(id);
        // Send cancel request
        const response = await stub.fetch(new Request('http://do/cancel', {
            method: 'POST',
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const result = (await response.json());
        return c.json({
            ...result,
            executionId,
            message: 'Execution cancelled successfully',
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to cancel execution',
            message: error instanceof Error ? error.message : 'Unknown error',
            executionId,
        }, 500);
    }
});
/**
 * Get execution result
 * GET /executions/:id/result
 *
 * Returns final result of completed execution
 */
app.get('/:id/result', async (c) => {
    const executionId = c.req.param('id');
    const env = c.env;
    try {
        // Get ExecutionState DO binding
        const namespace = env.EXECUTION_STATE;
        if (!namespace) {
            return c.json({
                error: 'ExecutionState Durable Object not configured',
                message: 'Missing EXECUTION_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this execution
        const id = namespace.idFromName(executionId);
        const stub = namespace.get(id);
        // Query status
        const response = await stub.fetch(new Request('http://do/status', {
            method: 'GET',
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const state = (await response.json());
        // Check if execution is complete
        if (state.status === 'running' || state.status === 'pending') {
            return c.json({
                error: 'Execution not yet completed',
                status: state.status,
                executionId,
            }, 409);
        }
        // Return result
        return c.json({
            executionId,
            status: state.status,
            result: state.result,
            error: state.error,
            metrics: state.metrics,
            startedAt: state.startedAt,
            completedAt: state.completedAt,
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to get execution result',
            message: error instanceof Error ? error.message : 'Unknown error',
            executionId,
        }, 500);
    }
});
/**
 * List execution events
 * GET /executions/:id/events
 *
 * Returns execution event history
 */
app.get('/:id/events', async (c) => {
    const executionId = c.req.param('id');
    const env = c.env;
    try {
        // Get ExecutionState DO binding
        const namespace = env.EXECUTION_STATE;
        if (!namespace) {
            return c.json({
                error: 'ExecutionState Durable Object not configured',
                message: 'Missing EXECUTION_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this execution
        const id = namespace.idFromName(executionId);
        const stub = namespace.get(id);
        // Query status
        const response = await stub.fetch(new Request('http://do/status', {
            method: 'GET',
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const state = (await response.json());
        // Return events
        return c.json({
            executionId,
            events: state.events || [],
            totalEvents: (state.events || []).length,
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to get execution events',
            message: error instanceof Error ? error.message : 'Unknown error',
            executionId,
        }, 500);
    }
});
/**
 * HITL endpoints for Human-in-the-Loop workflows
 */
/**
 * Get HITL status
 * GET /executions/hitl/:token/status
 *
 * Query HITL approval state
 */
app.get('/hitl/:token/status', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get HITLState DO binding
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Missing HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this token
        const id = namespace.idFromName(token);
        const stub = namespace.get(id);
        // Query status
        const response = await stub.fetch(new Request('http://do/status', {
            method: 'GET',
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const state = await response.json();
        return c.json(state);
    }
    catch (error) {
        return c.json({
            error: 'Failed to query HITL status',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
/**
 * Approve HITL request
 * POST /executions/hitl/:token/approve
 *
 * Approve suspended execution
 */
app.post('/hitl/:token/approve', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get approval data from body
        const body = await c.req.json().catch(() => ({}));
        const actor = body.actor || 'unknown';
        const approvalData = body.data || body.approvalData;
        // Get HITLState DO binding
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Missing HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this token
        const id = namespace.idFromName(token);
        const stub = namespace.get(id);
        // Send approve request
        const response = await stub.fetch(new Request('http://do/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actor, approvalData }),
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const result = (await response.json());
        return c.json({
            ...result,
            token,
            message: 'HITL request approved, execution will resume',
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to approve HITL request',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
/**
 * Reject HITL request
 * POST /executions/hitl/:token/reject
 *
 * Reject suspended execution
 */
app.post('/hitl/:token/reject', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get rejection data from body
        const body = await c.req.json().catch(() => ({}));
        const actor = body.actor || 'unknown';
        const reason = body.reason;
        // Get HITLState DO binding
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Missing HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this token
        const id = namespace.idFromName(token);
        const stub = namespace.get(id);
        // Send reject request
        const response = await stub.fetch(new Request('http://do/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actor, reason }),
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const result = (await response.json());
        return c.json({
            ...result,
            token,
            message: 'HITL request rejected, execution cancelled',
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to reject HITL request',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
/**
 * Delete HITL state
 * DELETE /executions/hitl/:token
 *
 * Clean up HITL state (admin operation)
 */
app.delete('/hitl/:token', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get HITLState DO binding
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Missing HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Get DO stub for this token
        const id = namespace.idFromName(token);
        const stub = namespace.get(id);
        // Send delete request
        const response = await stub.fetch(new Request('http://do/', {
            method: 'DELETE',
        }));
        if (!response.ok) {
            const error = await response.json();
            return c.json(error, response.status);
        }
        const result = (await response.json());
        return c.json({
            ...result,
            token,
            message: 'HITL state deleted successfully',
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to delete HITL state',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
export default app;
