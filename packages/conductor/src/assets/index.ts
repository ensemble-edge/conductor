/**
 * Static Assets Module
 *
 * Provides route handlers for static asset serving:
 * - Protected assets - requires API auth (when run_worker_first = true)
 * - Custom redirects - for special routing needs
 *
 * Public assets in `assets/public/` are served directly by Wrangler at
 * root URLs (e.g., /favicon.ico, /styles/*) without Worker involvement.
 *
 * @see https://developers.cloudflare.com/workers/static-assets/
 */

export { registerAssetRoutes, type AssetRoutesConfig } from './routes.js'
