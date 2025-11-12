/**
 * Members Routes
 *
 * Endpoints for listing and discovering agents.
 */
import { Hono } from 'hono';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
import { createLogger } from '../../observability/index.js';
const agents = new Hono();
const logger = createLogger({ serviceName: 'api-agents' });
/**
 * GET /agents - List all available agents
 */
agents.get('/', async (c) => {
    try {
        const builtInRegistry = getBuiltInRegistry();
        const builtInMembers = builtInRegistry.list();
        // Map to response format
        const membersList = builtInMembers.map((metadata) => ({
            name: metadata.name,
            operation: metadata.operation,
            version: metadata.version,
            description: metadata.description,
            builtIn: true,
        }));
        // TODO: Add user-defined agents from database
        const response = {
            agents: membersList,
            count: membersList.length,
        };
        return c.json(response);
    }
    catch (error) {
        logger.error('Failed to list agents', error instanceof Error ? error : undefined, {
            requestId: c.get('requestId'),
        });
        return c.json({
            error: 'InternalServerError',
            message: 'Failed to list agents',
            timestamp: Date.now(),
        }, 500);
    }
});
/**
 * GET /agents/:name - Get agent details
 */
agents.get('/:name', async (c) => {
    const name = c.req.param('name');
    try {
        const builtInRegistry = getBuiltInRegistry();
        // Check if it's a built-in agent
        if (builtInRegistry.isBuiltIn(name)) {
            const metadata = builtInRegistry.getMetadata(name);
            if (!metadata) {
                return c.json({
                    error: 'NotFound',
                    message: `Agent not found: ${name}`,
                    timestamp: Date.now(),
                }, 404);
            }
            const response = {
                name: metadata.name,
                operation: metadata.operation,
                version: metadata.version,
                description: metadata.description,
                builtIn: true,
                config: {
                    schema: metadata.configSchema,
                    defaults: {},
                },
                input: {
                    schema: metadata.inputSchema,
                    examples: metadata.examples,
                },
                output: {
                    schema: metadata.outputSchema,
                },
            };
            return c.json(response);
        }
        // TODO: Check user-defined agents from database
        return c.json({
            error: 'NotFound',
            message: `Agent not found: ${name}`,
            timestamp: Date.now(),
        }, 404);
    }
    catch (error) {
        logger.error('Failed to get agent details', error instanceof Error ? error : undefined, {
            requestId: c.get('requestId'),
            agentName: c.req.param('name'),
        });
        return c.json({
            error: 'InternalServerError',
            message: 'Failed to get agent details',
            timestamp: Date.now(),
        }, 500);
    }
});
export default agents;
