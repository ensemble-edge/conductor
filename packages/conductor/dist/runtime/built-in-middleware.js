/**
 * Built-in Middleware Registration
 *
 * Registers common Hono middleware that can be used in YAML ensembles
 * by string reference.
 */
import { logger as honoLogger } from 'hono/logger';
import { compress } from 'hono/compress';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { etag } from 'hono/etag';
import { getHttpMiddlewareRegistry } from './http-middleware-registry.js';
import { createLogger } from '../observability/index.js';
const logger = createLogger({ serviceName: 'built-in-middleware' });
/**
 * Register all built-in Hono middleware
 * Called during Conductor initialization
 */
export function registerBuiltInMiddleware() {
    const registry = getHttpMiddlewareRegistry();
    // Logger - logs requests to console
    registry.register('logger', honoLogger(), {
        description: 'HTTP request/response logger',
        package: 'hono/logger',
    });
    // Compress - gzip/brotli compression
    // NOTE: Cloudflare Workers automatically compress responses at the edge.
    // Only use this middleware for non-Cloudflare deployments to avoid double compression.
    registry.register('compress', compress(), {
        description: 'Response compression (gzip, brotli) - skip on Cloudflare (auto-compressed)',
        package: 'hono/compress',
    });
    // Timing - adds Server-Timing header
    registry.register('timing', timing(), {
        description: 'Server-Timing performance metrics',
        package: 'hono/timing',
    });
    // Secure Headers - adds security headers
    registry.register('secure-headers', secureHeaders(), {
        description: 'Security headers (X-Frame-Options, CSP, etc)',
        package: 'hono/secure-headers',
    });
    // Pretty JSON - formats JSON responses
    registry.register('pretty-json', prettyJSON(), {
        description: 'Pretty-print JSON responses',
        package: 'hono/pretty-json',
    });
    // ETag - generates ETags for caching
    registry.register('etag', etag(), {
        description: 'ETag generation for cache validation',
        package: 'hono/etag',
    });
    logger.info('[Built-in Middleware] Registered 6 middleware handlers', {
        middleware: registry.list(),
    });
}
