/**
 * Webhook Routes
 *
 * Handles incoming webhooks to trigger ensemble execution.
 */

import { Hono } from 'hono';
import { Parser } from '../../runtime/parser.js';
import { Executor } from '../../runtime/executor.js';
import { ResumptionManager } from '../../runtime/resumption-manager.js';
import { Errors } from '../../errors/error-types.js';

const app = new Hono<{ Bindings: Env }>();

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
  - member: process-webhook
    input:
      data: \${input}
`;

		const ensemble = Parser.parseEnsemble(ensembleYAML);

		// Check if ensemble has webhooks configured
		if (!ensemble.webhooks || ensemble.webhooks.length === 0) {
			return c.json({
				error: 'Ensemble does not have webhooks configured',
				ensemble: ensembleName
			}, 400);
		}

		// Find matching webhook configuration
		const webhookPath = `/webhooks/${ensembleName}`;
		const webhookConfig = ensemble.webhooks.find(wh => wh.path === webhookPath);

		if (!webhookConfig) {
			return c.json({
				error: 'No webhook configuration found for this path',
				path: webhookPath
			}, 404);
		}

		// Authenticate webhook if configured
		if (webhookConfig.auth) {
			const authResult = await authenticateWebhook(c, webhookConfig.auth);
			if (!authResult.success) {
				return c.json({
					error: 'Webhook authentication failed',
					message: authResult.error
				}, 401);
			}
		}

		// Determine execution mode
		const mode = webhookConfig.mode || 'trigger';

		if (mode === 'trigger') {
			// Trigger new execution
			// Note: Hono context doesn't directly expose ExecutionContext
			// We'll create a minimal context for now
			const ctx = {
				waitUntil: (promise: Promise<any>) => {},
				passThroughOnException: () => {}
			} as ExecutionContext;

			const executor = new Executor({ env, ctx });
			const isAsync = webhookConfig.async ?? true;

			if (isAsync) {
				// Return immediately, execute in background
				const executionId = generateExecutionId();

				// Get ExecutionState DO binding
				const namespace = (env as any).EXECUTION_STATE;
				if (!namespace) {
					return c.json({
						error: 'ExecutionState Durable Object not configured',
						message: 'Missing EXECUTION_STATE binding in wrangler.toml'
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
						totalSteps: ensemble.flow?.length || 0
					})
				}));

				// Execute in background (no await)
				ctx.waitUntil(
					executor.executeEnsemble(ensemble, webhookData).then(async result => {
						if (result.success) {
							// Mark as completed in DO
							await stub.fetch(new Request('http://do/complete', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ result: result.output })
							}));
							console.log('Webhook execution completed:', executionId, result);
						} else {
							// Mark as failed in DO
							await stub.fetch(new Request('http://do/fail', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ error: result.error || 'Execution failed' })
							}));
							console.error('Webhook execution failed:', executionId, result.error);
						}
					}).catch(async error => {
						// Mark as failed in DO
						await stub.fetch(new Request('http://do/fail', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
						}));
						console.error('Webhook execution failed:', executionId, error);
					})
				);

				return c.json({
					status: 'accepted',
					executionId,
					message: 'Ensemble execution started',
					statusUrl: `/api/v1/executions/${executionId}/status`,
					streamUrl: `/api/v1/executions/${executionId}/stream`
				}, 202);
			} else {
				// Wait for completion
				const timeout = webhookConfig.timeout || 30000;
				const result = await Promise.race([
					executor.executeEnsemble(ensemble, webhookData),
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error('Webhook execution timeout')), timeout)
					)
				]);

				return c.json({
					status: 'completed',
					result
				});
			}
		} else if (mode === 'resume') {
			// Resume suspended execution (HITL-style)
			const resumptionToken = webhookData.token || c.req.query('token');

			if (!resumptionToken) {
				return c.json({
					error: 'Resumption token required for resume mode',
					hint: 'Provide token in request body or query parameter'
				}, 400);
			}

			// Get HITLState DO namespace for resumption state
			const namespace = (env as any).HITL_STATE;
			if (!namespace) {
				return c.json({
					error: 'HITLState Durable Object not configured',
					message: 'Resumption requires HITL_STATE binding in wrangler.toml'
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
					token: resumptionToken
				}, 404);
			}

			const suspendedState = stateResult.value;

			// Create execution context
			const ctx = {
				waitUntil: (promise: Promise<any>) => {},
				passThroughOnException: () => {}
			} as ExecutionContext;

			// Create executor
			const executor = new Executor({ env, ctx });

			try {
				// Resume execution with webhook data as resume input
				const result = await executor.resumeExecution(suspendedState, webhookData);

				if (!result.success) {
					return c.json({
						error: 'Execution failed after resumption',
						message: result.error.message,
						token: resumptionToken
					}, 500);
				}

				// Delete the resumption token (one-time use)
				await resumptionManager.cancel(resumptionToken);

				return c.json({
					status: 'completed',
					token: resumptionToken,
					result: result.value
				});
			} catch (error) {
				return c.json({
					error: 'Execution error',
					message: error instanceof Error ? error.message : 'Unknown error',
					token: resumptionToken
				}, 500);
			}
		}

		return c.json({
			error: 'Invalid webhook mode',
			mode
		}, 400);
	} catch (error) {
		console.error('Webhook execution error:', error);

		return c.json({
			error: 'Webhook execution failed',
			message: error instanceof Error ? error.message : 'Unknown error'
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
		const namespace = (env as any).HITL_STATE as DurableObjectNamespace;
		if (!namespace) {
			return c.json({
				error: 'HITLState Durable Object not configured',
				message: 'Resumption requires HITL_STATE binding in wrangler.toml'
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
				token
			}, 404);
		}

		const suspendedState = stateResult.value;

		// Create execution context
		const ctx = {
			waitUntil: (promise: Promise<any>) => {},
			passThroughOnException: () => {}
		} as ExecutionContext;

		// Create executor
		const executor = new Executor({ env, ctx });

		// Resume execution
		const result = await executor.resumeExecution(suspendedState, resumeData);

		if (!result.success) {
			return c.json({
				error: 'Execution failed after resumption',
				message: result.error.message,
				token
			}, 500);
		}

		// Delete the resumption token (one-time use)
		await resumptionManager.cancel(token);

		return c.json({
			status: 'completed',
			token,
			result: result.value,
			message: 'Execution resumed and completed successfully'
		});
	} catch (error) {
		return c.json({
			error: 'Resumption failed',
			message: error instanceof Error ? error.message : 'Unknown error',
			token
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
		const namespace = (env as any).HITL_STATE as DurableObjectNamespace;
		if (!namespace) {
			return c.json({
				error: 'HITLState Durable Object not configured',
				message: 'Resumption requires HITL_STATE binding in wrangler.toml'
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
				token
			}, 404);
		}

		return c.json({
			token,
			metadata: metadataResult.value,
			status: 'suspended'
		});
	} catch (error) {
		return c.json({
			error: 'Failed to get token metadata',
			message: error instanceof Error ? error.message : 'Unknown error'
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
					async: true
				}
			]
		});
	} catch (error) {
		return c.json({
			error: 'Failed to load webhook configuration',
			message: error instanceof Error ? error.message : 'Unknown error'
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
			webhooks: []
		});
	} catch (error) {
		return c.json({
			error: 'Failed to list webhooks',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

/**
 * Authenticate webhook request
 */
async function authenticateWebhook(
	c: any,
	auth: { type: 'bearer' | 'signature' | 'basic'; secret: string }
): Promise<{ success: boolean; error?: string }> {
	switch (auth.type) {
		case 'bearer': {
			const authHeader = c.req.header('Authorization');
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
			// Verify HMAC signature (e.g., GitHub/Stripe style)
			const signature = c.req.header('X-Webhook-Signature');
			if (!signature) {
				return { success: false, error: 'Missing X-Webhook-Signature header' };
			}

			// TODO: Implement HMAC verification
			// For now, simple comparison
			if (signature !== auth.secret) {
				return { success: false, error: 'Invalid webhook signature' };
			}

			return { success: true };
		}

		case 'basic': {
			const authHeader = c.req.header('Authorization');
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
 * Generate unique execution ID
 */
function generateExecutionId(): string {
	return `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default app;
