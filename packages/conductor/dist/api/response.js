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
// ==================== Context-Bound Response Creators ====================
// Use these in HTTP handlers with Hono context
/**
 * Create successful API response
 *
 * @example
 * ```ts
 * return success(c, { users: [...] })
 * return success(c, data, { status: 201, cache: { maxAge: 300 } })
 * ```
 */
export function success(c, data, options) {
    const requestId = c.get('requestId');
    const status = options?.status ?? 200;
    // Apply cache headers if provided
    if (options?.cache) {
        applyCacheHeaders(c, options.cache);
    }
    // Apply custom headers if provided
    if (options?.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
            c.header(key, value);
        }
    }
    const body = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
    };
    return c.json(body, status);
}
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
export function error(c, message, options) {
    const requestId = c.get('requestId');
    const status = options?.status ?? 500;
    // Check for stealth mode - auth errors become 404
    const stealthMode = c.get('stealthMode');
    if (stealthMode && options?.isAuthError) {
        return stealthNotFound(c);
    }
    const body = {
        success: false,
        error: getErrorName(status),
        message,
        timestamp: new Date().toISOString(),
    };
    if (options?.code)
        body.code = options.code;
    if (options?.details)
        body.details = options.details;
    if (requestId)
        body.requestId = requestId;
    return c.json(body, status);
}
/**
 * Create stealth 404 response
 * Used for auth failures when stealth mode is enabled
 * Returns identical response to real 404
 */
export function stealthNotFound(c) {
    const body = {
        success: false,
        error: 'Not Found',
        message: 'The requested resource could not be found.',
        timestamp: new Date().toISOString(),
    };
    return c.json(body, 404);
}
/**
 * Create stealth 404 with timing attack protection
 * Uses scheduler.wait() if available (requires paid plan)
 */
export async function stealthNotFoundWithDelay(c) {
    const stealthDelayMs = c.get('stealthDelayMs') ?? 50;
    const startTime = c.get('startTime');
    if (stealthDelayMs > 0 && startTime) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, stealthDelayMs - elapsed);
        if (remaining > 0) {
            try {
                // scheduler.wait() requires paid Workers plan
                // @ts-ignore scheduler is globally available in Workers runtime
                await scheduler.wait(remaining);
            }
            catch {
                // scheduler.wait not available (free tier) - continue without delay
            }
        }
    }
    return stealthNotFound(c);
}
/**
 * Create health check response
 */
export function health(c, status, details) {
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    return c.json({
        status,
        timestamp: new Date().toISOString(),
        ...(details && { details }),
    }, httpStatus);
}
// ==================== Context-Free Response Creators ====================
// Use these in queue handlers, scheduled jobs, or anywhere without Hono context
/**
 * Create response body for success (no context required)
 * Returns plain object suitable for JSON serialization
 */
export function successBody(data, requestId) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
    };
}
/**
 * Create response body for error (no context required)
 */
export function errorBody(message, options) {
    const body = {
        success: false,
        error: getErrorName(options?.status ?? 500),
        message,
        timestamp: new Date().toISOString(),
    };
    if (options?.code)
        body.code = options.code;
    if (options?.details)
        body.details = options.details;
    if (options?.requestId)
        body.requestId = options.requestId;
    return body;
}
/**
 * Create Response object without Hono context
 * Useful for queue handlers returning HTTP-like responses
 */
export function successResponse(data, options) {
    const body = successBody(data, options?.requestId);
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options?.headers,
    });
    return new Response(JSON.stringify(body), {
        status: options?.status ?? 200,
        headers,
    });
}
/**
 * Create error Response object without Hono context
 */
export function errorResponse(message, options) {
    const body = errorBody(message, options);
    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options?.headers,
    });
    return new Response(JSON.stringify(body), {
        status: options?.status ?? 500,
        headers,
    });
}
// ==================== Helper Functions ====================
/**
 * Apply cache headers to response
 */
export function applyCacheHeaders(c, options) {
    const directives = [];
    if (options.public)
        directives.push('public');
    if (options.private)
        directives.push('private');
    if (options.noCache)
        directives.push('no-cache');
    if (options.noStore)
        directives.push('no-store');
    if (options.maxAge !== undefined)
        directives.push(`max-age=${options.maxAge}`);
    if (options.staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }
    if (options.staleIfError)
        directives.push(`stale-if-error=${options.staleIfError}`);
    if (options.custom)
        directives.push(options.custom);
    if (directives.length > 0) {
        c.header('Cache-Control', directives.join(', '));
    }
    // Merge Vary headers
    if (options.vary?.length) {
        const existingVary = c.res.headers.get('Vary');
        const varySet = new Set(existingVary ? existingVary.split(',').map((v) => v.trim()) : []);
        options.vary.forEach((v) => varySet.add(v));
        c.header('Vary', Array.from(varySet).join(', '));
    }
}
/**
 * Build Cache-Control header string from options
 */
export function buildCacheControl(options) {
    const directives = [];
    if (options.public)
        directives.push('public');
    if (options.private)
        directives.push('private');
    if (options.noCache)
        directives.push('no-cache');
    if (options.noStore)
        directives.push('no-store');
    if (options.maxAge !== undefined)
        directives.push(`max-age=${options.maxAge}`);
    if (options.staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }
    if (options.staleIfError)
        directives.push(`stale-if-error=${options.staleIfError}`);
    if (options.custom)
        directives.push(options.custom);
    return directives.join(', ');
}
/**
 * Map HTTP status code to error name
 */
function getErrorName(status) {
    const names = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
    };
    return names[status] || 'Error';
}
