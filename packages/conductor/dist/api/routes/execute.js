/**
 * Execute Routes
 *
 * Endpoints for executing agents and ensembles synchronously.
 */
import { Hono } from 'hono';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
import { getMemberLoader, getEnsembleLoader } from '../auto-discovery.js';
import { Executor } from '../../runtime/executor.js';
import { createLogger } from '../../observability/index.js';
const execute = new Hono();
const logger = createLogger({ serviceName: 'api-execute' });
/**
 * POST /:ensembleName - Execute an ensemble synchronously
 */
execute.post('/:ensembleName', async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');
    const ensembleName = c.req.param('ensembleName');
    // Parse request body
    const body = await c.req.json();
    try {
        // Get ensemble loader
        const ensembleLoader = getEnsembleLoader();
        if (!ensembleLoader) {
            return c.json({
                error: 'NotInitialized',
                message: 'Ensemble loader not initialized',
                timestamp: Date.now(),
                requestId,
            }, 503);
        }
        // Check if ensemble exists
        const ensemble = ensembleLoader.getEnsemble(ensembleName);
        if (!ensemble) {
            return c.json({
                error: 'NotFound',
                message: `Ensemble not found: ${ensembleName}`,
                path: `/api/v1/execute/${ensembleName}`,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Create executor
        const executor = new Executor({
            env: c.env,
            ctx: c.executionCtx,
        });
        // Register all agents from memberLoader
        const memberLoader = getMemberLoader();
        if (memberLoader) {
            for (const agent of memberLoader.getAllMembers()) {
                executor.registerAgent(agent);
            }
        }
        // Execute ensemble
        const result = await executor.executeEnsemble(ensemble, body.input || {});
        // Handle Result type - unwrap or return error
        if (!result.success) {
            return c.json({
                error: 'ExecutionError',
                message: result.error.message,
                code: result.error.code,
                timestamp: Date.now(),
                requestId,
            }, 500);
        }
        // Return response
        return c.json({
            success: true,
            output: result.value.output,
            metadata: {
                executionId: requestId || 'unknown',
                duration: Date.now() - startTime,
                timestamp: Date.now(),
            },
        });
    }
    catch (error) {
        logger.error('Ensemble execution failed', error instanceof Error ? error : undefined, {
            requestId,
            ensembleName,
        });
        return c.json({
            error: 'ExecutionError',
            message: error.message || 'Execution failed',
            timestamp: Date.now(),
            requestId,
        }, 500);
    }
});
/**
 * POST / - Execute a agent synchronously (legacy, body-based routing)
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
        // Get member loader for custom agents
        const memberLoader = getMemberLoader();
        // Check if agent exists (built-in or custom)
        const isBuiltIn = builtInRegistry.isBuiltIn(body.agent);
        const isCustom = memberLoader?.hasMember(body.agent) || false;
        if (!isBuiltIn && !isCustom) {
            return c.json({
                error: 'MemberNotFound',
                message: `Agent not found: ${body.agent}`,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Get agent instance
        let agent;
        if (isBuiltIn) {
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
            // Create agent instance from built-in registry
            const agentConfig = {
                name: body.agent,
                operation: metadata.operation,
                config: body.config || {},
            };
            agent = builtInRegistry.create(body.agent, agentConfig, c.env);
        }
        else {
            // Get custom agent from member loader
            agent = memberLoader.getAgent(body.agent);
            if (!agent) {
                return c.json({
                    error: 'MemberNotFound',
                    message: `Agent instance not found: ${body.agent}`,
                    timestamp: Date.now(),
                    requestId,
                }, 404);
            }
        }
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
