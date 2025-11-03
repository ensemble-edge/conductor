/**
 * Execute Routes
 *
 * Endpoints for executing members synchronously and asynchronously.
 */
import { Hono } from 'hono';
import { getBuiltInRegistry } from '../../members/built-in/registry';
import { createLogger } from '../../observability';
const execute = new Hono();
const logger = createLogger({ serviceName: 'api-execute' });
/**
 * POST /execute - Execute a member synchronously
 */
execute.post('/', async (c) => {
    const startTime = Date.now();
    const auth = c.get('auth');
    const requestId = c.get('requestId');
    // Parse request body
    const body = await c.req.json();
    // Validate request
    if (!body.member) {
        return c.json({
            error: 'ValidationError',
            message: 'Member name is required',
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
        // Check if member exists
        if (!builtInRegistry.isBuiltIn(body.member)) {
            return c.json({
                error: 'MemberNotFound',
                message: `Member not found: ${body.member}`,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Get member metadata
        const metadata = builtInRegistry.getMetadata(body.member);
        if (!metadata) {
            return c.json({
                error: 'MemberNotFound',
                message: `Member metadata not found: ${body.member}`,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Create member instance
        const memberConfig = {
            name: body.member,
            type: metadata.type,
            config: body.config || {},
        };
        const member = builtInRegistry.create(body.member, memberConfig, c.env);
        // Create execution context
        const memberContext = {
            input: body.input,
            env: c.env,
            ctx: c.executionCtx,
        };
        // Execute member
        const result = await member.execute(memberContext);
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
        logger.error('Member execution failed', error instanceof Error ? error : undefined, {
            requestId,
            memberName: body?.member || 'unknown',
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
