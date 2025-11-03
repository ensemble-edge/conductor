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
import { createConductorAPI } from '@ensemble-edge/conductor/api';

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

		// Your custom endpoints here
		// Example: Execute hello-world ensemble
		if (url.pathname === '/ensemble/hello-world' && request.method === 'POST') {
			try {
				const input = await request.json();

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
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log('Cron trigger:', event.cron, new Date(event.scheduledTime));

		// Your scheduled logic here
		// Example: Load ensembles with matching schedules and execute them
		// See: ScheduleManager in @ensemble-edge/conductor
	}
} satisfies ExportedHandler<Env>;

// ==================== Export Durable Objects ====================
// Required for stateful workflows, async tracking, and HITL
// These are referenced in wrangler.toml
export { ExecutionState, HITLState };
