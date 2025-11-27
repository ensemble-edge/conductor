/**
 * Authentication Middleware
 *
 * Validates API keys and sets auth context.
 * Supports stealth mode to hide API structure from unauthenticated users.
 *
 * @module api/middleware/auth
 */
import type { MiddlewareHandler } from 'hono';
import type { AuthConfig } from '../types.js';
/**
 * Extended auth config with stealth mode support
 */
export interface ExtendedAuthConfig extends AuthConfig {
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
}
/**
 * Create authentication middleware
 *
 * @example
 * ```ts
 * // Standard auth
 * app.use('/api/*', createAuthMiddleware({
 *   apiKeys: ['key1', 'key2'],
 * }))
 *
 * // With stealth mode
 * app.use('/api/*', createAuthMiddleware({
 *   apiKeys: ['key1', 'key2'],
 *   stealthMode: true,
 *   stealthDelayMs: 50,
 * }))
 * ```
 */
export declare function createAuthMiddleware(config: ExtendedAuthConfig): MiddlewareHandler;
/**
 * Require authentication middleware
 * Used after createAuthMiddleware to enforce authentication
 */
export declare function requireAuth(options?: {
    stealthMode?: boolean;
}): MiddlewareHandler;
//# sourceMappingURL=auth.d.ts.map