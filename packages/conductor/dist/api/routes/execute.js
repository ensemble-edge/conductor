/**
 * Execute Routes
 *
 * Endpoints for executing agents and ensembles synchronously.
 *
 * Route structure:
 * - POST /ensemble/:name - Execute ensemble by name (URL-based, preferred)
 * - POST /agent/:name - Execute agent by name (URL-based, if allowed)
 * - POST / - Execute by body { agent: "name" } or { ensemble: "name" } (legacy)
 * - POST /:name - Execute ensemble by name (legacy, for backward compat)
 */
import { Hono } from 'hono';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
import { getMemberLoader, getEnsembleLoader } from '../auto-discovery.js';
import { Executor } from '../../runtime/executor.js';
import { createLogger } from '../../observability/index.js';
import { isDirectAgentExecutionAllowed, getRequiredPermission, DEFAULT_SECURITY_CONFIG, } from '../../config/security.js';
import { hasPermission } from '../../auth/permissions.js';
const execute = new Hono();
const logger = createLogger({ serviceName: 'api-execute' });
/**
 * Get security config from context, falling back to defaults
 */
function getSecurityConfigFromContext(c) {
    return c.get('securityConfig') || DEFAULT_SECURITY_CONFIG;
}
/**
 * Default API config when none is provided
 */
const DEFAULT_API_CONFIG = {
    execution: {
        agents: { requireExplicit: false },
        ensembles: { requireExplicit: false },
    },
};
/**
 * Get API config from context, falling back to defaults
 */
function getApiConfigFromContext(c) {
    return c.get('apiConfig') || DEFAULT_API_CONFIG;
}
/**
 * Check if an ensemble is API executable based on config and ensemble settings
 *
 * Logic:
 * - If requireExplicit: false (default) → executable unless apiExecutable: false
 * - If requireExplicit: true → only executable if apiExecutable: true
 */
function isEnsembleApiExecutable(ensemble, apiConfig) {
    const requireExplicit = apiConfig.execution?.ensembles?.requireExplicit ?? false;
    if (requireExplicit) {
        // Strict mode: must explicitly opt-in
        return ensemble.apiExecutable === true;
    }
    else {
        // Permissive mode (default): executable unless explicitly disabled
        return ensemble.apiExecutable !== false;
    }
}
/**
 * Check if an agent is API executable based on config and agent settings
 *
 * Logic:
 * - If requireExplicit: false (default) → executable unless apiExecutable: false
 * - If requireExplicit: true → only executable if apiExecutable: true
 */
function isAgentApiExecutable(agentConfig, apiConfig) {
    const requireExplicit = apiConfig.execution?.agents?.requireExplicit ?? false;
    if (requireExplicit) {
        // Strict mode: must explicitly opt-in
        return agentConfig.apiExecutable === true;
    }
    else {
        // Permissive mode (default): executable unless explicitly disabled
        return agentConfig.apiExecutable !== false;
    }
}
/**
 * Check if user has required permission for resource
 * Returns error response if permission check fails, null if allowed
 */
function checkPermission(c, securityConfig, resourceType, resourceName, requestId) {
    const requiredPerm = getRequiredPermission(securityConfig, resourceType, resourceName);
    // No auto-permissions configured
    if (!requiredPerm) {
        return null;
    }
    // Get user permissions from auth context
    const auth = c.get('auth');
    const userPermissions = auth?.user?.permissions || [];
    // Check permission
    if (!hasPermission(userPermissions, requiredPerm)) {
        return c.json({
            error: 'Forbidden',
            message: `Missing required permission: ${requiredPerm}`,
            timestamp: Date.now(),
            requestId,
        }, 403);
    }
    return null;
}
/**
 * Helper function to execute an ensemble
 * Shared logic between all ensemble execution routes
 */
async function executeEnsemble(c, ensembleName, input, startTime, requestId, routePath) {
    // Get security config from context
    const securityConfig = getSecurityConfigFromContext(c);
    // Check permission
    const permError = checkPermission(c, securityConfig, 'ensemble', ensembleName, requestId);
    if (permError)
        return permError;
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
                path: routePath,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Check if ensemble is API executable
        const apiConfig = getApiConfigFromContext(c);
        if (!isEnsembleApiExecutable(ensemble, apiConfig)) {
            const requireExplicit = apiConfig.execution?.ensembles?.requireExplicit ?? false;
            const message = requireExplicit
                ? `Ensemble '${ensembleName}' is not API executable. Set apiExecutable: true in the ensemble definition, or set api.execution.ensembles.requireExplicit: false in conductor config to make all ensembles executable by default.`
                : `Ensemble '${ensembleName}' has API execution explicitly disabled via apiExecutable: false.`;
            return c.json({
                success: false,
                error: {
                    code: 'EXECUTION_NOT_ALLOWED',
                    message,
                },
            }, 403);
        }
        // Create executor with auth context
        const auth = c.get('auth');
        const executor = new Executor({
            env: c.env,
            ctx: c.executionCtx,
            auth,
        });
        // Register all agents from memberLoader
        const memberLoader = getMemberLoader();
        if (memberLoader) {
            for (const agent of memberLoader.getAllMembers()) {
                executor.registerAgent(agent);
            }
        }
        // Execute ensemble
        const result = await executor.executeEnsemble(ensemble, input);
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
        // Build response using response metadata (status, headers, redirect, rawBody)
        const response = result.value.response;
        const status = response?.status || 200;
        // Handle redirect responses
        if (response?.redirect) {
            const redirectStatus = response.redirect.status || 302;
            const headers = new Headers(response.headers || {});
            headers.set('Location', response.redirect.url);
            return new Response(null, { status: redirectStatus, headers });
        }
        // Build headers
        const headers = new Headers(response?.headers || {});
        // Handle raw body responses (non-JSON)
        if (response?.isRawBody) {
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'text/plain');
            }
            return new Response(String(result.value.output), { status, headers });
        }
        // Default: JSON response
        headers.set('Content-Type', 'application/json');
        return new Response(JSON.stringify({
            success: true,
            output: result.value.output,
            metadata: {
                executionId: requestId || 'unknown',
                duration: Date.now() - startTime,
                timestamp: Date.now(),
            },
        }), { status, headers });
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
}
/**
 * Helper function to execute an agent
 * Shared logic between all agent execution routes
 */
async function executeAgent(c, agentName, input, config, startTime, requestId, routePath) {
    // Get security config from context
    const securityConfig = getSecurityConfigFromContext(c);
    // Check if direct agent execution is allowed
    if (!isDirectAgentExecutionAllowed(securityConfig)) {
        return c.json({
            error: 'Forbidden',
            message: 'Direct agent execution is disabled. Use ensembles instead.',
            timestamp: Date.now(),
            requestId,
        }, 403);
    }
    // Check permission
    const permError = checkPermission(c, securityConfig, 'agent', agentName, requestId);
    if (permError)
        return permError;
    try {
        // Get built-in registry
        const builtInRegistry = getBuiltInRegistry();
        // Get member loader for custom agents
        const memberLoader = getMemberLoader();
        // Check if agent exists (built-in or custom)
        const isBuiltIn = builtInRegistry.isBuiltIn(agentName);
        const isCustom = memberLoader?.hasMember(agentName) || false;
        if (!isBuiltIn && !isCustom) {
            return c.json({
                error: 'NotFound',
                message: `Agent not found: ${agentName}`,
                path: routePath,
                timestamp: Date.now(),
                requestId,
            }, 404);
        }
        // Check if custom agent is API executable (built-in agents are always executable)
        if (isCustom) {
            const customAgentConfig = memberLoader.getAgentConfig(agentName);
            if (customAgentConfig) {
                const apiConfig = getApiConfigFromContext(c);
                if (!isAgentApiExecutable(customAgentConfig, apiConfig)) {
                    const requireExplicit = apiConfig.execution?.agents?.requireExplicit ?? false;
                    const message = requireExplicit
                        ? `Agent '${agentName}' is not API executable. Set apiExecutable: true in the agent definition, or set api.execution.agents.requireExplicit: false in conductor config to make all agents executable by default.`
                        : `Agent '${agentName}' has API execution explicitly disabled via apiExecutable: false.`;
                    return c.json({
                        success: false,
                        error: {
                            code: 'EXECUTION_NOT_ALLOWED',
                            message,
                        },
                    }, 403);
                }
            }
        }
        // Get agent instance
        let agent;
        if (isBuiltIn) {
            // Get agent metadata
            const metadata = builtInRegistry.getMetadata(agentName);
            if (!metadata) {
                return c.json({
                    error: 'NotFound',
                    message: `Agent metadata not found: ${agentName}`,
                    timestamp: Date.now(),
                    requestId,
                }, 404);
            }
            // Create agent instance from built-in registry
            const agentConfig = {
                name: agentName,
                operation: metadata.operation,
                config: config || {},
            };
            agent = await builtInRegistry.create(agentName, agentConfig, c.env);
        }
        else {
            // Get custom agent from member loader
            agent = memberLoader.getAgent(agentName);
            if (!agent) {
                return c.json({
                    error: 'NotFound',
                    message: `Agent instance not found: ${agentName}`,
                    timestamp: Date.now(),
                    requestId,
                }, 404);
            }
        }
        // Create execution context with auth (security features injected by BaseAgent.execute)
        const auth = c.get('auth');
        const memberContext = {
            input,
            env: c.env,
            ctx: c.executionCtx,
            auth,
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
            agentName,
        });
        return c.json({
            error: 'ExecutionError',
            message: error.message || 'Execution failed',
            timestamp: Date.now(),
            requestId,
        }, 500);
    }
}
// ============================================================================
// NEW ROUTES (Preferred)
// ============================================================================
/**
 * POST /ensemble/:name - Execute an ensemble by name (URL-based)
 *
 * This is the preferred way to execute ensembles.
 * Example: POST /api/v1/execute/ensemble/invoice-pdf
 */
execute.post('/ensemble/:name', async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');
    const ensembleName = c.req.param('name');
    // Parse request body (input is optional for some ensembles)
    let input = {};
    try {
        const body = await c.req.json();
        input = body.input || {};
    }
    catch {
        // Empty body is OK
    }
    return executeEnsemble(c, ensembleName, input, startTime, requestId, `/api/v1/execute/ensemble/${ensembleName}`);
});
/**
 * POST /agent/:name - Execute an agent by name (URL-based)
 *
 * Only available if allowDirectAgentExecution is true (default).
 * Example: POST /api/v1/execute/agent/http
 */
execute.post('/agent/:name', async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');
    const agentName = c.req.param('name');
    // Parse request body
    const body = await c.req.json();
    if (!body.input) {
        return c.json({
            error: 'ValidationError',
            message: 'Input is required',
            timestamp: Date.now(),
            requestId,
        }, 400);
    }
    return executeAgent(c, agentName, body.input, body.config, startTime, requestId, `/api/v1/execute/agent/${agentName}`);
});
// ============================================================================
// LEGACY ROUTES (Backward Compatibility)
// ============================================================================
/**
 * POST / - Execute by body (legacy, for backward compatibility)
 *
 * Supports two modes:
 * - Agent execution: { agent: "agent-name", input: {...} }
 * - Ensemble execution: { ensemble: "ensemble-name", input: {...} }
 */
execute.post('/', async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');
    // Parse request body - extend ExecuteRequest to support ensemble
    const body = await c.req.json();
    // Validate request - either agent or ensemble must be provided
    if (!body.agent && !body.ensemble) {
        return c.json({
            error: 'ValidationError',
            message: 'Either agent or ensemble name is required',
            timestamp: Date.now(),
            requestId,
        }, 400);
    }
    // If ensemble is provided, delegate to ensemble execution
    if (body.ensemble) {
        return executeEnsemble(c, body.ensemble, body.input || {}, startTime, requestId, '/api/v1/execute');
    }
    // Agent execution
    if (!body.input) {
        return c.json({
            error: 'ValidationError',
            message: 'Input is required',
            timestamp: Date.now(),
            requestId,
        }, 400);
    }
    return executeAgent(c, body.agent, body.input, body.config, startTime, requestId, '/api/v1/execute');
});
/**
 * POST /:ensembleName - Execute ensemble by name (legacy URL pattern)
 *
 * This route is kept for backward compatibility.
 * Prefer using POST /ensemble/:name instead.
 *
 * Note: This must be registered AFTER the /ensemble/:name and /agent/:name routes
 * to avoid conflicting with them.
 */
execute.post('/:ensembleName', async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');
    const ensembleName = c.req.param('ensembleName');
    // Skip if this matches our new route patterns
    if (ensembleName === 'ensemble' || ensembleName === 'agent') {
        return c.json({
            error: 'ValidationError',
            message: 'Invalid ensemble name',
            timestamp: Date.now(),
            requestId,
        }, 400);
    }
    // Parse request body
    let input = {};
    try {
        const body = await c.req.json();
        input = body.input || {};
    }
    catch {
        // Empty body is OK
    }
    return executeEnsemble(c, ensembleName, input, startTime, requestId, `/api/v1/execute/${ensembleName}`);
});
export default execute;
