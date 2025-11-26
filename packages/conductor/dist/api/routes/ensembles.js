/**
 * Ensembles Routes
 *
 * Endpoints for listing and discovering ensembles.
 */
import { Hono } from 'hono';
import { getEnsembleLoader } from '../auto-discovery.js';
import { createLogger } from '../../observability/index.js';
const ensembles = new Hono();
const logger = createLogger({ serviceName: 'api-ensembles' });
/**
 * GET /ensembles - List all available ensembles
 */
ensembles.get('/', async (c) => {
    try {
        const ensembleLoader = getEnsembleLoader();
        if (!ensembleLoader) {
            return c.json({
                ensembles: [],
                count: 0,
            });
        }
        const loadedEnsembles = ensembleLoader.getAllLoadedEnsembles();
        const ensemblesList = loadedEnsembles.map((loaded) => {
            const config = loaded.config;
            // Extract trigger info
            const triggers = config.trigger?.map((t) => ({
                type: t.type,
                path: t.path,
                cron: t.cron,
            }));
            // Count steps in flow
            const stepCount = Array.isArray(config.flow) ? config.flow.length : 0;
            // Count inline agents
            const agentCount = Array.isArray(config.agents) ? config.agents.length : 0;
            return {
                name: config.name,
                description: config.description,
                version: '1.0.0', // Version not stored in config schema
                source: loaded.source,
                triggers,
                agentCount,
                stepCount,
            };
        });
        const response = {
            ensembles: ensemblesList,
            count: ensemblesList.length,
        };
        return c.json(response);
    }
    catch (error) {
        logger.error('Failed to list ensembles', error instanceof Error ? error : undefined, {
            requestId: c.get('requestId'),
        });
        return c.json({
            error: 'InternalServerError',
            message: 'Failed to list ensembles',
            timestamp: Date.now(),
        }, 500);
    }
});
/**
 * GET /ensembles/:name - Get ensemble details
 */
ensembles.get('/:name', async (c) => {
    const name = c.req.param('name');
    try {
        const ensembleLoader = getEnsembleLoader();
        if (!ensembleLoader) {
            return c.json({
                error: 'NotFound',
                message: `Ensemble not found: ${name}`,
                timestamp: Date.now(),
            }, 404);
        }
        const loaded = ensembleLoader.getLoadedEnsemble(name);
        if (!loaded) {
            return c.json({
                error: 'NotFound',
                message: `Ensemble not found: ${name}`,
                timestamp: Date.now(),
            }, 404);
        }
        const config = loaded.config;
        // Extract trigger info with full details
        const triggers = config.trigger?.map((t) => ({
            type: t.type,
            path: t.path,
            method: t.method,
            cron: t.cron,
        }));
        // Extract inline agent info
        const agents = config.agents?.map((a) => ({
            name: a.name,
            operation: a.operation,
        }));
        // Map flow steps
        const flow = Array.isArray(config.flow)
            ? config.flow.map((step) => {
                if (step.agent) {
                    return {
                        type: 'agent',
                        agent: step.agent,
                        input: step.input,
                        when: step.when,
                        retry: step.retry,
                        timeout: step.timeout,
                    };
                }
                if (step.type) {
                    return {
                        type: step.type,
                        ...step,
                    };
                }
                return step;
            })
            : [];
        const response = {
            name: config.name,
            description: config.description,
            version: '1.0.0', // Version not stored in config schema
            source: loaded.source,
            triggers,
            input: config.inputs
                ? {
                    schema: config.inputs,
                }
                : undefined,
            output: config.output
                ? {
                    schema: config.output,
                }
                : undefined,
            agents,
            flow,
        };
        return c.json(response);
    }
    catch (error) {
        logger.error('Failed to get ensemble details', error instanceof Error ? error : undefined, {
            requestId: c.get('requestId'),
            ensembleName: name,
        });
        return c.json({
            error: 'InternalServerError',
            message: 'Failed to get ensemble details',
            timestamp: Date.now(),
        }, 500);
    }
});
export default ensembles;
