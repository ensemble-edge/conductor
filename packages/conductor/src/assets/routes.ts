/**
 * Asset Route Handlers
 *
 * Registers routes for:
 * - Protected assets - applies API auth, then serves via ASSETS binding
 * - Custom redirects - optional convenience routes for special cases
 *
 * Public assets in `assets/public/` are served by Wrangler at root URLs
 * (e.g., /favicon.ico, /styles/*) without needing these handlers.
 */

import type { Hono, MiddlewareHandler, Context, Next } from 'hono'
import { createAuthMiddleware } from '../api/middleware/index.js'
import { createLogger } from '../observability/index.js'
import type { ConductorEnv } from '../types/env.js'
import type { ConductorContext } from '../api/types.js'
import type { PublicAssetsConfig, ProtectedAssetsConfig } from '../config/types.js'

const logger = createLogger({ serviceName: 'assets' })

/**
 * Default cache control headers
 */
const DEFAULT_PUBLIC_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const DEFAULT_PROTECTED_CACHE_CONTROL = 'private, max-age=3600'

/**
 * Default root file mappings
 *
 * Note: With directory = "./assets/public" in wrangler.toml, files like
 * favicon.ico are served directly at /favicon.ico by Wrangler.
 * No redirects needed for public assets.
 */
const DEFAULT_ROOT_FILES: Record<string, string> = {
  // Empty by default - Wrangler serves public assets directly
  // Add custom mappings here if needed (e.g., '/robots.txt': '/custom/robots.txt')
}

/**
 * Configuration for asset routes
 */
export interface AssetRoutesConfig {
  /**
   * Public assets configuration
   */
  assets?: PublicAssetsConfig

  /**
   * Protected assets configuration (nested under api for coupling with auth)
   */
  protectedAssets?: ProtectedAssetsConfig

  /**
   * Authentication configuration for protected assets
   * Uses the same auth middleware as API routes
   */
  auth?: {
    apiKeys?: string[]
    allowAnonymous?: boolean
  }

  /**
   * Enable stealth mode for 401/403 responses
   */
  stealthMode?: boolean
}

/**
 * Register asset routes on the Hono app
 *
 * This should be called during app initialization to set up:
 * 1. Protected asset routes with auth middleware
 * 2. Convenience redirect routes for root files
 *
 * @param app - Hono app instance
 * @param config - Asset configuration
 */
export function registerAssetRoutes(
  app: Hono<{ Bindings: ConductorEnv; Variables: ConductorContext['var'] }>,
  config: AssetRoutesConfig = {}
): void {
  const rootFiles = config.assets?.rootFiles ?? DEFAULT_ROOT_FILES

  // Register custom redirect routes (e.g., /old-path -> /new-path)
  for (const [sourcePath, targetPath] of Object.entries(rootFiles)) {
    logger.debug(`[Assets] Registering redirect: ${sourcePath} -> ${targetPath}`)

    app.get(sourcePath, (c) => {
      // 301 permanent redirect for cacheable root files
      return c.redirect(targetPath, 301)
    })
  }

  logger.info(
    `[Assets] Registered ${Object.keys(rootFiles).length} convenience route(s): ${Object.keys(rootFiles).join(', ')}`
  )

  // Register protected assets route with auth middleware
  // This intercepts protected asset requests, checks auth, then serves via ASSETS binding
  if (config.auth?.apiKeys?.length || !config.auth?.allowAnonymous) {
    const authMiddleware = createAuthMiddleware({
      apiKeys: config.auth?.apiKeys || [],
      allowAnonymous: config.auth?.allowAnonymous ?? false,
      stealthMode: config.stealthMode,
    })

    // Protected assets handler - after auth passes, set headers and fall through
    const protectedAssetsHandler: MiddlewareHandler = async (
      c: Context<{ Bindings: ConductorEnv; Variables: ConductorContext['var'] }>,
      next: Next
    ) => {
      // Auth has already passed (middleware chain)
      // Set cache control header for protected assets
      const cacheControl = config.protectedAssets?.cacheControl ?? DEFAULT_PROTECTED_CACHE_CONTROL
      c.header('Cache-Control', cacheControl)

      logger.debug(`[Assets] Protected asset authorized: ${c.req.path}`)

      // Fall through to Wrangler static assets
      // With run_worker_first = true, returning without a response lets Wrangler serve the file
      await next()
    }

    // Register the route with auth middleware
    app.get('/assets/protected/*', authMiddleware, protectedAssetsHandler)

    logger.info('[Assets] Registered protected assets route with auth middleware')
  } else {
    logger.debug('[Assets] Protected assets auth not configured, skipping route registration')
  }
}
