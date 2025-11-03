/**
 * Webhook Routes
 *
 * Handles incoming webhooks to trigger ensemble execution.
 */

import { Hono } from 'hono';
import { Parser } from '../../runtime/parser.js';
import { Executor } from '../../runtime/executor.js';
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
				// TODO: Store execution ID in KV/DO for tracking
				const executionId = generateExecutionId();

				// Execute in background (no await)
				executor.executeEnsemble(ensemble, webhookData).then(result => {
					// Store result for retrieval
					// TODO: Implement result storage
					console.log('Webhook execution completed:', executionId, result);
				}).catch(error => {
					console.error('Webhook execution failed:', executionId, error);
				});

				return c.json({
					status: 'accepted',
					executionId,
					message: 'Ensemble execution started'
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
			const executionId = webhookData.executionId || c.req.query('executionId');

			if (!executionId) {
				return c.json({
					error: 'executionId required for resume mode'
				}, 400);
			}

			// TODO: Implement resumption logic
			// Load suspended state from Durable Object
			// Resume execution from suspension point

			return c.json({
				status: 'resumed',
				executionId,
				message: 'Execution resumed (not yet implemented)'
			}, 501);
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
