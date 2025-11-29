/**
 * Request ID Middleware
 *
 * Generates unique request ID for tracing and debugging.
 * Uses branded RequestId type for compile-time safety.
 */
import type { MiddlewareHandler } from 'hono';
export declare function requestId(): MiddlewareHandler;
//# sourceMappingURL=request-id.d.ts.map