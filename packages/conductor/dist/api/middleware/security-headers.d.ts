/**
 * Security Headers Middleware
 *
 * Adds production-grade security headers to all responses.
 * Based on OWASP recommendations and Cloudflare best practices.
 *
 * @module api/middleware/security-headers
 */
import type { MiddlewareHandler } from 'hono';
/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
    /**
     * Enable HSTS (Strict-Transport-Security)
     * @default true with maxAge=31536000 (1 year)
     */
    hsts?: boolean | {
        maxAge?: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    };
    /**
     * X-Frame-Options value
     * @default 'DENY'
     */
    frameOptions?: 'DENY' | 'SAMEORIGIN' | false;
    /**
     * X-Content-Type-Options: nosniff
     * @default true
     */
    noSniff?: boolean;
    /**
     * X-XSS-Protection header
     * Note: Deprecated in modern browsers but still useful for older ones
     * @default true
     */
    xssProtection?: boolean;
    /**
     * Referrer-Policy
     * @default 'strict-origin-when-cross-origin'
     */
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url' | false;
    /**
     * Permissions-Policy (formerly Feature-Policy)
     * @default sensible defaults disabling dangerous features
     */
    permissionsPolicy?: Record<string, string[]> | false;
    /**
     * Cross-Origin-Opener-Policy
     * @default 'same-origin'
     */
    crossOriginOpenerPolicy?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin' | false;
    /**
     * Cross-Origin-Embedder-Policy
     * @default false (can break external resources)
     */
    crossOriginEmbedderPolicy?: 'unsafe-none' | 'require-corp' | 'credentialless' | false;
    /**
     * Cross-Origin-Resource-Policy
     * @default 'same-origin'
     */
    crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin' | false;
}
/**
 * Security headers middleware
 *
 * @example
 * ```ts
 * // Use defaults
 * app.use('*', securityHeaders())
 *
 * // Customize
 * app.use('*', securityHeaders({
 *   hsts: { maxAge: 86400 },
 *   frameOptions: 'SAMEORIGIN',
 * }))
 *
 * // Disable specific headers
 * app.use('*', securityHeaders({
 *   frameOptions: false,
 *   xssProtection: false,
 * }))
 * ```
 */
export declare function securityHeaders(config?: SecurityHeadersConfig): MiddlewareHandler;
/**
 * Preset: API-optimized security headers
 * Less restrictive than browser-facing defaults
 */
export declare const apiSecurityPreset: SecurityHeadersConfig;
/**
 * Preset: Strict browser-facing security headers
 */
export declare const strictSecurityPreset: SecurityHeadersConfig;
//# sourceMappingURL=security-headers.d.ts.map