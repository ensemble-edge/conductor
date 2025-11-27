/**
 * Conductor API Application
 *
 * Main Hono application with routes and middleware.
 */
import { Hono } from 'hono';
import { type SecurityHeadersConfig } from './middleware/index.js';
import { type ScheduledEvent } from '../runtime/schedule-manager.js';
export interface APIConfig {
    /**
     * Authentication configuration
     * SECURE BY DEFAULT: Auth is required on /api/v1/* routes unless explicitly disabled
     * Note: User-defined trigger routes (e.g., /api/protected) use their own auth config
     */
    auth?: {
        /** List of valid API keys */
        apiKeys?: string[];
        /**
         * Allow anonymous access to API routes
         * @default false - requires authentication
         */
        allowAnonymous?: boolean;
        /**
         * Require authentication on /api/v1/* routes (built-in API endpoints)
         * Set to false only for development/testing
         * Note: Does not affect user-defined trigger routes which have their own auth
         * @default true
         */
        requireAuth?: boolean;
    };
    /**
     * Security configuration for execution
     */
    security?: {
        /** Allow direct agent execution via /api/v1/execute/agent/:name */
        allowDirectAgentExecution?: boolean;
        /** Automatically require resource-specific permissions */
        autoPermissions?: boolean;
    };
    /**
     * HITL and workflow resumption configuration
     */
    hitl?: {
        /**
         * Base path for HITL resumption endpoints
         * Example: "/callback" results in POST /callback/:token and GET /callback/:token
         * @default "/callback"
         */
        resumeBasePath?: string;
    };
    cors?: {
        origin?: string | string[];
        allowMethods?: string[];
        allowHeaders?: string[];
    };
    logging?: boolean;
    /**
     * Response behavior configuration
     * Controls headers, security settings, and stealth mode
     */
    response?: {
        /**
         * Stealth mode - return generic 404 for all auth failures
         * Hides API structure from unauthenticated users
         * @default false
         */
        stealthMode?: boolean;
        /**
         * Minimum response time (ms) for stealth 404 responses
         * Helps prevent timing attacks that could reveal protected endpoints
         *
         * Note: Uses scheduler.wait() which requires:
         * - Cloudflare Workers: Paid plan (Workers Unbound or Workers Paid)
         * - Netlify: Next plan or higher
         *
         * On free tiers, delay is gracefully skipped (no error, no timing protection)
         * Set to 0 to disable timing protection entirely
         *
         * @default 50
         */
        stealthDelayMs?: number;
        /**
         * Add X-Powered-By: Ensemble-Edge Conductor header to responses
         * Useful for debugging, disable in production if you want to hide the stack
         * @default true in development, false in production
         */
        conductorHeader?: boolean;
        /**
         * Include security headers (HSTS, X-Frame-Options, etc.)
         * @default true
         */
        securityHeaders?: boolean | SecurityHeadersConfig;
        /**
         * Include debug headers in non-production environments
         * (X-Conductor-Duration, X-Conductor-Cache, etc.)
         * @default true in development/preview, false in production
         */
        debugHeaders?: boolean;
    };
}
/**
 * Create Conductor API application
 */
export declare function createConductorAPI(config?: APIConfig): Hono;
/**
 * Default export for Cloudflare Workers
 */
declare const _default: {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
    /**
     * Handle scheduled cron triggers
     */
    scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void>;
};
export default _default;
//# sourceMappingURL=app.d.ts.map