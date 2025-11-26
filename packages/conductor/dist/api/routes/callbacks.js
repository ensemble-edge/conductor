/**
 * Callbacks Routes
 *
 * Handles callback URLs for workflow resumption (HITL, async continuations).
 * These endpoints use token-based authentication (the token IS the auth).
 *
 * @see https://docs.ensemble.ai/conductor/agents/hitl
 */
import { Hono } from 'hono';
import { ResumptionManager } from '../../runtime/resumption-manager.js';
import { Executor } from '../../runtime/executor.js';
import { createLogger } from '../../observability/index.js';
const app = new Hono();
const logger = createLogger({ serviceName: 'api-callbacks' });
/**
 * Resume suspended execution
 * POST /callbacks/resume/:token
 *
 * Resume a suspended workflow using a one-time resumption token.
 * The token itself serves as authentication (like a password reset link).
 *
 * Security model:
 * - Token is cryptographically generated (crypto.randomUUID())
 * - Token is one-time use (deleted after successful resumption)
 * - Token has expiration (configured via HITL timeout)
 * - Token is delivered via secure channel (notification to authorized user)
 */
app.post('/resume/:token', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get resume data from body
        const resumeData = await c.req.json().catch(() => ({}));
        // Get HITLState DO namespace
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Resumption requires HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Create resumption manager
        const resumptionManager = new ResumptionManager(namespace);
        // Load suspended state
        const stateResult = await resumptionManager.resume(token);
        if (!stateResult.success) {
            return c.json({
                error: 'Failed to load resumption state',
                message: stateResult.error.message,
                token,
            }, 404);
        }
        const suspendedState = stateResult.value;
        // Create execution context
        const ctx = {
            waitUntil: (_promise) => { },
            passThroughOnException: () => { },
        };
        // Create executor
        const executor = new Executor({ env, ctx });
        // Resume execution
        const result = await executor.resumeExecution(suspendedState, resumeData);
        if (!result.success) {
            return c.json({
                error: 'Execution failed after resumption',
                message: result.error.message,
                token,
            }, 500);
        }
        // Delete the resumption token (one-time use)
        await resumptionManager.cancel(token);
        logger.info('Workflow resumed successfully', {
            token: token.substring(0, 8) + '...',
            ensemble: suspendedState.ensemble?.name,
        });
        return c.json({
            status: 'completed',
            token,
            result: result.value,
            message: 'Execution resumed and completed successfully',
        });
    }
    catch (error) {
        logger.error('Resumption failed', error instanceof Error ? error : undefined, {
            token: token.substring(0, 8) + '...',
        });
        return c.json({
            error: 'Resumption failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
/**
 * Get resumption token metadata
 * GET /callbacks/resume/:token
 *
 * Retrieve metadata about a resumption token without consuming it.
 * Useful for displaying approval context in a UI.
 */
app.get('/resume/:token', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get HITLState DO namespace
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Resumption requires HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Create resumption manager
        const resumptionManager = new ResumptionManager(namespace);
        // Get metadata
        const metadataResult = await resumptionManager.getMetadata(token);
        if (!metadataResult.success) {
            return c.json({
                error: 'Token not found',
                message: metadataResult.error.message,
                token,
            }, 404);
        }
        return c.json({
            token,
            metadata: metadataResult.value,
            status: 'suspended',
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to get token metadata',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});
/**
 * Approve suspended execution (convenience endpoint)
 * POST /callbacks/approve/:token
 *
 * Shorthand for resuming with { approved: true }
 */
app.post('/approve/:token', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get optional feedback from body
        const body = await c.req.json().catch(() => ({}));
        // Get HITLState DO namespace
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Resumption requires HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Create resumption manager
        const resumptionManager = new ResumptionManager(namespace);
        // Load suspended state
        const stateResult = await resumptionManager.resume(token);
        if (!stateResult.success) {
            return c.json({
                error: 'Token not found or expired',
                message: stateResult.error.message,
                token,
            }, 404);
        }
        const suspendedState = stateResult.value;
        // Create execution context
        const ctx = {
            waitUntil: (_promise) => { },
            passThroughOnException: () => { },
        };
        // Create executor
        const executor = new Executor({ env, ctx });
        // Resume with approval
        const result = await executor.resumeExecution(suspendedState, {
            approved: true,
            feedback: body.feedback,
            approver: body.approver,
        });
        if (!result.success) {
            return c.json({
                error: 'Execution failed after approval',
                message: result.error.message,
                token,
            }, 500);
        }
        // Delete the resumption token (one-time use)
        await resumptionManager.cancel(token);
        logger.info('Workflow approved', {
            token: token.substring(0, 8) + '...',
            ensemble: suspendedState.ensemble?.name,
        });
        return c.json({
            status: 'approved',
            token,
            result: result.value,
            message: 'Execution approved and completed',
        });
    }
    catch (error) {
        return c.json({
            error: 'Approval failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
/**
 * Reject suspended execution (convenience endpoint)
 * POST /callbacks/reject/:token
 *
 * Shorthand for resuming with { approved: false }
 */
app.post('/reject/:token', async (c) => {
    const token = c.req.param('token');
    const env = c.env;
    try {
        // Get optional reason from body
        const body = await c.req.json().catch(() => ({}));
        // Get HITLState DO namespace
        const namespace = env.HITL_STATE;
        if (!namespace) {
            return c.json({
                error: 'HITLState Durable Object not configured',
                message: 'Resumption requires HITL_STATE binding in wrangler.toml',
            }, 500);
        }
        // Create resumption manager
        const resumptionManager = new ResumptionManager(namespace);
        // Load suspended state
        const stateResult = await resumptionManager.resume(token);
        if (!stateResult.success) {
            return c.json({
                error: 'Token not found or expired',
                message: stateResult.error.message,
                token,
            }, 404);
        }
        const suspendedState = stateResult.value;
        // Create execution context
        const ctx = {
            waitUntil: (_promise) => { },
            passThroughOnException: () => { },
        };
        // Create executor
        const executor = new Executor({ env, ctx });
        // Resume with rejection
        const result = await executor.resumeExecution(suspendedState, {
            approved: false,
            reason: body.reason,
            feedback: body.feedback,
            rejector: body.rejector,
        });
        if (!result.success) {
            return c.json({
                error: 'Execution failed after rejection',
                message: result.error.message,
                token,
            }, 500);
        }
        // Delete the resumption token (one-time use)
        await resumptionManager.cancel(token);
        logger.info('Workflow rejected', {
            token: token.substring(0, 8) + '...',
            ensemble: suspendedState.ensemble?.name,
            reason: body.reason,
        });
        return c.json({
            status: 'rejected',
            token,
            result: result.value,
            message: 'Execution rejected',
        });
    }
    catch (error) {
        return c.json({
            error: 'Rejection failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
export default app;
