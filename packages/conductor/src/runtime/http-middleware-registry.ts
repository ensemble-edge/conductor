/**
 * HTTP Middleware Registry
 *
 * Allows registration of named Hono middleware that can be referenced
 * in YAML ensemble files by string identifier.
 *
 * This is specifically for HTTP trigger middleware (Hono framework).
 *
 * Example usage:
 * ```typescript
 * import { getHttpMiddlewareRegistry } from '@ensemble-edge/conductor'
 * import { logger } from 'hono/logger'
 *
 * const registry = getHttpMiddlewareRegistry()
 * registry.register('logger', logger())
 * ```
 *
 * Then in YAML:
 * ```yaml
 * trigger:
 *   - type: http
 *     middleware: [logger, compress, timing]
 * ```
 */

import type { MiddlewareHandler } from 'hono'
import { createLogger } from '../observability/index.js'

const logger = createLogger({ serviceName: 'http-middleware-registry' })

export interface HttpMiddlewareMetadata {
  /**
   * Middleware identifier (e.g., 'logger', 'compress', 'timing')
   */
  name: string

  /**
   * Human-readable description
   */
  description: string

  /**
   * Package that provides this middleware (optional)
   */
  package?: string

  /**
   * Configuration options (optional)
   */
  configurable?: boolean
}

/**
 * Global registry for named Hono middleware (HTTP trigger specific)
 */
export class HttpMiddlewareRegistry {
  private static instance: HttpMiddlewareRegistry | null = null
  private middleware: Map<string, MiddlewareHandler> = new Map()
  private metadata: Map<string, HttpMiddlewareMetadata> = new Map()

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): HttpMiddlewareRegistry {
    if (!HttpMiddlewareRegistry.instance) {
      HttpMiddlewareRegistry.instance = new HttpMiddlewareRegistry()
    }
    return HttpMiddlewareRegistry.instance
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.middleware.clear()
    this.metadata.clear()
  }

  /**
   * Register a middleware handler
   */
  register(
    name: string,
    handler: MiddlewareHandler,
    metadata?: Partial<HttpMiddlewareMetadata>
  ): void {
    if (this.middleware.has(name)) {
      logger.warn(`[HttpMiddlewareRegistry] Overwriting middleware: ${name}`)
    }

    this.middleware.set(name, handler)

    const fullMetadata: HttpMiddlewareMetadata = {
      name,
      description: metadata?.description || name,
      package: metadata?.package,
      configurable: metadata?.configurable || false,
    }

    this.metadata.set(name, fullMetadata)

    logger.info(`[HttpMiddlewareRegistry] Registered middleware: ${name}`, {
      package: fullMetadata.package,
    })
  }

  /**
   * Get middleware handler by name
   */
  get(name: string): MiddlewareHandler | undefined {
    return this.middleware.get(name)
  }

  /**
   * Get metadata for a middleware
   */
  getMetadata(name: string): HttpMiddlewareMetadata | undefined {
    return this.metadata.get(name)
  }

  /**
   * Check if middleware exists
   */
  has(name: string): boolean {
    return this.middleware.has(name)
  }

  /**
   * List all registered middleware names
   */
  list(): string[] {
    return Array.from(this.middleware.keys())
  }

  /**
   * Get all middleware metadata
   */
  getAllMetadata(): HttpMiddlewareMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * Resolve middleware array from mixed string/function array
   * Supports both YAML (strings) and TypeScript (functions)
   */
  resolve(middlewareArray: (string | MiddlewareHandler)[]): MiddlewareHandler[] {
    const resolved: MiddlewareHandler[] = []

    for (const item of middlewareArray) {
      if (typeof item === 'string') {
        // String identifier - look up in registry
        const handler = this.get(item)
        if (!handler) {
          logger.warn(`[HttpMiddlewareRegistry] Middleware not found: ${item}`, {
            available: this.list(),
          })
          continue
        }
        resolved.push(handler)
      } else if (typeof item === 'function') {
        // Direct function reference (TypeScript usage)
        resolved.push(item)
      } else {
        logger.warn(`[HttpMiddlewareRegistry] Invalid middleware type: ${typeof item}`, { item })
      }
    }

    return resolved
  }
}

/**
 * Get the global HTTP middleware registry instance
 */
export function getHttpMiddlewareRegistry(): HttpMiddlewareRegistry {
  return HttpMiddlewareRegistry.getInstance()
}
