/**
 * Conductor Worker - Pages with Hono Integration
 *
 * This template demonstrates Pages with Hono routing:
 * - Auto-discovery of pages from pages/ directory
 * - Conductor operations in pages (beforeRender)
 * - Hono middleware (CORS, JWT, compression, etc.)
 * - Content negotiation (HTML/JSON via Accept header)
 * - Rate limiting, CORS, auth per route
 * - Custom 404/500 pages
 * - Durable Objects for stateful workflows
 */

import { Hono } from 'hono'
import { PageLoader, register404Handler, register500Handler, PageAgent } from '@ensemble-edge/conductor'
import type { AgentConfig } from '@ensemble-edge/conductor'
import { parse as parseYAML } from 'yaml'

// Import Durable Objects
import { ExecutionState, HITLState } from '@ensemble-edge/conductor/cloudflare'

// Auto-discovered pages from pages/ directory
import { pages as discoveredPages } from 'virtual:conductor-pages'

// ==================== Initialize Hono App ====================
const app = new Hono<{ Bindings: Env }>()

// ==================== Initialize PageLoader ====================
const pageLoader = new PageLoader(app, {
  indexFiles: ['index'],
  notFoundPage: 'error-404',
  errorPage: 'error-500',
})

// ==================== Add Hono Middleware (Optional) ====================
// Use any Hono middleware from the ecosystem:
// https://hono.dev/middleware/builtin/basic-auth
/*
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'

// Apply middleware globally
app.use('*', logger())
app.use('*', cors())
app.use('*', compress())

// Or per-route
app.use('/api/*', jwt({ secret: env.JWT_SECRET }))
*/

// ==================== Register Conductor Operations (Optional) ====================
// Operations from Conductor plugins are available in beforeRender
// Example: Register plugin operations for use in pages
/*
import { OperationRegistry } from '@ensemble-edge/conductor/runtime'
import { plasmicPlugin } from '@conductor/plasmic'
import { payloadPlugin } from '@conductor/payload'

const registry = OperationRegistry.getInstance()

// Initialize plugins (registers operations globally)
await plasmicPlugin.initialize({
  env,
  operationRegistry: registry,
  logger: console,
  config: {
    projectId: env.PLASMIC_PROJECT_ID,
    projectToken: env.PLASMIC_PROJECT_TOKEN,
  },
})

await payloadPlugin.initialize({
  env,
  operationRegistry: registry,
  logger: console,
  config: {
    apiUrl: env.PAYLOAD_API_URL,
    apiKey: env.PAYLOAD_API_KEY,
  },
})
*/

// ==================== Parse and Register Pages ====================
const pagesMap = new Map(
  discoveredPages.map((page) => {
    const config = parseYAML(page.config) as AgentConfig

    // Attach handler function if it exists
    if (page.handler) {
      ;(config as any).handler = page.handler.handler || page.handler.default
    }

    return [page.name, { config, agent: new PageAgent(config) }]
  })
)

// Discover and register pages with Hono
await pageLoader.discoverPages(pagesMap)

// ==================== Additional Routes ====================

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'conductor',
    timestamp: Date.now(),
  })
})

// Static asset serving from R2
app.get('/assets/*', async (c) => {
  try {
    const key = c.req.path.slice(8) // Remove '/assets/'
    const bucket = c.env.ASSETS

    if (!bucket) {
      return c.text('R2 bucket not configured', 503)
    }

    const object = await bucket.get(key)

    if (!object) {
      return c.text('Asset not found', 404)
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    return new Response(object.body, { headers })
  } catch (error) {
    console.error('Asset serving error:', error)
    return c.text('Internal Server Error', 500)
  }
})

// ==================== Error Handlers ====================

// Get 404 page if it exists
const notFoundPage = pagesMap.get('error-404')?.agent
if (notFoundPage) {
  register404Handler(app, notFoundPage)
}

// Get 500 page if it exists
const errorPage = pagesMap.get('error-500')?.agent
if (errorPage) {
  register500Handler(app, errorPage)
}

// ==================== Export Worker ====================
export default app

// ==================== Export Durable Objects ====================
export { ExecutionState, HITLState }
