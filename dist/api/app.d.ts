/**
 * Conductor API Application
 *
 * Main Hono application with routes and middleware.
 */
import { Hono } from 'hono';
import { type ScheduledEvent } from '../runtime/schedule-manager.js';
export interface APIConfig {
    auth?: {
        apiKeys?: string[];
        allowAnonymous?: boolean;
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