/**
 * HonoConductorBridge
 *
 * Bridges Conductor's intelligent page system with Hono's routing.
 * Converts Conductor operations into Hono middleware chains.
 */

import type { Hono, Context, MiddlewareHandler } from 'hono'
import type { PageAgent } from '../agents/page/page-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import type { ConductorEnv } from '../types/env.js'
import { OperationRegistry, type OperationContext } from '../runtime/operation-registry.js'

/**
 * Page operation definition
 * Operations are converted to Hono middleware
 */
export interface PageOperation {
  name: string
  operation: string
  config: Record<string, any>
  handler?: (context: OperationContext) => Promise<any>
}

export interface RateLimitConfig {
  requests: number
  window: number
  key?: 'ip' | 'user' | ((context: OperationContext) => string)
}

export interface CorsConfig {
  origin?: string | string[]
  methods?: string[]
  allowHeaders?: string[]
  exposeHeaders?: string[]
  credentials?: boolean
}

export interface RouteConfig {
  path: string
  methods?: string[]
  auth?: 'none' | 'required' | 'optional'
  rateLimit?: RateLimitConfig
  cors?: CorsConfig
  middleware?: MiddlewareHandler[]
}

export interface ResponsesConfig {
  html?: { enabled: boolean }
  json?: { enabled: boolean; transform?: (data: any) => any }
  stream?: { enabled: boolean; chunkSize?: number }
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  vary?: string[]
  tags?: string[]
  keyGenerator?: (context: OperationContext) => string
}

/**
 * Extended page route configuration
 * Combines Hono routing + Conductor intelligence
 */
export interface PageRouteConfig extends AgentConfig {
  route: RouteConfig
  beforeRender?: PageOperation[]
  afterRender?: PageOperation[]
  responses?: ResponsesConfig
  layout?: string
  layoutProps?: Record<string, any>
  cache?: CacheConfig
}

/**
 * HonoConductorBridge
 *
 * Bridges Conductor's intelligent page system with Hono's routing.
 * Converts Conductor operations into Hono middleware chains.
 */
export class HonoConductorBridge {
  private app: Hono
  private pages: Map<string, PageAgent> = new Map()
  private layouts: Map<string, PageAgent> = new Map()
  private operationRegistry: OperationRegistry
  private rateLimiters: Map<string, RateLimiter> = new Map()

  constructor(app: Hono, operationRegistry?: OperationRegistry) {
    this.app = app
    this.operationRegistry = operationRegistry || OperationRegistry.getInstance()
  }

  /**
   * Register a PageAgent as Hono route(s)
   */
  registerPage(config: PageRouteConfig, agent: PageAgent): void {
    const { route } = config
    const path = this.normalizePath(route.path)
    const methods = route.methods || ['GET']

    // Build middleware chain from Conductor operations
    const middleware = this.buildMiddlewareChain(config)

    // Main handler: execute PageAgent and return response
    const handler = this.createPageHandler(config, agent)

    // Register with Hono for each HTTP method
    for (const method of methods.map((m) => m.toLowerCase())) {
      ;(this.app as any)[method](path, ...middleware, handler)
    }

    // Store agent reference
    this.pages.set(config.name, agent)
  }

  /**
   * Register a layout template
   */
  registerLayout(name: string, agent: PageAgent): void {
    this.layouts.set(name, agent)
  }

  /**
   * Build middleware chain from page configuration
   */
  private buildMiddlewareChain(config: PageRouteConfig): MiddlewareHandler[] {
    const middleware: MiddlewareHandler[] = []

    // Initialize conductor data store
    middleware.push(async (c, next) => {
      c.set('conductorData', {})
      await next()
    })

    // Auth middleware
    if (config.route.auth === 'required') {
      middleware.push(this.createAuthMiddleware())
    } else if (config.route.auth === 'optional') {
      middleware.push(this.createOptionalAuthMiddleware())
    }

    // Rate limiting middleware
    if (config.route.rateLimit) {
      middleware.push(this.createRateLimitMiddleware(config.route.rateLimit))
    }

    // CORS middleware
    if (config.route.cors) {
      middleware.push(this.createCorsMiddleware(config.route.cors))
    }

    // Custom Hono middleware
    if (config.route.middleware) {
      middleware.push(...config.route.middleware)
    }

    // Cache check middleware (before operations)
    if (config.cache?.enabled) {
      middleware.push(this.createCacheCheckMiddleware(config.cache))
    }

    // Convert beforeRender operations to middleware
    if (config.beforeRender) {
      for (const operation of config.beforeRender) {
        middleware.push(this.operationToMiddleware(operation))
      }
    }

    return middleware
  }

  /**
   * Create page handler (final handler in chain)
   */
  private createPageHandler(config: PageRouteConfig, agent: PageAgent): MiddlewareHandler {
    return async (c: Context) => {
      // Extract route params, query, headers
      const params = c.req.param()
      const query = c.req.query()
      const headers = Object.fromEntries(c.req.raw.headers.entries())

      // Get accumulated data from middleware
      const conductorData = c.get('conductorData') || {}

      // Build input for PageAgent
      const input = {
        params,
        query,
        headers,
        request: c.req.raw,
        data: conductorData,
        env: c.env,
        ctx: c.executionCtx,
      }

      try {
        // Execute PageAgent
        const result = await agent.execute({
          input,
          env: c.env as ConductorEnv,
          ctx: c.executionCtx,
          state: {},
          previousOutputs: {},
        })

        if (!result.success) {
          throw new Error(result.error || 'Page render failed')
        }

        const output = (result.output || result.data) as any

        // Content negotiation based on Accept header
        const accept = c.req.header('Accept') || 'text/html'

        // JSON response
        if (config.responses?.json?.enabled && accept.includes('application/json')) {
          const jsonData = config.responses.json.transform
            ? config.responses.json.transform(output)
            : { ...conductorData, html: output.html }

          return c.json(jsonData)
        }

        // Default: HTML response
        return c.html(output.html, 200, output.headers)
      } catch (error) {
        console.error('Page execution error:', error)
        throw error
      }
    }
  }

  /**
   * Convert Conductor operation to Hono middleware
   */
  private operationToMiddleware(operation: PageOperation): MiddlewareHandler {
    return async (c: Context, next) => {
      const context: OperationContext = {
        request: c.req.raw,
        env: c.env as ConductorEnv,
        ctx: c.executionCtx,
        params: c.req.param(),
        query: c.req.query(),
        headers: Object.fromEntries(c.req.raw.headers.entries()),
        data: c.get('conductorData') || {},
        contextType: 'page',
      }

      try {
        // Get operation from GLOBAL registry
        const handler = this.operationRegistry.get(operation.operation)

        if (handler) {
          // Execute registered operation handler
          const operationResult = await handler.execute(
            {
              operation: operation.operation,
              config: operation.config,
            },
            {
              ...context,
              data: context.data,
              contextType: 'page',
            }
          )

          // Store result in conductor data
          const existingData = c.get('conductorData') || {}
          c.set('conductorData', {
            ...existingData,
            [operation.name]: operationResult,
          })
        } else if (operation.handler) {
          // Execute inline handler
          const operationResult = await operation.handler(context)
          const existingData = c.get('conductorData') || {}
          c.set('conductorData', {
            ...existingData,
            [operation.name]: operationResult,
          })
        } else {
          console.warn(`No handler found for operation: ${operation.operation}`)
        }

        await next()
      } catch (error) {
        console.error(`Operation error [${operation.name}]:`, error)
        throw error
      }
    }
  }

  /**
   * Create auth middleware
   */
  private createAuthMiddleware(): MiddlewareHandler {
    return async (c: Context, next) => {
      const authHeader = c.req.header('Authorization')

      if (!authHeader) {
        return c.json({ error: 'Unauthorized', message: 'Missing Authorization header' }, 401)
      }

      // TODO: Integrate with Conductor's auth system
      const user = { id: 'user-123', authenticated: true }

      c.set('conductorData', {
        ...c.get('conductorData'),
        auth: { authenticated: true, user },
      })

      await next()
    }
  }

  /**
   * Create optional auth middleware
   */
  private createOptionalAuthMiddleware(): MiddlewareHandler {
    return async (c: Context, next) => {
      const authHeader = c.req.header('Authorization')

      if (authHeader) {
        const user = { id: 'user-123', authenticated: true }
        c.set('conductorData', {
          ...c.get('conductorData'),
          auth: { authenticated: true, user },
        })
      } else {
        c.set('conductorData', {
          ...c.get('conductorData'),
          auth: { authenticated: false },
        })
      }

      await next()
    }
  }

  /**
   * Create rate limit middleware
   */
  private createRateLimitMiddleware(config: RateLimitConfig): MiddlewareHandler {
    return async (c: Context, next) => {
      // Generate rate limit key
      let key: string

      if (typeof config.key === 'function') {
        const context: OperationContext = {
          request: c.req.raw,
          env: c.env as ConductorEnv,
          ctx: c.executionCtx,
          params: c.req.param(),
          query: c.req.query(),
          headers: Object.fromEntries(c.req.raw.headers.entries()),
          data: c.get('conductorData') || {},
          contextType: 'page',
        }
        key = config.key(context)
      } else if (config.key === 'user') {
        const conductorData = c.get('conductorData') || {}
        key = conductorData.auth?.user?.id || c.req.header('CF-Connecting-IP') || 'unknown'
      } else {
        // Default: IP-based
        key = c.req.header('CF-Connecting-IP') || 'unknown'
      }

      // Check rate limit
      const rateLimiter = this.getRateLimiter(`${key}:${c.req.path}`)
      const allowed = await rateLimiter.check(config.requests, config.window, c.env as ConductorEnv)

      if (!allowed) {
        return c.json(
          {
            error: 'TooManyRequests',
            message: `Rate limit exceeded: ${config.requests} requests per ${config.window}s`,
          },
          429
        )
      }

      await next()
    }
  }

  /**
   * Create CORS middleware
   */
  private createCorsMiddleware(config: CorsConfig): MiddlewareHandler {
    return async (c: Context, next) => {
      const origin = c.req.header('Origin')

      // Check if origin is allowed
      let allowedOrigin = '*'
      if (Array.isArray(config.origin)) {
        if (origin && config.origin.includes(origin)) {
          allowedOrigin = origin
        }
      } else if (config.origin) {
        allowedOrigin = config.origin
      }

      // Set CORS headers
      c.header('Access-Control-Allow-Origin', allowedOrigin)

      if (config.methods) {
        c.header('Access-Control-Allow-Methods', config.methods.join(', '))
      }

      if (config.allowHeaders) {
        c.header('Access-Control-Allow-Headers', config.allowHeaders.join(', '))
      }

      if (config.exposeHeaders) {
        c.header('Access-Control-Expose-Headers', config.exposeHeaders.join(', '))
      }

      if (config.credentials) {
        c.header('Access-Control-Allow-Credentials', 'true')
      }

      // Handle preflight
      if (c.req.method === 'OPTIONS') {
        return new Response('', { status: 204 })
      }

      await next()
    }
  }

  /**
   * Create cache check middleware
   */
  private createCacheCheckMiddleware(config: CacheConfig): MiddlewareHandler {
    return async (c: Context, next) => {
      const env = c.env as ConductorEnv

      if (!env.PAGE_CACHE) {
        await next()
        return
      }

      // Generate cache key
      const context: OperationContext = {
        request: c.req.raw,
        env,
        ctx: c.executionCtx,
        params: c.req.param(),
        query: c.req.query(),
        headers: Object.fromEntries(c.req.raw.headers.entries()),
        data: {},
        contextType: 'page',
      }

      const cacheKey = config.keyGenerator
        ? config.keyGenerator(context)
        : this.generateCacheKey(c.req.path, context.query || {})

      // Check cache
      const cached = await env.PAGE_CACHE.get(cacheKey, 'json')

      if (cached) {
        // Cache hit - return cached response
        const cachedOutput = cached as any
        return c.html(cachedOutput.html, 200, cachedOutput.headers)
      }

      // Cache miss - continue to page rendering
      await next()
    }
  }

  /**
   * Get or create rate limiter
   */
  private getRateLimiter(key: string): RateLimiter {
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, new RateLimiter(key))
    }
    return this.rateLimiters.get(key)!
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(path: string, query: Record<string, string>): string {
    const queryString = Object.entries(query)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    return `page:${path}${queryString ? `:${queryString}` : ''}`
  }

  /**
   * Normalize path
   */
  private normalizePath(path: string): string {
    path = path.startsWith('/') ? path : `/${path}`
    path = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
    return path
  }
}

/**
 * Simple rate limiter using KV
 */
class RateLimiter {
  constructor(private key: string) {}

  async check(requests: number, windowSeconds: number, env: ConductorEnv): Promise<boolean> {
    if (!env.RATE_LIMIT_KV) {
      return true
    }

    const now = Math.floor(Date.now() / 1000)
    const windowKey = `${this.key}:${Math.floor(now / windowSeconds)}`

    // Get current count
    const current = await env.RATE_LIMIT_KV.get(windowKey)
    const count = current ? parseInt(current) : 0

    if (count >= requests) {
      return false
    }

    // Increment count
    await env.RATE_LIMIT_KV.put(windowKey, String(count + 1), {
      expirationTtl: windowSeconds * 2,
    })

    return true
  }
}
