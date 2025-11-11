/**
 * Conductor Worker - Your AI Orchestration System
 *
 * This template shows how to use Conductor with:
 * - ✅ REST API for execution (optional - comment out if not needed)
 * - ✅ Custom endpoints (your own logic)
 * - ✅ Page routing (automatic web server for your pages)
 * - ✅ Durable Objects for stateful workflows
 * - ✅ Scheduled execution (cron triggers)
 *
 * Choose your approach:
 * 1. Use the built-in API (recommended for most projects)
 * 2. Build custom endpoints (full control)
 * 3. Use page routing for web pages
 * 4. Mix all three (API + custom endpoints + pages)
 */

// Import Durable Objects from the cloudflare-specific entry point
import { ExecutionState, HITLState } from '@ensemble-edge/conductor/cloudflare';

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
		apiKeys: (env: Env) => env.API_KEYS?.split(',') || [],
		allowAnonymous: true  // Set to false in production
	},
	logging: true
});

export default app;
*/

// ==================== Option 2: Custom Endpoints (Full Control) ====================
// Use this approach if you want complete control over your API structure

import { Executor, MemberLoader, PageRouter, UnifiedRouter, PageMember, type MemberConfig } from '@ensemble-edge/conductor';
import { parse as parseYAML } from 'yaml';
import conductorConfig from '../conductor.config';

// Import your members (add more as you create them)
import greetConfigRaw from '../members/hello/member.yaml';
let greetConfig: MemberConfig | null = null;  // ✅ Lazy initialization
import greetFunction from '../members/hello';

// Import your ensembles (add more as you create them)
import helloWorldYAML from '../ensembles/hello-world.yaml';

// Import page configurations (as raw strings from wrangler text loader)
import indexPageConfigRaw from '../pages/examples/index/page.yaml';
import dashboardPageConfigRaw from '../pages/examples/dashboard/page.yaml';
import loginPageConfigRaw from '../pages/examples/login/page.yaml';
import blogPostPageConfigRaw from '../pages/examples/blog-post/page.yaml';

// Import error pages
import error404PageConfigRaw from '../pages/errors/404/page.yaml';
import error500PageConfigRaw from '../pages/errors/500/page.yaml';

// Import static pages
import robotsPageConfigRaw from '../pages/static/robots/page.yaml';
import sitemapPageConfigRaw from '../pages/static/sitemap/page.yaml';

// ==================== Lazy Initialization for Pages ====================
// All page parsing and initialization happens on first request
// This prevents blocking Worker initialization
let pageRouter: PageRouter | null = null;
let pagesMap: Map<string, { config: MemberConfig; member: PageMember }> | null = null;
let pagesInitialized = false;

async function initializePages(): Promise<void> {
	if (pagesInitialized) return;

	// Parse YAML strings into config objects
	const indexPageConfig = parseYAML(indexPageConfigRaw as unknown as string) as MemberConfig;
	const dashboardPageConfig = parseYAML(dashboardPageConfigRaw as unknown as string) as MemberConfig;
	const loginPageConfig = parseYAML(loginPageConfigRaw as unknown as string) as MemberConfig;
	const blogPostPageConfig = parseYAML(blogPostPageConfigRaw as unknown as string) as MemberConfig;
	const error404PageConfig = parseYAML(error404PageConfigRaw as unknown as string) as MemberConfig;
	const error500PageConfig = parseYAML(error500PageConfigRaw as unknown as string) as MemberConfig;
	const robotsPageConfig = parseYAML(robotsPageConfigRaw as unknown as string) as MemberConfig;
	const sitemapPageConfig = parseYAML(sitemapPageConfigRaw as unknown as string) as MemberConfig;

	// Initialize PageRouter with pages
	pageRouter = new PageRouter({
		indexFiles: ['index'],
		notFoundPage: 'error-404' // Use custom 404 page
	});

	// Register pages
	pagesMap = new Map([
		// Example pages
		['index', { config: indexPageConfig as MemberConfig, member: new PageMember(indexPageConfig as MemberConfig) }],
		['dashboard', { config: dashboardPageConfig as MemberConfig, member: new PageMember(dashboardPageConfig as MemberConfig) }],
		['login', { config: loginPageConfig as MemberConfig, member: new PageMember(loginPageConfig as MemberConfig) }],
		['blog-post', { config: blogPostPageConfig as MemberConfig, member: new PageMember(blogPostPageConfig as MemberConfig) }],

		// Error pages
		['error-404', { config: error404PageConfig as MemberConfig, member: new PageMember(error404PageConfig as MemberConfig) }],
		['error-500', { config: error500PageConfig as MemberConfig, member: new PageMember(error500PageConfig as MemberConfig) }],

		// Static pages
		['robots', { config: robotsPageConfig as MemberConfig, member: new PageMember(robotsPageConfig as MemberConfig) }],
		['sitemap', { config: sitemapPageConfig as MemberConfig, member: new PageMember(sitemapPageConfig as MemberConfig) }]
	]);

	// Discover pages
	await pageRouter.discoverPages(pagesMap);
	pagesInitialized = true;
}

// ==================== Option 3: Use UnifiedRouter (Authentication & Routing) ====================
// UnifiedRouter provides:
// - Centralized authentication (Bearer, API Key, Cookie, Unkey, Custom)
// - Type-specific defaults (pages, APIs, webhooks, forms, docs)
// - Path-based rules from conductor.config.ts
// - Rate limiting per route
// - Permission & role checks
//
// See conductor.config.ts for routing configuration
// See members/docs-*.yaml for examples of route configuration in member YAML files

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Initialize UnifiedRouter with authentication
		const router = new UnifiedRouter(conductorConfig);
		await router.init(env);

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

		// ==================== Authenticated API Endpoint Example ====================
		// This demonstrates how to use UnifiedRouter for authentication
		// The router will check credentials based on conductor.config.ts rules
		if (url.pathname === '/api/v1/protected' && request.method === 'GET') {
			// Register the route with authentication
			router.register({
				pattern: '/api/v1/protected',
				path: '/api/v1/protected',
				methods: ['GET'],
				memberType: 'api',
				memberName: 'protected-api',
				handler: async (req, env, ctx, auth) => {
					return Response.json({
						message: 'Protected endpoint',
						authenticated: auth.authenticated,
						user: auth.user,
						method: auth.method
					});
				}
			});

			// Let router handle authentication and call the handler
			const response = await router.handle(request, env, ctx);
			if (response) return response;
		}

		// Your custom endpoints here
		// Example: Execute hello-world ensemble
		if (url.pathname === '/ensemble/hello-world' && request.method === 'POST') {
			try {
				const input = (await request.json()) as Record<string, any>;

				// Lazy parse greetConfig on first use
				if (!greetConfig) {
					greetConfig = parseYAML(greetConfigRaw as unknown as string) as MemberConfig;
				}

				// Create executor
				const executor = new Executor({ env, ctx });
				const loader = new MemberLoader({ env, ctx });

				// Register your members
				const greetMember = loader.registerMember(greetConfig as MemberConfig, greetFunction);
				executor.registerMember(greetMember);

				// Execute ensemble
				const result = await executor.executeFromYAML(helloWorldYAML as unknown as string, input);

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

		// Initialize pages on first request (lazy initialization to avoid blocking Worker startup)
		await initializePages();

		// Try page routing (before 404)
		// This handles all your page routes automatically
		if (pageRouter) {
			const pageResponse = await pageRouter.handle(request, env, ctx);
			if (pageResponse) {
				return pageResponse;
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
