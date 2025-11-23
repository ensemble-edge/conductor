/**
 * Authentication Middleware
 *
 * Validates API keys and sets auth context.
 */
import type { MiddlewareHandler } from 'hono';
import type { AuthConfig } from '../types.js';
export declare function createAuthMiddleware(config: AuthConfig): MiddlewareHandler;
/**
 * Require authentication middleware
 */
export declare function requireAuth(): MiddlewareHandler;
//# sourceMappingURL=auth.d.ts.map