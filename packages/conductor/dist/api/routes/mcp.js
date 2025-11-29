/**
 * MCP Server Routes
 *
 * Expose Conductor ensembles as MCP (Model Context Protocol) tools.
 *
 * Endpoints:
 * - GET  /mcp/tools            - List all available tools (manifest)
 * - POST /mcp/tools/{name}     - Invoke a tool (execute ensemble)
 */
import { Hono } from 'hono';
import { CatalogLoader } from '../../runtime/catalog-loader.js';
import { Executor } from '../../runtime/executor.js';
import { createLogger } from '../../observability/index.js';
// Use full ConductorContext typing for proper variable access
const app = new Hono();
const logger = createLogger({ serviceName: 'api-mcp' });
/**
 * List all available MCP tools
 * GET /mcp/tools
 *
 * Returns a manifest of all ensembles exposed as MCP tools
 */
app.get('/tools', async (c) => {
    const env = c.env;
    try {
        // TODO: Load all ensemble configurations from KV or catalog
        // For now, return a mock response showing the expected format
        const tools = await discoverExposedEnsembles(env);
        return c.json({
            tools,
        });
    }
    catch (error) {
        logger.error('Failed to list MCP tools', error instanceof Error ? error : undefined);
        return c.json({
            error: 'Failed to list MCP tools',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});
/**
 * Invoke an MCP tool (execute ensemble)
 * POST /mcp/tools/{name}
 *
 * Executes an ensemble exposed as an MCP tool
 */
app.post('/tools/:name', async (c) => {
    const ensembleName = c.req.param('name');
    const env = c.env;
    try {
        // Get request body (MCP tool invocation format)
        const body = await c.req.json().catch(() => ({}));
        const toolArgs = body.arguments || {};
        // Load ensemble configuration from catalog
        const ensemble = await loadEnsembleConfig(ensembleName, env);
        if (!ensemble) {
            return c.json({
                error: 'Ensemble not found',
                ensemble: ensembleName,
            }, 404);
        }
        // Check if ensemble is exposed as MCP tool
        const mcpExpose = ensemble.trigger?.find((exp) => exp.type === 'mcp');
        if (!mcpExpose) {
            return c.json({
                error: 'Ensemble is not exposed as an MCP tool',
                ensemble: ensembleName,
            }, 404);
        }
        // Authenticate if not public
        if (!mcpExpose.public) {
            if (!mcpExpose.auth) {
                return c.json({
                    error: 'MCP tool requires authentication but none configured',
                    ensemble: ensembleName,
                }, 500);
            }
            const authResult = await authenticateMCP(c, mcpExpose.auth, env);
            if (!authResult.success) {
                return c.json({
                    error: 'MCP authentication failed',
                    message: authResult.error,
                }, 401);
            }
        }
        // Execute ensemble
        const ctx = {
            waitUntil: (promise) => { },
            passThroughOnException: () => { },
        };
        const auth = c.get('auth');
        const executor = new Executor({ env, ctx, auth });
        const result = await executor.executeEnsemble(ensemble, toolArgs);
        if (!result.success) {
            return c.json({
                content: [
                    {
                        type: 'text',
                        text: `Execution failed: ${result.error.message}`,
                    },
                ],
                isError: true,
            });
        }
        // Format output in MCP response format
        const output = result.value.output;
        // Convert output to MCP content format
        const content = formatMCPContent(output);
        return c.json({
            content,
            isError: false,
        });
    }
    catch (error) {
        logger.error('MCP tool invocation failed', error instanceof Error ? error : undefined, {
            ensembleName,
        });
        return c.json({
            content: [
                {
                    type: 'text',
                    text: `Tool invocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
            ],
            isError: true,
        });
    }
});
/**
 * Discover all ensembles exposed as MCP tools
 */
async function discoverExposedEnsembles(env) {
    // Load all ensembles from catalog
    const allEnsembles = await CatalogLoader.loadAllEnsembles(env);
    // Filter for those with MCP triggers and convert to MCP tool format
    const tools = [];
    for (const ensemble of allEnsembles) {
        // Check if ensemble has MCP trigger
        const mcpTrigger = ensemble.trigger?.find((t) => t.type === 'mcp');
        if (!mcpTrigger)
            continue;
        // Build input schema from ensemble's input definition
        const inputSchema = buildInputSchema(ensemble);
        tools.push({
            name: ensemble.name,
            description: ensemble.description || `Execute the ${ensemble.name} ensemble`,
            inputSchema,
        });
    }
    logger.info('Discovered MCP tools', { count: tools.length });
    return tools;
}
/**
 * Build MCP input schema from ensemble configuration
 */
function buildInputSchema(ensemble) {
    const properties = {};
    const required = [];
    // Check if ensemble has inputs schema defined
    if (ensemble.inputs && typeof ensemble.inputs === 'object') {
        // Handle Zod-like schema or plain object schema
        for (const [key, value] of Object.entries(ensemble.inputs)) {
            if (typeof value === 'object' && value !== null) {
                const fieldDef = value;
                // Map common schema types to JSON Schema
                const jsonSchemaType = mapToJSONSchemaType(fieldDef.type);
                properties[key] = {
                    type: jsonSchemaType,
                    description: fieldDef.description || `Input field: ${key}`,
                };
                // Check if field is required (default to required if not specified)
                if (fieldDef.required !== false && fieldDef.optional !== true) {
                    required.push(key);
                }
            }
            else {
                // Simple type inference
                properties[key] = {
                    type: typeof value === 'string' ? value : 'string',
                    description: `Input field: ${key}`,
                };
            }
        }
    }
    return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
    };
}
/**
 * Map Conductor schema types to JSON Schema types
 */
function mapToJSONSchemaType(type) {
    if (!type)
        return 'string';
    const typeMap = {
        string: 'string',
        number: 'number',
        integer: 'integer',
        boolean: 'boolean',
        object: 'object',
        array: 'array',
        // Zod-like types
        z_string: 'string',
        z_number: 'number',
        z_boolean: 'boolean',
        z_object: 'object',
        z_array: 'array',
    };
    return typeMap[type.toLowerCase()] || 'string';
}
/**
 * Load ensemble configuration from storage
 */
async function loadEnsembleConfig(name, env) {
    return CatalogLoader.loadEnsemble(env, name);
}
/**
 * Format ensemble output as MCP content
 */
function formatMCPContent(output) {
    // If output is a string, return as text content
    if (typeof output === 'string') {
        return [{ type: 'text', text: output }];
    }
    // If output is an object, stringify it
    if (typeof output === 'object') {
        return [
            {
                type: 'text',
                text: JSON.stringify(output, null, 2),
            },
        ];
    }
    // Default: convert to string
    return [{ type: 'text', text: String(output) }];
}
/**
 * Authenticate MCP request
 *
 * Supports:
 * - bearer: Simple bearer token comparison or JWT validation (if JWT_SECRET is set)
 * - oauth: OAuth2 bearer token (validates format, full OAuth requires external provider)
 */
async function authenticateMCP(c, auth, env) {
    const ctx = c;
    const authHeader = ctx.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid Authorization header' };
    }
    const token = authHeader.substring(7);
    if (auth.type === 'bearer') {
        // If a specific secret is configured, validate against it
        if (auth.secret) {
            // Resolve environment variable references ($env.VAR_NAME)
            const resolvedSecret = resolveEnvValue(auth.secret, env);
            if (token !== resolvedSecret) {
                return { success: false, error: 'Invalid bearer token' };
            }
            return { success: true };
        }
        // If JWT_SECRET is configured, use JWT validation
        if (env.JWT_SECRET) {
            try {
                // Import JWT validation dynamically to avoid circular deps
                const { BearerValidator } = await import('../../auth/providers/bearer.js');
                const validator = new BearerValidator({
                    secret: env.JWT_SECRET,
                    issuer: env.JWT_ISSUER,
                    audience: env.JWT_AUDIENCE,
                });
                const request = new Request('http://localhost', {
                    headers: { Authorization: authHeader },
                });
                const result = await validator.validate(request, env);
                if (!result.valid) {
                    return { success: false, error: result.message || 'Invalid JWT token' };
                }
                return { success: true };
            }
            catch (error) {
                logger.error('JWT validation failed', error instanceof Error ? error : undefined);
                return { success: false, error: 'JWT validation failed' };
            }
        }
        // No secret configured - accept any bearer token (development mode)
        logger.warn('MCP bearer auth with no secret configured - accepting any token');
        return { success: true };
    }
    if (auth.type === 'oauth') {
        // OAuth validation requires an external OAuth provider
        // For now, validate the token format and accept it
        // Full OAuth would require:
        // 1. Token introspection endpoint
        // 2. JWKS validation for RS256 tokens
        // 3. Scope checking
        if (!token || token.length < 10) {
            return { success: false, error: 'Invalid OAuth token format' };
        }
        // If it looks like a JWT, try to validate it
        if (token.split('.').length === 3 && env.JWT_SECRET) {
            try {
                const { BearerValidator } = await import('../../auth/providers/bearer.js');
                const validator = new BearerValidator({
                    secret: env.JWT_SECRET,
                    issuer: env.JWT_ISSUER,
                    audience: env.JWT_AUDIENCE,
                });
                const request = new Request('http://localhost', {
                    headers: { Authorization: authHeader },
                });
                const result = await validator.validate(request, env);
                if (!result.valid) {
                    return { success: false, error: result.message || 'Invalid OAuth token' };
                }
                return { success: true };
            }
            catch {
                // Fall through to accepting the token
            }
        }
        logger.info('OAuth token accepted (no full validation configured)');
        return { success: true };
    }
    return { success: false, error: 'Unknown auth type' };
}
/**
 * Resolve environment variable references in a value
 * Supports: $env.VAR_NAME and ${env.VAR_NAME}
 */
function resolveEnvValue(value, env) {
    // Match $env.VAR_NAME
    const shorthandMatch = value.match(/^\$env\.(\w+)$/);
    if (shorthandMatch) {
        return env[shorthandMatch[1]] ?? value;
    }
    // Match ${env.VAR_NAME}
    const templateMatch = value.match(/^\$\{env\.(\w+)\}$/);
    if (templateMatch) {
        return env[templateMatch[1]] ?? value;
    }
    return value;
}
export default app;
