/**
 * Conductor Worker - Your AI Orchestration System
 *
 * This template shows how to use Conductor with:
 * - ✅ REST API for execution (optional - comment out if not needed)
 * - ✅ Custom endpoints (your own logic)
 * - ✅ Durable Objects for stateful workflows
 * - ✅ Scheduled execution (cron triggers)
 *
 * Choose your approach:
 * 1. Use the built-in API (recommended for most projects)
 * 2. Build custom endpoints (full control)
 * 3. Mix both (API + custom endpoints)
 */

import { ExecutionState, HITLState } from '@ensemble-edge/conductor';
// Note: The /api export is not available in v1.0.7
// import { createConductorAPI } from '@ensemble-edge/conductor/api';

// ==================== Option 1: Use Built-in API (Recommended) ====================
// Uncomment this for a full-featured API with:
// - POST /api/v1/execute - Execute ensembles
// - GET /api/v1/executions/:id - Check execution status
// - POST /api/v1/executions/:id/resume - Resume HITL workflows
// - GET /api/v1/schedules - List scheduled ensembles
// - POST /webhooks/:path - Webhook triggers
// - GET /health - Health check

/*
const app = createConductorAPI({
	auth: {
		apiKeys: (env: any) => env.API_KEYS?.split(',') || [],
		allowAnonymous: true  // Set to false in production
	},
	logging: true
});

export default app;
*/

// ==================== Option 2: Custom Endpoints (Full Control) ====================
// Use this approach if you want complete control over your API structure

import { Executor, MemberLoader } from '@ensemble-edge/conductor';

// Import your members (add more as you create them)
import greetConfig from '../members/greet/member.yaml';
import greetFunction from '../members/greet';

// Import your ensembles (add more as you create them)
import helloWorldYAML from '../ensembles/hello-world.yaml';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Health check (always available)
		if (url.pathname === '/health') {
			return Response.json({
				status: 'healthy',
				service: 'conductor',
				timestamp: Date.now()
			});
		}

		// Static asset serving from R2
		// Serves files from /assets/* via the ASSETS R2 bucket
		if (url.pathname.startsWith('/assets/')) {
			try {
				// Remove /assets/ prefix to get the R2 key
				const key = url.pathname.slice(8); // Remove '/assets/'

				// Get the ASSETS R2 bucket binding
				const bucket = env.ASSETS;

				if (!bucket) {
					return new Response('R2 bucket not configured', { status: 503 });
				}

				// Fetch from R2
				const object = await bucket.get(key);

				if (!object) {
					return new Response('Asset not found', { status: 404 });
				}

				// Return with appropriate headers
				const headers = new Headers();
				object.writeHttpMetadata(headers);
				headers.set('etag', object.httpEtag);

				// Add cache headers for CDN
				headers.set('Cache-Control', 'public, max-age=31536000, immutable');

				return new Response(object.body, { headers });
			} catch (error) {
				console.error('Asset serving error:', error);
				return new Response('Internal Server Error', { status: 500 });
			}
		}

		// Your custom endpoints here
		// Example: Execute hello-world ensemble
		if (url.pathname === '/ensemble/hello-world' && request.method === 'POST') {
			try {
				const input = (await request.json()) as Record<string, any>;

				// Create executor
				const executor = new Executor({ env, ctx });
				const loader = new MemberLoader({ env, ctx });

				// Register your members
				const greetMember = loader.registerMember(greetConfig, greetFunction);
				executor.registerMember(greetMember);

				// Execute ensemble
				const result = await executor.executeFromYAML(helloWorldYAML, input);

				return Response.json(result);
			} catch (error) {
				return Response.json(
					{
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error'
					},
					{ status: 500 }
				);
			}
		}

		return new Response('Not Found', { status: 404 });
	},

	// Scheduled handler for cron triggers
	// Gets called when cron expressions in wrangler.toml fire
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log('Cron trigger:', controller.cron, new Date(controller.scheduledTime));

		// Your scheduled logic here
		// Example: Load ensembles with matching schedules and execute them
		// See: ScheduleManager in @ensemble-edge/conductor
	}
} satisfies ExportedHandler<Env>;

// ==================== Export Durable Objects ====================
// Required for stateful workflows, async tracking, and HITL
// These are referenced in wrangler.toml
export { ExecutionState, HITLState };
