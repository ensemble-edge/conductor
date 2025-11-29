/**
 * Async Routes
 *
 * Asynchronous execution with status polling and webhooks.
 */
import { Hono } from 'hono';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
import { createLogger, generateExecutionId } from '../../observability/index.js';
import { ExecutionId } from '../../types/branded.js';
const async = new Hono();
const logger = createLogger({ serviceName: 'api-async' });
// In-memory execution tracking (in production, use Durable Objects or D1)
// Uses branded ExecutionId keys for type safety
const executions = new Map();
/**
 * POST /async - Execute a agent asynchronously
 */
async.post('/', async (c) => {
    const body = await c.req.json();
    // Generate a unique execution ID for this async request
    const executionId = generateExecutionId();
    // Validate request
    if (!body.agent || !body.input) {
        return c.json({
            error: 'ValidationError',
            message: 'Agent name and input are required',
            timestamp: Date.now(),
        }, 400);
    }
    // Store execution request
    executions.set(executionId, {
        status: 'queued',
        request: body,
    });
    // Queue execution (in background)
    c.executionCtx.waitUntil(executeAsync(executionId, body, c.env));
    // Return execution ID (unwrap branded type for JSON response)
    const response = {
        executionId: ExecutionId.unwrap(executionId),
        status: 'queued',
        queuePosition: 0,
        estimatedTime: 5000, // 5 seconds estimate
    };
    return c.json(response, 202);
});
/**
 * GET /async/:executionId - Get execution status
 */
async.get('/:executionId', (c) => {
    const executionIdParam = c.req.param('executionId');
    // Validate and convert to branded ExecutionId
    const executionId = ExecutionId.tryCreate(executionIdParam);
    if (!executionId) {
        return c.json({
            error: 'InvalidRequest',
            message: `Invalid execution ID format: ${executionIdParam}`,
            timestamp: Date.now(),
        }, 400);
    }
    const execution = executions.get(executionId);
    if (!execution) {
        return c.json({
            error: 'NotFound',
            message: `Execution not found: ${executionIdParam}`,
            timestamp: Date.now(),
        }, 404);
    }
    // Return status (unwrap branded type for JSON response)
    return c.json({
        executionId: ExecutionId.unwrap(executionId),
        status: execution.status,
        result: execution.status === 'completed' ? execution.result : undefined,
        error: execution.status === 'failed' ? execution.error : undefined,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.completedAt && execution.startedAt
            ? execution.completedAt - execution.startedAt
            : undefined,
    });
});
/**
 * DELETE /async/:executionId - Cancel execution
 */
async.delete('/:executionId', (c) => {
    const executionIdParam = c.req.param('executionId');
    // Validate and convert to branded ExecutionId
    const executionId = ExecutionId.tryCreate(executionIdParam);
    if (!executionId) {
        return c.json({
            error: 'InvalidRequest',
            message: `Invalid execution ID format: ${executionIdParam}`,
            timestamp: Date.now(),
        }, 400);
    }
    const execution = executions.get(executionId);
    if (!execution) {
        return c.json({
            error: 'NotFound',
            message: `Execution not found: ${executionIdParam}`,
            timestamp: Date.now(),
        }, 404);
    }
    // Can only cancel queued or running executions
    if (execution.status !== 'queued' && execution.status !== 'running') {
        return c.json({
            error: 'InvalidState',
            message: `Cannot cancel execution in state: ${execution.status}`,
            timestamp: Date.now(),
        }, 400);
    }
    // Update status to failed (cancellation)
    execution.status = 'failed';
    execution.error = 'Execution cancelled by user';
    execution.completedAt = Date.now();
    return c.json({
        executionId: ExecutionId.unwrap(executionId),
        status: 'cancelled',
        message: 'Execution cancelled successfully',
    });
});
/**
 * Execute asynchronously in background
 */
async function executeAsync(executionId, request, env) {
    const execution = executions.get(executionId);
    if (!execution)
        return;
    try {
        // Update status
        execution.status = 'running';
        execution.startedAt = Date.now();
        // Get built-in registry
        const builtInRegistry = getBuiltInRegistry();
        // Check if agent exists
        if (!builtInRegistry.isBuiltIn(request.agent)) {
            throw new Error(`Agent not found: ${request.agent}`);
        }
        // Get agent metadata
        const metadata = builtInRegistry.getMetadata(request.agent);
        if (!metadata) {
            throw new Error(`Agent metadata not found: ${request.agent}`);
        }
        // Create agent instance
        const agentConfig = {
            name: request.agent,
            operation: metadata.operation,
            config: request.config || {},
        };
        const agent = await builtInRegistry.create(request.agent, agentConfig, env);
        // Create execution context (security features injected by BaseAgent.execute)
        const memberContext = {
            input: request.input,
            env: env,
            ctx: {
                waitUntil: () => { },
                passThroughOnException: () => { },
            },
        };
        // Execute agent
        const result = await agent.execute(memberContext);
        // Update status
        if (result.success) {
            execution.status = 'completed';
            execution.result = result.data;
        }
        else {
            execution.status = 'failed';
            execution.error = result.error || 'Execution failed';
        }
        execution.completedAt = Date.now();
        // Send webhook if configured
        if (request.callbackUrl) {
            await sendWebhook(request.callbackUrl, {
                executionId: ExecutionId.unwrap(executionId),
                status: execution.status,
                result: execution.result,
                error: execution.error,
                duration: execution.completedAt - (execution.startedAt || 0),
            });
        }
    }
    catch (error) {
        // Update status on error
        execution.status = 'failed';
        execution.error = error.message || 'Execution failed';
        execution.completedAt = Date.now();
        // Send webhook on error
        if (request.callbackUrl) {
            await sendWebhook(request.callbackUrl, {
                executionId: ExecutionId.unwrap(executionId),
                status: 'failed',
                error: execution.error,
            });
        }
    }
}
/**
 * Send webhook notification
 */
async function sendWebhook(url, data) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Conductor/1.0',
            },
            body: JSON.stringify(data),
        });
    }
    catch (error) {
        logger.error('Webhook notification failed', error instanceof Error ? error : undefined, {
            url,
        });
    }
}
export default async;
