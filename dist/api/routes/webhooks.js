/**
 * Webhook Routes
 *
 * Handles incoming webhooks to trigger ensemble execution.
 */
import { Hono } from 'hono';
import { Parser } from '../../runtime/parser.js';
import { Executor } from '../../runtime/executor.js';
import { ResumptionManager } from '../../runtime/resumption-manager.js';
import { createLogger } from '../../observability/index.js';
const app = new Hono();
const logger = createLogger({ serviceName: 'api-webhooks' });
/**
 * Webhook trigger endpoint
 * POST /webhooks/:ensembleName
 *
 * Triggers ensemble execution from webhook
 */
app.post('/:ensembleName', async (c) => {
    const ensembleName = c.req.param('ensembleName');
    const env = c.env;
    try {
        // Get request body as webhook data
        const webhookData = await c.req.json().catch(() => ({}));
        // Load ensemble configuration
        // TODO: Load from catalog or KV
        const ensembleYAML = `
name: ${ensembleName}
description: Webhook-triggered ensemble
flow:
  - agent: process-webhook
    input:
      data: \${input}
`;
        const ensemble = Parser.parseEnsemble(ensembleYAML);
        // Check if ensemble has webhook trigger configured
        if (!ensemble.trigger || ensemble.trigger.length === 0) {
            return c.json({
                error: 'Ensemble does not have any trigger endpoints',
                ensemble: ensembleName,
            }, 400);
        }
        // Find matching webhook configuration in expose array
        const webhookPath = `/webhooks/${ensembleName}`;
        const webhookTrigger = ensemble.trigger.find((exp) => exp.type === 'webhook' && (exp.path === webhookPath || exp.path === `/${ensembleName}`));
        if (!webhookTrigger || webhookTrigger.type !== 'webhook') {
            return c.json({
                error: 'No webhook trigger found for this path',
                path: webhookPath,
            }, 404);
        }
        // Authenticate webhook if not public
        if (!webhookTrigger.public) {
            if (!webhookTrigger.auth) {
                return c.json({
                    error: 'Webhook requires authentication but none configured',
                    path: webhookPath,
                }, 500);
            }
            const authResult = await authenticateWebhook(c, webhookTrigger.auth);
            if (!authResult.success) {
                return c.json({
                    error: 'Webhook authentication failed',
                    message: authResult.error,
                }, 401);
            }
        }
        // Determine execution mode
        const mode = webhookTrigger.mode || 'trigger';
        if (mode === 'trigger') {
            // Trigger new execution
            // Note: Hono context doesn't directly expose ExecutionContext
            // We'll create a minimal context for now
            const ctx = {
                waitUntil: (promise) => { },
                passThroughOnException: () => { },
            };
            const executor = new Executor({ env, ctx });
            const isAsync = webhookTrigger.async ?? true;
            if (isAsync) {
                // Return immediately, execute in background
                const executionId = generateExecutionId();
                // Get ExecutionState DO binding
                const namespace = env.EXECUTION_STATE;
                if (!namespace) {
                    return c.json({
                        error: 'ExecutionState Durable Object not configured',
                        message: 'Missing EXECUTION_STATE binding in wrangler.toml',
                    }, 500);
                }
                // Initialize execution state in DO
                const id = namespace.idFromName(executionId);
                const stub = namespace.get(id);
                // Start execution tracking
                await stub.fetch(new Request('http://do/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        executionId,
                        ensembleName: ensemble.name,
                        totalSteps: ensemble.flow?.length || 0,
                    }),
                }));
                // Execute in background (no await)
                ctx.waitUntil(executor
                    .executeEnsemble(ensemble, webhookData)
                    .then(async (result) => {
                    if (result.success) {
                        // Mark as completed in DO
                        await stub.fetch(new Request('http://do/complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ result: result.value.output }),
                        }));
                        logger.info('Webhook execution completed', {
                            executionId,
                            ensembleName: ensemble.name,
                            durationMs: result.value.metrics?.totalDuration,
                        });
                    }
                    else {
                        // Mark as failed in DO
                        await stub.fetch(new Request('http://do/fail', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ error: result.error.message || 'Execution failed' }),
                        }));
                        logger.error('Webhook execution failed', undefined, {
                            executionId,
                            ensembleName: ensemble.name,
                            error: result.error.message,
                        });
                    }
                })
                    .catch(async (error) => {
                    // Mark as failed in DO
                    await stub.fetch(new Request('http://do/fail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            error: error instanceof Error ? error.message : 'Unknown error',
                        }),
                    }));
                    logger.error('Webhook execution error', error instanceof Error ? error : undefined, {
                        executionId,
                        ensembleName: ensemble.name,
                    });
                }));
                return c.json({
                    status: 'accepted',
                    executionId,
                    message: 'Ensemble execution started',
                    statusUrl: `/api/v1/executions/${executionId}/status`,
                    streamUrl: `/api/v1/executions/${executionId}/stream`,
                }, 202);
            }
            else {
                // Wait for completion
                const timeout = webhookTrigger.timeout || 30000;
                const result = await Promise.race([
                    executor.executeEnsemble(ensemble, webhookData),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Webhook execution timeout')), timeout)),
                ]);
                return c.json({
                    status: 'completed',
                    result,
                });
            }
        }
        else if (mode === 'resume') {
            // Resume suspended execution (HITL-style)
            const resumptionToken = webhookData.token || c.req.query('token');
            if (!resumptionToken) {
                return c.json({
                    error: 'Resumption token required for resume mode',
                    hint: 'Provide token in request body or query parameter',
                }, 400);
            }
            // Get HITLState DO namespace for resumption state
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
            const stateResult = await resumptionManager.resume(resumptionToken);
            if (!stateResult.success) {
                return c.json({
                    error: 'Failed to load resumption state',
                    message: stateResult.error.message,
                    token: resumptionToken,
                }, 404);
            }
            const suspendedState = stateResult.value;
            // Create execution context
            const ctx = {
                waitUntil: (promise) => { },
                passThroughOnException: () => { },
            };
            // Create executor
            const executor = new Executor({ env, ctx });
            try {
                // Resume execution with webhook data as resume input
                const result = await executor.resumeExecution(suspendedState, webhookData);
                if (!result.success) {
                    return c.json({
                        error: 'Execution failed after resumption',
                        message: result.error.message,
                        token: resumptionToken,
                    }, 500);
                }
                // Delete the resumption token (one-time use)
                await resumptionManager.cancel(resumptionToken);
                return c.json({
                    status: 'completed',
                    token: resumptionToken,
                    result: result.value,
                });
            }
            catch (error) {
                return c.json({
                    error: 'Execution error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    token: resumptionToken,
                }, 500);
            }
        }
        return c.json({
            error: 'Invalid webhook mode',
            mode,
        }, 400);
    }
    catch (error) {
        logger.error('Webhook execution error', error instanceof Error ? error : undefined, {
            webhookName: c.req.param('name'),
        });
        return c.json({
            error: 'Webhook execution failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});
/**
 * Resume suspended execution
 * POST /webhooks/resume/:token
 *
 * Simpler endpoint for resuming suspended workflows.
 * Alternative to using resume mode on the main webhook endpoint.
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
            waitUntil: (promise) => { },
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
        return c.json({
            status: 'completed',
            token,
            result: result.value,
            message: 'Execution resumed and completed successfully',
        });
    }
    catch (error) {
        return c.json({
            error: 'Resumption failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            token,
        }, 500);
    }
});
/**
 * Get resumption token metadata
 * GET /webhooks/resume/:token
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
 * Get webhook configuration for ensemble
 * GET /webhooks/:ensembleName/config
 */
app.get('/:ensembleName/config', async (c) => {
    const ensembleName = c.req.param('ensembleName');
    try {
        // TODO: Load ensemble configuration
        return c.json({
            ensemble: ensembleName,
            webhooks: [
                {
                    path: `/webhooks/${ensembleName}`,
                    method: 'POST',
                    mode: 'trigger',
                    async: true,
                },
            ],
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to load webhook configuration',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});
/**
 * List all configured webhooks
 * GET /webhooks
 */
app.get('/', async (c) => {
    try {
        // TODO: Load all ensemble configurations and extract webhooks
        return c.json({
            webhooks: [],
        });
    }
    catch (error) {
        return c.json({
            error: 'Failed to list webhooks',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});
/**
 * Authenticate webhook request
 */
async function authenticateWebhook(c, auth) {
    const ctx = c;
    switch (auth.type) {
        case 'bearer': {
            const authHeader = ctx.req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { success: false, error: 'Missing or invalid Authorization header' };
            }
            const token = authHeader.substring(7);
            if (token !== auth.secret) {
                return { success: false, error: 'Invalid bearer token' };
            }
            return { success: true };
        }
        case 'signature': {
            // Verify HMAC signature (GitHub/Stripe/Slack style)
            const signature = ctx.req.header('X-Webhook-Signature') || ctx.req.header('X-Hub-Signature-256');
            const timestamp = ctx.req.header('X-Webhook-Timestamp');
            if (!signature) {
                return {
                    success: false,
                    error: 'Missing signature header (X-Webhook-Signature or X-Hub-Signature-256)',
                };
            }
            if (!timestamp) {
                return { success: false, error: 'Missing X-Webhook-Timestamp header' };
            }
            // Verify timestamp to prevent replay attacks (within 5 minutes)
            const requestTime = parseInt(timestamp, 10);
            const currentTime = Math.floor(Date.now() / 1000);
            const timeDiff = Math.abs(currentTime - requestTime);
            if (timeDiff > 300) {
                // 5 minutes
                return { success: false, error: 'Request timestamp too old (replay attack prevention)' };
            }
            try {
                // Get request body
                const body = await ctx.req.text();
                // Generate expected signature
                const expectedSignature = await generateWebhookSignature(body, requestTime, auth.secret);
                // Constant-time comparison to prevent timing attacks
                if (!constantTimeCompare(signature, expectedSignature)) {
                    return { success: false, error: 'Invalid webhook signature' };
                }
                return { success: true };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                };
            }
        }
        case 'basic': {
            const authHeader = ctx.req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Basic ')) {
                return { success: false, error: 'Missing or invalid Authorization header' };
            }
            const credentials = atob(authHeader.substring(6));
            if (credentials !== auth.secret) {
                return { success: false, error: 'Invalid credentials' };
            }
            return { success: true };
        }
        default:
            return { success: false, error: 'Unknown auth type' };
    }
}
/**
 * Generate HMAC-SHA256 signature for webhook verification
 */
async function generateWebhookSignature(body, timestamp, secret) {
    const payload = `${timestamp}.${body}`;
    // Use Web Crypto API (available in Cloudflare Workers)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `sha256=${hashHex}`;
}
/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Generate cryptographically secure unique execution ID
 */
function generateExecutionId() {
    return `exec-${crypto.randomUUID()}`;
}
export default app;
