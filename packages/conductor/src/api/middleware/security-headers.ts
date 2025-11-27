/**
 * Security Headers Middleware
 *
 * Adds production-grade security headers to all responses.
 * Based on OWASP recommendations and Cloudflare best practices.
 *
 * @module api/middleware/security-headers
 */

import type { MiddlewareHandler } from 'hono'
import type { ConductorContext } from '../types.js'

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  /**
   * Enable HSTS (Strict-Transport-Security)
   * @default true with maxAge=31536000 (1 year)
   */
  hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean }

  /**
   * X-Frame-Options value
   * @default 'DENY'
   */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false

  /**
   * X-Content-Type-Options: nosniff
   * @default true
   */
  noSniff?: boolean

  /**
   * X-XSS-Protection header
   * Note: Deprecated in modern browsers but still useful for older ones
   * @default true
   */
  xssProtection?: boolean

  /**
   * Referrer-Policy
   * @default 'strict-origin-when-cross-origin'
   */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
    | false

  /**
   * Permissions-Policy (formerly Feature-Policy)
   * @default sensible defaults disabling dangerous features
   */
  permissionsPolicy?: Record<string, string[]> | false

  /**
   * Cross-Origin-Opener-Policy
   * @default 'same-origin'
   */
  crossOriginOpenerPolicy?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin' | false

  /**
   * Cross-Origin-Embedder-Policy
   * @default false (can break external resources)
   */
  crossOriginEmbedderPolicy?: 'unsafe-none' | 'require-corp' | 'credentialless' | false

  /**
   * Cross-Origin-Resource-Policy
   * @default 'same-origin'
   */
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin' | false
}

/**
 * Default security headers configuration
 */
const defaultConfig: Required<SecurityHeadersConfig> = {
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: false },
  frameOptions: 'DENY',
  noSniff: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    // Disable potentially dangerous features by default
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    'interest-cohort': [], // Disable FLoC
  },
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginEmbedderPolicy: false, // Can break external resources
  crossOriginResourcePolicy: 'same-origin',
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
export function securityHeaders(config?: SecurityHeadersConfig): MiddlewareHandler {
  const mergedConfig = { ...defaultConfig, ...config }

  return async (c: ConductorContext, next) => {
    await next()

    // Skip if response body is already streaming (can't modify headers)
    if (c.res.body && 'locked' in c.res.body && c.res.body.locked) {
      return
    }

    // HSTS - Strict-Transport-Security
    if (mergedConfig.hsts !== false) {
      const hsts = mergedConfig.hsts === true ? defaultConfig.hsts : mergedConfig.hsts
      if (typeof hsts === 'object') {
        const parts = [`max-age=${hsts.maxAge ?? 31536000}`]
        if (hsts.includeSubDomains) parts.push('includeSubDomains')
        if (hsts.preload) parts.push('preload')
        c.header('Strict-Transport-Security', parts.join('; '))
      }
    }

    // X-Frame-Options
    if (mergedConfig.frameOptions !== false) {
      c.header('X-Frame-Options', mergedConfig.frameOptions)
    }

    // X-Content-Type-Options
    if (mergedConfig.noSniff) {
      c.header('X-Content-Type-Options', 'nosniff')
    }

    // X-XSS-Protection (legacy but useful for older browsers)
    if (mergedConfig.xssProtection) {
      c.header('X-XSS-Protection', '1; mode=block')
    }

    // Referrer-Policy
    if (mergedConfig.referrerPolicy !== false) {
      c.header('Referrer-Policy', mergedConfig.referrerPolicy)
    }

    // Permissions-Policy
    if (mergedConfig.permissionsPolicy !== false) {
      const policy = Object.entries(mergedConfig.permissionsPolicy)
        .map(([feature, values]) => {
          if (values.length === 0) return `${feature}=()`
          return `${feature}=(${values.map((v) => `"${v}"`).join(' ')})`
        })
        .join(', ')
      if (policy) {
        c.header('Permissions-Policy', policy)
      }
    }

    // Cross-Origin-Opener-Policy
    if (mergedConfig.crossOriginOpenerPolicy !== false) {
      c.header('Cross-Origin-Opener-Policy', mergedConfig.crossOriginOpenerPolicy)
    }

    // Cross-Origin-Embedder-Policy
    if (mergedConfig.crossOriginEmbedderPolicy !== false) {
      c.header('Cross-Origin-Embedder-Policy', mergedConfig.crossOriginEmbedderPolicy)
    }

    // Cross-Origin-Resource-Policy
    if (mergedConfig.crossOriginResourcePolicy !== false) {
      c.header('Cross-Origin-Resource-Policy', mergedConfig.crossOriginResourcePolicy)
    }
  }
}

/**
 * Preset: API-optimized security headers
 * Less restrictive than browser-facing defaults
 */
export const apiSecurityPreset: SecurityHeadersConfig = {
  hsts: true,
  frameOptions: 'DENY',
  noSniff: true,
  xssProtection: false, // Not relevant for JSON APIs
  referrerPolicy: 'no-referrer',
  permissionsPolicy: false, // Not relevant for APIs
  crossOriginOpenerPolicy: false, // Not relevant for APIs
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: 'same-origin',
}

/**
 * Preset: Strict browser-facing security headers
 */
export const strictSecurityPreset: SecurityHeadersConfig = {
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true }, // 2 years
  frameOptions: 'DENY',
  noSniff: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    bluetooth: [],
    midi: [],
    'interest-cohort': [],
  },
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginResourcePolicy: 'same-origin',
}
