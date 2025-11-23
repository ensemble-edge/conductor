/**
 * Execute Routes
 *
 * Endpoints for executing agents synchronously and asynchronously.
 */
import { Hono } from 'hono';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
import { createLogger } from '../../observability/index.js';
const execute = new Hono();
const logger = createLogger({ serviceName: 'api-execute' });
/**
 * POST /execute - Execute a agent synchronously
 */
execute.post('/', async (c) => {
    const startTime = Date.now();
    const auth = c.get('auth');
    const requestId = c.get('requestId');
    // Parse request body
    const body = await c.req.json();
    // Validate request
    if (!body.agent) {
        return c.json({
            error: 'ValidationError',
            message: 'Agent name is required',
            timestamp: Date.now(),
        }, 400);
    }
    if (!body.input) {
        return c.json({
            error: 'ValidationError',
            message: 'Input is required',
            timestamp: Date.now(),
        }, 400);
    }
    try {
        // Get built-in registry
        const builtInRegistry = getBuiltInRegistry();
        // Check if agent exists
        if (!builtInRegistry.isBuiltIn(body.agent)) {
            return c.json({
                error: 'MemberNotFound',
                message: `Agent not found: ${body.agent}`,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Get agent metadata
        const metadata = builtInRegistry.getMetadata(body.agent);
        if (!metadata) {
            return c.json({
                error: 'MemberNotFound',
                message: `Agent metadata not found: ${body.agent}`,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Create agent instance
        const agentConfig = {
            name: body.agent,
            operation: metadata.operation,
            config: body.config || {},
        };
        const agent = builtInRegistry.create(body.agent, agentConfig, c.env);
        // Create execution context
        const memberContext = {
            input: body.input,
            env: c.env,
            ctx: c.executionCtx,
        };
        // Execute agent
        const result = await agent.execute(memberContext);
        // Check if execution was successful
        if (!result.success) {
            return c.json({
                error: 'ExecutionError',
                message: result.error || 'Execution failed',
                timestamp: Date.now(),
                requestId,
            }, 500);
        }
        // Return success response
        const response = {
            success: true,
            data: result.data,
            metadata: {
                executionId: requestId || 'unknown',
                duration: Date.now() - startTime,
                timestamp: Date.now(),
            },
        };
        return c.json(response);
    }
    catch (error) {
        logger.error('Agent execution failed', error instanceof Error ? error : undefined, {
            requestId,
            agentName: body?.agent || 'unknown',
        });
        return c.json({
            error: 'ExecutionError',
            message: error.message || 'Execution failed',
            timestamp: Date.now(),
            requestId,
        }, 500);
    }
});
export default execute;
