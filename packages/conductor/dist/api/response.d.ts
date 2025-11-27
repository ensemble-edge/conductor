/**
 * Response Utilities for Conductor API
 *
 * Provides consistent response formatting with:
 * - Standardized JSON structure
 * - Context-bound and context-free helpers
 * - Stealth mode support for auth failures
 *
 * @module api/response
 */
import type { Context } from 'hono';
import type { ConductorContext } from './types.js';
/**
 * Standard success response structure
 */
export interface SuccessResponse<T> {
    success: true;
    data: T;
    timestamp: string;
    requestId?: string;
}
/**
 * Standard error response structure
 */
export interface ErrorResponseBody {
    success: false;
    error: string;
    code?: string;
    message?: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
}
/**
 * Stealth mode 404 - identical to real 404
 */
export interface NotFoundResponse {
    success: false;
    error: 'Not Found';
    message: 'The requested resource could not be found.';
    timestamp: string;
}
/**
 * HTTP Cache-Control header options
 */
export interface CacheHeaderOptions {
    /** Cache-Control: max-age=N (seconds) */
    maxAge?: number;
    /** Cache-Control: public (CDN can cache) */
    public?: boolean;
    /** Cache-Control: private (browser only, not CDN) */
    private?: boolean;
    /** Cache-Control: no-cache (must revalidate) */
    noCache?: boolean;
    /** Cache-Control: no-store (don't cache at all) */
    noStore?: boolean;
    /** stale-while-revalidate=N (seconds) */
    staleWhileRevalidate?: number;
    /** stale-if-error=N (seconds) */
    staleIfError?: number;
    /** Vary header values */
    vary?: string[];
    /** Custom Cache-Control directives */
    custom?: string;
}
/**
 * Create successful API response
 *
 * @example
 * ```ts
 * return success(c, { users: [...] })
 * return success(c, data, { status: 201, cache: { maxAge: 300 } })
 * ```
 */
export declare function success<T>(c: ConductorContext, data: T, options?: {
    status?: number;
    cache?: CacheHeaderOptions;
    headers?: Record<string, string>;
}): Response;
/**
 * Create error API response
 * In stealth mode, auth errors become 404s
 *
 * @example
 * ```ts
 * return error(c, 'User not found', { status: 404, code: 'USER_NOT_FOUND' })
 * return error(c, 'Unauthorized', { status: 401, isAuthError: true })
 * ```
 */
export declare function error(c: ConductorContext, message: string, options?: {
    status?: number;
    code?: string;
    details?: unknown;
    isAuthError?: boolean;
}): Response;
/**
 * Create stealth 404 response
 * Used for auth failures when stealth mode is enabled
 * Returns identical response to real 404
 */
export declare function stealthNotFound(c: ConductorContext): Response;
/**
 * Create stealth 404 with timing attack protection
 * Uses scheduler.wait() if available (requires paid plan)
 */
export declare function stealthNotFoundWithDelay(c: ConductorContext): Promise<Response>;
/**
 * Create health check response
 */
export declare function health(c: ConductorContext, status: 'healthy' | 'degraded' | 'unhealthy', details?: Record<string, unknown>): Response;
/**
 * Create response body for success (no context required)
 * Returns plain object suitable for JSON serialization
 */
export declare function successBody<T>(data: T, requestId?: string): SuccessResponse<T>;
/**
 * Create response body for error (no context required)
 */
export declare function errorBody(message: string, options?: {
    code?: string;
    details?: unknown;
    requestId?: string;
    status?: number;
}): ErrorResponseBody;
/**
 * Create Response object without Hono context
 * Useful for queue handlers returning HTTP-like responses
 */
export declare function successResponse<T>(data: T, options?: {
    status?: number;
    headers?: Record<string, string>;
    requestId?: string;
}): Response;
/**
 * Create error Response object without Hono context
 */
export declare function errorResponse(message: string, options?: {
    status?: number;
    code?: string;
    headers?: Record<string, string>;
    requestId?: string;
}): Response;
/**
 * Apply cache headers to response
 */
export declare function applyCacheHeaders(c: Context, options: CacheHeaderOptions): void;
/**
 * Build Cache-Control header string from options
 */
export declare function buildCacheControl(options: CacheHeaderOptions): string;
//# sourceMappingURL=response.d.ts.map