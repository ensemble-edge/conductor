/**
 * Built-in Trigger Handlers
 *
 * Registers core trigger types that ship with Conductor.
 * Plugins can register additional triggers via the TriggerRegistry.
 */

import { z } from 'zod'
import type { Context } from 'hono'
import { getTriggerRegistry } from './trigger-registry.js'
import type { TriggerHandlerContext } from './trigger-registry.js'
import { Executor } from './executor.js'
import { createLogger } from '../observability/index.js'
import { cors } from 'hono/cors'
import { getHttpMiddlewareRegistry } from './http-middleware-registry.js'
import { createTriggerAuthMiddleware, type TriggerAuthConfig } from '../auth/trigger-auth.js'
import type {
  HTTPTriggerConfig,
  WebhookTriggerConfig,
  EmailTriggerConfig,
  MCPTriggerConfig,
} from './parser.js'

const logger = createLogger({ serviceName: 'built-in-triggers' })

/**
 * Rate limiter for HTTP-based triggers
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(
    private readonly maxRequests: number,
    private readonly windowSeconds: number
  ) {}

  async check(key: string): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - this.windowSeconds * 1000

    const existing = this.requests.get(key) || []
    const validRequests = existing.filter((time) => time > windowStart)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

/**
 * Path configuration for multi-path triggers
 */
interface PathConfig {
  path: string
  methods: string[]
}

/**
 * Normalize trigger paths - supports both single path and paths array
 *
 * Single path format:
 *   trigger:
 *     - type: http
 *       path: /api/users
 *       methods: [GET, POST]
 *
 * Multi-path format:
 *   trigger:
 *     - type: http
 *       paths:
 *         - path: /api/users
 *           methods: [GET, POST]
 *         - path: /api/users/:id
 *           methods: [GET, PUT, DELETE]
 */
function normalizePathConfigs(trigger: HTTPTriggerConfig, defaultPath: string): PathConfig[] {
  // Multi-path format takes precedence
  if (trigger.paths && Array.isArray(trigger.paths)) {
    return trigger.paths.map((p: { path: string; methods?: string[] }) => ({
      path: p.path,
      methods: p.methods || trigger.methods || ['GET'],
    }))
  }

  // Single path format (backwards compatible)
  return [
    {
      path: trigger.path || defaultPath,
      methods: trigger.methods || ['GET'],
    },
  ]
}

/**
 * HTTP Trigger Handler
 */
async function handleHTTPTrigger(context: TriggerHandlerContext): Promise<void> {
  const { app, ensemble, trigger: rawTrigger, agents, env, ctx } = context
  // Cast to typed trigger config
  const trigger = rawTrigger as HTTPTriggerConfig

  // Normalize to array of path configurations
  const pathConfigs = normalizePathConfigs(trigger, `/${ensemble.name}`)

  logger.info(
    `[HTTP] Registering ${pathConfigs.length} path(s) for ${ensemble.name}: ${pathConfigs.map((p) => `${p.methods.join(',')} ${p.path}`).join(', ')}`
  )

  // Build middleware chain - uses MiddlewareHandler from Hono
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const middlewareChain: any[] = []

  // CORS - provide default origin if not specified
  if (trigger.cors) {
    const corsConfig = {
      ...trigger.cors,
      origin: trigger.cors.origin ?? '*', // Default to allow all origins
    }
    middlewareChain.push(cors(corsConfig))
  }

  // Rate limiting
  if (trigger.rateLimit) {
    const rateLimiter = new RateLimiter(trigger.rateLimit.requests, trigger.rateLimit.window)
    middlewareChain.push(async (c: any, next: any) => {
      const key =
        trigger.rateLimit!.key === 'user'
          ? c.get('userId') || 'anonymous'
          : c.req.header('cf-connecting-ip') || 'unknown'

      if (!(await rateLimiter.check(key))) {
        return c.json({ error: 'Rate limit exceeded' }, 429)
      }
      await next()
    })
  }

  // Custom middleware
  if (trigger.middleware) {
    const middlewareRegistry = getHttpMiddlewareRegistry()
    // Cast middleware array - schema uses loose z.function() but middleware should be MiddlewareHandler
    type MiddlewareHandler = Parameters<typeof middlewareRegistry.resolve>[0][number]
    const resolved = middlewareRegistry.resolve(
      trigger.middleware as (string | MiddlewareHandler)[]
    )
    middlewareChain.push(...resolved)
  }

  // Auth - uses unified auth provider system
  if (trigger.auth) {
    try {
      const authMiddleware = createTriggerAuthMiddleware(trigger.auth as TriggerAuthConfig, env)
      middlewareChain.push(authMiddleware)
    } catch (error) {
      logger.error(
        `[HTTP] Failed to create auth middleware for ${ensemble.name}:`,
        error instanceof Error ? error : undefined
      )
      return
    }
  } else if (trigger.public !== true) {
    logger.warn(`[HTTP] Skipping ${ensemble.name}: no auth and not public`)
    return
  }

  // Main handler
  const handler = async (c: any) => {
    try {
      const input = await extractInput(c)
      const auth = c.get('auth')
      const executor = new Executor({ env, ctx, auth })

      for (const agent of agents) {
        executor.registerAgent(agent)
      }

      // Note: executeEnsemble expects input directly, not wrapped
      // The input already contains body + params + query from extractInput()
      const result = await executor.executeEnsemble(ensemble, input)

      if (!result.success) {
        logger.error(`[HTTP] Ensemble execution failed: ${ensemble.name}`, result.error)
        return c.json(
          {
            error: 'Ensemble execution failed',
            message: result.error.message,
          },
          500
        )
      }

      return renderResponse(c, result.value, trigger)
    } catch (error) {
      logger.error(
        `[HTTP] Execution failed: ${ensemble.name}`,
        error instanceof Error ? error : undefined
      )
      return c.json({ error: 'Execution failed' }, 500)
    }
  }

  // Register routes for all path configurations
  for (const pathConfig of pathConfigs) {
    for (const method of pathConfig.methods) {
      const m = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options'
      if (middlewareChain.length > 0) {
        app[m](pathConfig.path, ...middlewareChain, handler)
      } else {
        app[m](pathConfig.path, handler)
      }
    }
  }
}

/**
 * MCP Trigger Handler
 * Exposes ensembles as MCP tools for Claude Desktop and other MCP clients
 *
 * MCP (Model Context Protocol) allows AI assistants to discover and invoke tools.
 * This handler registers routes for:
 * - GET /mcp/tools - List available tools (ensembles exposed via MCP)
 * - POST /mcp/tools/:toolName - Invoke a specific tool
 */
async function handleMCPTrigger(context: TriggerHandlerContext): Promise<void> {
  const { app, ensemble, trigger: rawTrigger, agents, env, ctx } = context
  // Cast to typed trigger config
  const trigger = rawTrigger as MCPTriggerConfig

  // MCP tool name defaults to ensemble name (kebab-case recommended)
  const toolName = trigger.toolName || ensemble.name

  logger.info(`[MCP] Registering tool: ${toolName} → ${ensemble.name}`)

  // Build middleware chain for auth - uses unified auth provider system
  const middlewareChain: any[] = []

  if (trigger.auth) {
    try {
      const authMiddleware = createTriggerAuthMiddleware(trigger.auth as TriggerAuthConfig, env)
      middlewareChain.push(authMiddleware)
    } catch (error) {
      logger.error(
        `[MCP] Failed to create auth middleware for ${toolName}:`,
        error instanceof Error ? error : undefined
      )
      return
    }
  } else if (trigger.public !== true) {
    logger.warn(`[MCP] Skipping ${toolName}: no auth and not public`)
    return
  }

  // Register tool listing endpoint (GET /mcp/tools)
  // This aggregates all MCP-enabled ensembles
  const listHandler = async (c: any) => {
    // Get all MCP tools from app context (accumulated across ensembles)
    const mcpTools = (c.get('mcpTools') as Map<string, any>) || new Map()

    // Add this ensemble as a tool
    mcpTools.set(toolName, {
      name: toolName,
      description: ensemble.description || `Execute ${ensemble.name} ensemble`,
      inputSchema: buildInputSchema(ensemble),
    })

    // Store back for other handlers
    c.set('mcpTools', mcpTools)

    // Return MCP-compatible tool list
    return c.json({
      tools: Array.from(mcpTools.values()),
    })
  }

  // Register tool invocation endpoint (POST /mcp/tools/:toolName)
  const invokeHandler = async (c: any) => {
    const requestedTool = c.req.param('toolName')

    // Only handle requests for this specific tool
    if (requestedTool !== toolName) {
      return c.json({ error: `Tool not found: ${requestedTool}` }, 404)
    }

    try {
      const body = await c.req.json().catch(() => ({}))
      const input = body.arguments || body.input || body

      const auth = c.get('auth')
      const executor = new Executor({ env, ctx, auth })

      for (const agent of agents) {
        executor.registerAgent(agent)
      }

      const result = await executor.executeEnsemble(ensemble, input)

      if (!result.success) {
        logger.error(`[MCP] Tool execution failed: ${toolName}`, result.error)
        return c.json(
          {
            content: [
              {
                type: 'text',
                text: `Error: ${result.error.message}`,
              },
            ],
            isError: true,
          },
          200 // MCP returns 200 even for tool errors
        )
      }

      // Return MCP-compatible response
      return c.json({
        content: [
          {
            type: 'text',
            text:
              typeof result.value.output === 'string'
                ? result.value.output
                : JSON.stringify(result.value.output, null, 2),
          },
        ],
      })
    } catch (error) {
      logger.error(
        `[MCP] Tool invocation failed: ${toolName}`,
        error instanceof Error ? error : undefined
      )
      return c.json(
        {
          content: [
            {
              type: 'text',
              text: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        },
        200
      )
    }
  }

  // Register routes
  if (middlewareChain.length > 0) {
    app.get('/mcp/tools', ...middlewareChain, listHandler)
    app.post('/mcp/tools/:toolName', ...middlewareChain, invokeHandler)
  } else {
    app.get('/mcp/tools', listHandler)
    app.post('/mcp/tools/:toolName', invokeHandler)
  }
}

/**
 * Build JSON Schema for ensemble input
 * Used for MCP tool discovery
 */
function buildInputSchema(ensemble: any): any {
  const schema: any = {
    type: 'object',
    properties: {},
    required: [],
  }

  // Type for input definition objects
  interface InputDefinition {
    type?: string
    description?: string
    required?: boolean
  }

  // If ensemble has explicit input definition
  if (ensemble.input) {
    for (const [key, value] of Object.entries(ensemble.input)) {
      if (typeof value === 'object' && value !== null) {
        const inputDef = value as InputDefinition
        schema.properties[key] = {
          type: inputDef.type || 'string',
          description: inputDef.description || key,
        }
        if (inputDef.required) {
          schema.required.push(key)
        }
      } else {
        // Simple value - infer type
        schema.properties[key] = {
          type:
            typeof value === 'number'
              ? 'number'
              : typeof value === 'boolean'
                ? 'boolean'
                : 'string',
        }
      }
    }
  }

  // If ensemble has inputs (alternative format)
  if (ensemble.inputs) {
    for (const [key, value] of Object.entries(ensemble.inputs)) {
      if (typeof value === 'object' && value !== null) {
        const inputDef = value as InputDefinition
        schema.properties[key] = {
          type: inputDef.type || 'string',
          description: inputDef.description || key,
        }
        if (inputDef.required) {
          schema.required.push(key)
        }
      }
    }
  }

  return schema
}

/**
 * Webhook Trigger Handler
 * Simpler than HTTP - just POST endpoints
 */
async function handleWebhookTrigger(context: TriggerHandlerContext): Promise<void> {
  const { app, ensemble, trigger: rawTrigger, agents, env, ctx } = context
  // Cast to typed trigger config
  const trigger = rawTrigger as WebhookTriggerConfig

  const path = trigger.path || `/${ensemble.name}`
  const methods = trigger.methods || ['POST']

  logger.info(`[Webhook] Registering: ${methods.join(',')} ${path} → ${ensemble.name}`)

  // Auth middleware - uses unified auth provider system
  const middlewareChain: any[] = []

  if (trigger.auth) {
    try {
      const authMiddleware = createTriggerAuthMiddleware(trigger.auth as TriggerAuthConfig, env)
      middlewareChain.push(authMiddleware)
    } catch (error) {
      logger.error(
        `[Webhook] Failed to create auth middleware for ${path}:`,
        error instanceof Error ? error : undefined
      )
      return
    }
  } else if (trigger.public !== true) {
    logger.warn(`[Webhook] Skipping ${path}: no auth and not public`)
    return
  }

  // Handler
  const handler = async (c: any) => {
    try {
      const input = await c.req.json().catch(() => ({}))
      const auth = c.get('auth')
      const executor = new Executor({ env, ctx, auth })

      for (const agent of agents) {
        executor.registerAgent(agent)
      }

      // Note: executeEnsemble expects input directly
      const result = await executor.executeEnsemble(ensemble, input)

      if (!result.success) {
        logger.error(`[Webhook] Ensemble execution failed: ${ensemble.name}`, result.error)
        return c.json(
          {
            error: 'Ensemble execution failed',
            message: result.error.message,
          },
          500
        )
      }

      return c.json(result.value.output)
    } catch (error) {
      logger.error(
        `[Webhook] Execution failed: ${ensemble.name}`,
        error instanceof Error ? error : undefined
      )
      return c.json({ error: 'Execution failed' }, 500)
    }
  }

  // Register routes
  for (const method of methods) {
    const m = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'
    if (middlewareChain.length > 0) {
      app[m](path, ...middlewareChain, handler)
    } else {
      app[m](path, handler)
    }
  }
}

/**
 * Extract input from HTTP request
 *
 * Returns a structured object that provides access to all parts of the request:
 * - body: Parsed JSON body or form data (for POST/PUT/PATCH)
 * - params: URL path parameters (e.g., /users/:id → { id: "123" })
 * - query: Query string parameters (e.g., ?foo=bar → { foo: "bar" })
 * - method: HTTP method (GET, POST, etc.)
 * - path: Request path
 * - headers: Request headers (commonly used ones)
 *
 * For backwards compatibility, body fields are also spread at the root level.
 *
 * Usage in YAML:
 *   input:
 *     email: ${input.body.email}       # Structured access
 *     email: ${input.email}            # Backwards compatible
 *     userId: ${input.params.id}       # URL params
 *     page: ${input.query.page}        # Query params
 *     isPost: ${input.method == 'POST'} # Check method
 */
async function extractInput(c: any): Promise<any> {
  const method = c.req.method
  const contentType = c.req.header('content-type') || ''
  const path = c.req.path

  // Parse body for POST/PUT/PATCH requests
  let body: Record<string, any> = {}
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      if (contentType.includes('application/json')) {
        body = await c.req.json()
      } else if (contentType.includes('form')) {
        body = await c.req.parseBody()
      }
    } catch (e) {
      // Ignore parsing errors - body remains empty object
    }
  }

  // Get URL params and query params
  const params = c.req.param() || {}
  const query = c.req.query() || {}

  // Extract commonly used headers
  const headers: Record<string, string | undefined> = {
    'content-type': c.req.header('content-type'),
    'user-agent': c.req.header('user-agent'),
    accept: c.req.header('accept'),
    authorization: c.req.header('authorization'),
    'x-request-id': c.req.header('x-request-id'),
    'x-forwarded-for': c.req.header('x-forwarded-for'),
    'cf-connecting-ip': c.req.header('cf-connecting-ip'),
    referer: c.req.header('referer'),
    origin: c.req.header('origin'),
  }

  // Return structured input with backwards compatibility
  // Body fields are spread at root for backwards compatibility
  return {
    // Backwards compatible: spread body at root
    ...body,

    // Structured access to request parts
    body,
    params,
    query,
    method,
    path,
    headers,

    // Convenience: also expose raw request info
    url: c.req.url,
  }
}

/** Type for output that may contain HTML */
interface HtmlOutput {
  html?: string
}

/**
 * Render HTTP response
 * Handles ExecutionOutput from the executor
 */
function renderResponse(
  c: Context,
  executionOutput: { output: unknown },
  trigger: HTTPTriggerConfig
): Response {
  const accept = c.req.header('accept') || ''
  const output = executionOutput.output

  // Apply HTTP cache headers from trigger config
  applyHttpCacheHeaders(c, trigger)

  // HTML rendering
  if (trigger.responses?.html?.enabled && accept.includes('text/html')) {
    // Check if output has HTML (from html agent)
    const htmlOutput = output as HtmlOutput | null
    if (htmlOutput && typeof htmlOutput === 'object' && 'html' in htmlOutput && htmlOutput.html) {
      return c.html(htmlOutput.html)
    }
    // Fallback: check if output itself is a string (might be HTML)
    if (typeof output === 'string') {
      return c.html(output)
    }
    return c.json(
      {
        error:
          'HTML output not found. Ensure your ensemble uses operation: html to generate HTML content.',
      },
      500
    )
  }

  // JSON (default or explicit)
  if (trigger.responses?.json?.enabled) {
    const data = trigger.responses.json.transform
      ? trigger.responses.json.transform(output)
      : output
    return c.json(data)
  }

  // Default: return output as JSON
  return c.json(output)
}

/**
 * Apply HTTP Cache-Control headers from trigger configuration
 *
 * Uses the cache config from the trigger to set HTTP response caching headers.
 */
function applyHttpCacheHeaders(c: Context, trigger: HTTPTriggerConfig): void {
  if (trigger.cache?.enabled && trigger.cache.ttl) {
    c.header('Cache-Control', `public, max-age=${trigger.cache.ttl}`)
    if (trigger.cache.vary?.length) {
      c.header('Vary', trigger.cache.vary.join(', '))
    }
  }
}

/**
 * Register all built-in triggers
 * Called during Conductor initialization
 */
export function registerBuiltInTriggers(): void {
  const registry = getTriggerRegistry()

  // HTTP Trigger
  registry.register(handleHTTPTrigger, {
    type: 'http',
    name: 'HTTP Trigger',
    description: 'Full web routing with Hono features (CORS, rate limiting, caching)',
    schema: z.object({
      type: z.literal('http'),
      path: z.string().optional(),
      methods: z
        .array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']))
        .optional(),
      auth: z
        .object({ type: z.enum(['bearer', 'signature', 'basic']), secret: z.string() })
        .optional(),
      public: z.boolean().optional(),
      rateLimit: z.object({ requests: z.number(), window: z.number() }).optional(),
      cors: z.object({ origin: z.union([z.string(), z.array(z.string())]).optional() }).optional(),
      responses: z
        .object({
          html: z.object({ enabled: z.boolean() }).optional(),
          json: z.object({ enabled: z.boolean() }).optional(),
        })
        .optional(),
      templateEngine: z.enum(['handlebars', 'liquid', 'simple']).optional(),
      middleware: z.array(z.any()).optional(),
    }),
    requiresAuth: false,
    tags: ['http', 'web', 'routing'],
  })

  // Webhook Trigger
  registry.register(handleWebhookTrigger, {
    type: 'webhook',
    name: 'Webhook Trigger',
    description: 'Simple POST endpoints for receiving webhooks',
    schema: z.object({
      type: z.literal('webhook'),
      path: z.string().optional(),
      methods: z.array(z.enum(['POST', 'GET', 'PUT', 'PATCH', 'DELETE'])).optional(),
      auth: z
        .object({ type: z.enum(['bearer', 'signature', 'basic']), secret: z.string() })
        .optional(),
      public: z.boolean().optional(),
    }),
    requiresAuth: false,
    tags: ['webhook', 'api'],
  })

  // MCP Trigger
  registry.register(handleMCPTrigger, {
    type: 'mcp',
    name: 'MCP Trigger',
    description: 'Expose ensembles as MCP tools for Claude Desktop and other MCP clients',
    schema: z.object({
      type: z.literal('mcp'),
      toolName: z.string().optional(),
      auth: z
        .object({ type: z.enum(['bearer', 'signature', 'basic']), secret: z.string() })
        .optional(),
      public: z.boolean().optional(),
    }),
    requiresAuth: false,
    tags: ['mcp', 'ai', 'tools'],
  })

  logger.info('[Built-in Triggers] Registered HTTP, Webhook, and MCP triggers')
}
