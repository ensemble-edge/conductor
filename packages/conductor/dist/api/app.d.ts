/**
 * Conductor API Application
 *
 * Main Hono application with routes and middleware.
 */
import { Hono } from 'hono';
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
    cors?: {
        origin?: string | string[];
        allowMethods?: string[];
        allowHeaders?: string[];
    };
    logging?: boolean;
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