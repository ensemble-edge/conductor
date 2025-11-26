/**
 * Documentation Routes
 *
 * Auto-generated documentation pages for agents and ensembles.
 * Provides human-readable HTML documentation alongside the JSON API.
 *
 * Routes:
 *   /docs              → Landing page with navigation (or first markdown page)
 *   /docs/:slug        → Markdown pages from docs/ directory
 *   /docs/agents       → List all agents (HTML)
 *   /docs/agents/:name → Individual agent documentation
 *   /docs/ensembles    → List all ensembles (HTML)
 *   /docs/ensembles/:name → Individual ensemble documentation
 *   /docs/api          → Interactive OpenAPI UI
 *   /docs/openapi.json → Raw OpenAPI spec
 *
 * Configuration:
 *   Reads from docs/docs.yaml (preferred) or conductor.config.ts docs section.
 *   Supports: route (path, auth, priority), title, description, logo, favicon, theme, ui framework.
 *
 * The docs/ directory is a first-class component directory:
 *   - docs/docs.yaml → Definition file (like agents have route config)
 *   - docs/*.md → Markdown pages auto-routed to /docs/:slug
 *   - Navigation auto-generated from file structure + frontmatter
 */
import { Hono } from 'hono';
import { getMemberLoader, getEnsembleLoader } from '../auto-discovery.js';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
import { createLogger } from '../../observability/index.js';
import { renderDocsLanding, renderAgentsList, renderAgentDetail, renderEnsemblesList, renderEnsembleDetail, renderOpenAPIUI, getThemeFromConfig, } from './docs-templates.js';
import { getDocsLoader, renderDocsPage, isReservedRoute } from '../../docs/index.js';
const docs = new Hono();
const logger = createLogger({ serviceName: 'api-docs' });
/**
 * Get docs configuration from environment
 * Config can come from conductor.config.ts or docs.yaml
 */
function getDocsConfig(env) {
    // Try to get config from environment (set by config loader)
    const configStr = env.CONDUCTOR_DOCS_CONFIG;
    if (configStr) {
        try {
            return JSON.parse(configStr);
        }
        catch {
            // Invalid config, use defaults
        }
    }
    // Return defaults
    return {
        title: 'API Documentation',
        ui: 'stoplight',
        auth: { requirement: 'public' },
    };
}
/**
 * Get theme from config
 */
function getTheme(env) {
    const config = getDocsConfig(env);
    return getThemeFromConfig(config);
}
/**
 * GET /docs - Documentation landing page
 */
docs.get('/', async (c) => {
    try {
        const theme = getTheme(c.env);
        const memberLoader = getMemberLoader();
        const ensembleLoader = getEnsembleLoader();
        const builtInRegistry = getBuiltInRegistry();
        // Count agents
        const builtInCount = builtInRegistry.list().length;
        const customCount = memberLoader?.getMemberNames().length || 0;
        const totalAgents = builtInCount + customCount;
        // Count ensembles
        const totalEnsembles = ensembleLoader?.getEnsembleNames().length || 0;
        const html = renderDocsLanding({
            title: theme.title || 'API Documentation',
            description: theme.description || 'Auto-generated documentation for your Conductor project',
            agentCount: totalAgents,
            ensembleCount: totalEnsembles,
            builtInAgentCount: builtInCount,
            customAgentCount: customCount,
            theme,
        });
        return c.html(html);
    }
    catch (error) {
        logger.error('Failed to render docs landing', error instanceof Error ? error : undefined);
        return c.text('Failed to load documentation', 500);
    }
});
/**
 * GET /docs/agents - List all agents
 */
docs.get('/agents', async (c) => {
    try {
        const theme = getTheme(c.env);
        const memberLoader = getMemberLoader();
        const builtInRegistry = getBuiltInRegistry();
        // Get built-in agents
        const builtInAgents = builtInRegistry.list().map((metadata) => ({
            name: metadata.name,
            operation: metadata.operation,
            description: metadata.description,
            builtIn: true,
        }));
        // Get custom agents
        const customAgents = [];
        if (memberLoader) {
            for (const name of memberLoader.getMemberNames()) {
                const config = memberLoader.getAgentConfig(name);
                if (config) {
                    customAgents.push({
                        name: config.name,
                        operation: config.operation,
                        description: config.description || '',
                        builtIn: false,
                    });
                }
            }
        }
        const html = renderAgentsList({
            builtInAgents,
            customAgents,
            theme,
        });
        return c.html(html);
    }
    catch (error) {
        logger.error('Failed to render agents list', error instanceof Error ? error : undefined);
        return c.text('Failed to load agents', 500);
    }
});
/**
 * GET /docs/agents/:name - Individual agent documentation
 */
docs.get('/agents/:name', async (c) => {
    const name = c.req.param('name');
    try {
        const theme = getTheme(c.env);
        const builtInRegistry = getBuiltInRegistry();
        const memberLoader = getMemberLoader();
        // Check built-in agents first
        if (builtInRegistry.isBuiltIn(name)) {
            const metadata = builtInRegistry.getMetadata(name);
            if (metadata) {
                const html = renderAgentDetail({
                    name: metadata.name,
                    operation: metadata.operation,
                    description: metadata.description,
                    builtIn: true,
                    configSchema: metadata.configSchema,
                    inputSchema: metadata.inputSchema,
                    outputSchema: metadata.outputSchema,
                    examples: metadata.examples,
                    theme,
                });
                return c.html(html);
            }
        }
        // Check custom agents
        if (memberLoader) {
            const config = memberLoader.getAgentConfig(name);
            if (config) {
                const html = renderAgentDetail({
                    name: config.name,
                    operation: config.operation,
                    description: config.description || '',
                    builtIn: false,
                    configSchema: undefined,
                    inputSchema: config.schema?.input,
                    outputSchema: config.schema?.output,
                    examples: [],
                    config: config.config,
                    theme,
                });
                return c.html(html);
            }
        }
        return c.text(`Agent not found: ${name}`, 404);
    }
    catch (error) {
        logger.error('Failed to render agent detail', error instanceof Error ? error : undefined);
        return c.text('Failed to load agent', 500);
    }
});
/**
 * GET /docs/ensembles - List all ensembles
 */
docs.get('/ensembles', async (c) => {
    try {
        const theme = getTheme(c.env);
        const ensembleLoader = getEnsembleLoader();
        const ensembles = [];
        if (ensembleLoader) {
            for (const loaded of ensembleLoader.getAllLoadedEnsembles()) {
                const config = loaded.config;
                ensembles.push({
                    name: config.name,
                    description: config.description || '',
                    source: loaded.source,
                    triggerCount: config.trigger?.length || 0,
                    stepCount: Array.isArray(config.flow) ? config.flow.length : 0,
                });
            }
        }
        const html = renderEnsemblesList({ ensembles, theme });
        return c.html(html);
    }
    catch (error) {
        logger.error('Failed to render ensembles list', error instanceof Error ? error : undefined);
        return c.text('Failed to load ensembles', 500);
    }
});
/**
 * GET /docs/ensembles/:name - Individual ensemble documentation
 */
docs.get('/ensembles/:name', async (c) => {
    const name = c.req.param('name');
    try {
        const theme = getTheme(c.env);
        const ensembleLoader = getEnsembleLoader();
        if (!ensembleLoader) {
            return c.text(`Ensemble not found: ${name}`, 404);
        }
        const loaded = ensembleLoader.getLoadedEnsemble(name);
        if (!loaded) {
            return c.text(`Ensemble not found: ${name}`, 404);
        }
        const config = loaded.config;
        // Extract trigger info
        const triggers = config.trigger?.map((t) => ({
            type: t.type,
            path: t.path,
            methods: t.methods,
            cron: t.cron,
        })) || [];
        // Extract flow steps
        const steps = Array.isArray(config.flow)
            ? config.flow.map((step, index) => ({
                index,
                type: step.type || 'agent',
                agent: step.agent,
                condition: step.when || step.condition,
            }))
            : [];
        // Extract inline agents
        const inlineAgents = config.agents?.map((a) => ({
            name: a.name,
            operation: a.operation,
        })) || [];
        const html = renderEnsembleDetail({
            name: config.name,
            description: config.description || '',
            source: loaded.source,
            triggers,
            steps,
            inlineAgents,
            inputSchema: config.inputs,
            outputSchema: config.output,
            theme,
        });
        return c.html(html);
    }
    catch (error) {
        logger.error('Failed to render ensemble detail', error instanceof Error ? error : undefined);
        return c.text('Failed to load ensemble', 500);
    }
});
/**
 * GET /docs/api - Interactive OpenAPI UI
 */
docs.get('/api', async (c) => {
    try {
        const config = getDocsConfig(c.env);
        const theme = getThemeFromConfig(config);
        const html = renderOpenAPIUI({
            title: 'API Reference',
            specUrl: '/docs/openapi.json',
            ui: config.ui,
            theme,
        });
        return c.html(html);
    }
    catch (error) {
        logger.error('Failed to render API docs', error instanceof Error ? error : undefined);
        return c.text('Failed to load API documentation', 500);
    }
});
/**
 * GET /docs/openapi.json - OpenAPI specification
 */
docs.get('/openapi.json', async (c) => {
    try {
        const memberLoader = getMemberLoader();
        const ensembleLoader = getEnsembleLoader();
        const builtInRegistry = getBuiltInRegistry();
        // Generate OpenAPI spec from discovered agents and ensembles
        const spec = generateOpenAPISpec({
            builtInAgents: builtInRegistry.list(),
            customAgents: memberLoader?.getMemberNames().map((n) => memberLoader.getAgentConfig(n)) || [],
            ensembles: ensembleLoader?.getAllEnsembles() || [],
        });
        return c.json(spec);
    }
    catch (error) {
        logger.error('Failed to generate OpenAPI spec', error instanceof Error ? error : undefined);
        return c.json({ error: 'Failed to generate specification' }, 500);
    }
});
/**
 * Generate OpenAPI specification from discovered components
 */
function generateOpenAPISpec(data) {
    const paths = {};
    // Add execute endpoint for each ensemble
    for (const ensemble of data.ensembles) {
        const ensembleName = ensemble.name;
        paths[`/api/v1/execute/ensemble/${ensembleName}`] = {
            post: {
                summary: `Execute ${ensembleName}`,
                description: ensemble.description || `Execute the ${ensembleName} ensemble`,
                operationId: `execute_ensemble_${ensembleName.replace(/-/g, '_')}`,
                tags: ['Execute'],
                security: [{ bearerAuth: [] }, { apiKey: [] }],
                requestBody: {
                    required: false,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    input: {
                                        type: 'object',
                                        description: 'Input data for the ensemble',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Successful execution',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        output: { type: 'object' },
                                        metadata: {
                                            type: 'object',
                                            properties: {
                                                executionId: { type: 'string' },
                                                duration: { type: 'number' },
                                                timestamp: { type: 'number' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid input' },
                    '401': { description: 'Unauthorized - authentication required' },
                    '403': { description: 'Forbidden - missing required permission' },
                    '404': { description: 'Ensemble not found' },
                    '500': { description: 'Execution error' },
                },
            },
        };
    }
    // Add execute endpoint for each agent (built-in and custom)
    const allAgents = [...data.builtInAgents, ...data.customAgents];
    for (const agent of allAgents) {
        const agentName = agent.name;
        const isBuiltIn = data.builtInAgents.some((a) => a.name === agentName);
        paths[`/api/v1/execute/agent/${agentName}`] = {
            post: {
                summary: `Execute ${agentName} agent`,
                description: agent.description || `Execute the ${agentName} agent${isBuiltIn ? ' (built-in)' : ''}`,
                operationId: `execute_agent_${agentName.replace(/-/g, '_')}`,
                tags: ['Execute'],
                security: [{ bearerAuth: [] }, { apiKey: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['input'],
                                properties: {
                                    input: {
                                        type: 'object',
                                        description: 'Input data for the agent',
                                    },
                                    config: {
                                        type: 'object',
                                        description: 'Optional configuration overrides',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Successful execution',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { type: 'object' },
                                        metadata: {
                                            type: 'object',
                                            properties: {
                                                executionId: { type: 'string' },
                                                duration: { type: 'number' },
                                                timestamp: { type: 'number' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: 'Invalid input' },
                    '401': { description: 'Unauthorized - authentication required' },
                    '403': {
                        description: 'Forbidden - direct agent execution disabled or missing required permission',
                    },
                    '404': { description: 'Agent not found' },
                    '500': { description: 'Execution error' },
                },
            },
        };
    }
    // Add agent metadata endpoints
    paths['/api/v1/agents'] = {
        get: {
            summary: 'List all agents',
            description: 'Returns a list of all available agents (built-in and custom)',
            operationId: 'listAgents',
            tags: ['Agents'],
            responses: {
                '200': {
                    description: 'List of agents',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    agents: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                operation: { type: 'string' },
                                                description: { type: 'string' },
                                                builtIn: { type: 'boolean' },
                                            },
                                        },
                                    },
                                    count: { type: 'number' },
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    paths['/api/v1/agents/{name}'] = {
        get: {
            summary: 'Get agent details',
            description: 'Returns detailed information about a specific agent',
            operationId: 'getAgent',
            tags: ['Agents'],
            parameters: [
                {
                    name: 'name',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Agent name',
                },
            ],
            responses: {
                '200': {
                    description: 'Agent details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    operation: { type: 'string' },
                                    description: { type: 'string' },
                                    builtIn: { type: 'boolean' },
                                    config: { type: 'object' },
                                    input: { type: 'object' },
                                    output: { type: 'object' },
                                },
                            },
                        },
                    },
                },
                '404': { description: 'Agent not found' },
            },
        },
    };
    // Add ensembles endpoints
    paths['/api/v1/ensembles'] = {
        get: {
            summary: 'List all ensembles',
            description: 'Returns a list of all available ensembles',
            operationId: 'listEnsembles',
            tags: ['Ensembles'],
            responses: {
                '200': {
                    description: 'List of ensembles',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    ensembles: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                description: { type: 'string' },
                                                source: { type: 'string', enum: ['yaml', 'typescript'] },
                                            },
                                        },
                                    },
                                    count: { type: 'number' },
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    paths['/api/v1/ensembles/{name}'] = {
        get: {
            summary: 'Get ensemble details',
            description: 'Returns detailed information about a specific ensemble',
            operationId: 'getEnsemble',
            tags: ['Ensembles'],
            parameters: [
                {
                    name: 'name',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Ensemble name',
                },
            ],
            responses: {
                '200': {
                    description: 'Ensemble details',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    triggers: { type: 'array' },
                                    flow: { type: 'array' },
                                    input: { type: 'object' },
                                    output: { type: 'object' },
                                },
                            },
                        },
                    },
                },
                '404': { description: 'Ensemble not found' },
            },
        },
    };
    return {
        openapi: '3.1.0',
        info: {
            title: 'Conductor API',
            version: '1.0.0',
            description: 'Auto-generated API documentation for your Conductor project. Conductor is an agentic workflow orchestration framework for Cloudflare Workers.',
        },
        servers: [
            {
                url: '/',
                description: 'Current server',
            },
        ],
        tags: [
            {
                name: 'Execute',
                description: 'Execute agents and ensembles. Requires authentication (Bearer token or API key).',
            },
            {
                name: 'Agents',
                description: 'Agent discovery and metadata',
            },
            {
                name: 'Ensembles',
                description: 'Ensemble discovery and metadata',
            },
        ],
        paths,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                apiKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                },
            },
        },
    };
}
/**
 * GET /docs/:slug - Serve markdown pages from docs/ directory
 *
 * This is the catch-all route for markdown pages.
 * Reserved slugs (agents, ensembles, api) are handled by specific routes above.
 */
docs.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    // Skip reserved routes (handled by specific routes above)
    if (isReservedRoute(slug)) {
        return c.text('Not found', 404);
    }
    try {
        const docsLoader = getDocsLoader();
        // Check if docs loader is initialized with pages
        if (!docsLoader.isInitialized() || docsLoader.getPageCount() === 0) {
            return c.text(`Page not found: ${slug}`, 404);
        }
        // Try to render the page
        const result = await docsLoader.renderPage(slug);
        if (!result) {
            return c.text(`Page not found: ${slug}`, 404);
        }
        const { content, page } = result;
        const definition = docsLoader.getDefinition();
        const theme = getThemeFromConfig(definition);
        const basePath = docsLoader.getBasePath();
        const navigation = docsLoader.buildNavigation(slug);
        // Find previous and next pages for navigation
        const sortedPages = docsLoader.getSortedPages();
        const currentIndex = sortedPages.findIndex((p) => p.slug === slug);
        const prevPage = currentIndex > 0
            ? {
                slug: sortedPages[currentIndex - 1].slug,
                title: sortedPages[currentIndex - 1].title,
                path: `${basePath}/${sortedPages[currentIndex - 1].slug}`,
            }
            : undefined;
        const nextPage = currentIndex < sortedPages.length - 1
            ? {
                slug: sortedPages[currentIndex + 1].slug,
                title: sortedPages[currentIndex + 1].title,
                path: `${basePath}/${sortedPages[currentIndex + 1].slug}`,
            }
            : undefined;
        const html = renderDocsPage({
            page,
            renderedContent: content,
            navigation,
            basePath,
            theme,
            definition,
            prevPage,
            nextPage,
        });
        return c.html(html);
    }
    catch (error) {
        logger.error('Failed to render markdown page', error instanceof Error ? error : undefined);
        return c.text('Failed to load page', 500);
    }
});
export default docs;
