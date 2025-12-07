/**
 * Static Assets Module
 *
 * Provides route handlers for static asset serving:
 * - Protected assets (/assets/protected/*) - requires API auth
 * - Convenience routes (/favicon.ico) - redirects to public assets
 *
 * Public assets (/assets/public/*) are served directly by Wrangler's
 * static assets feature and don't need route handlers.
 *
 * @see https://developers.cloudflare.com/workers/static-assets/
 */

export { registerAssetRoutes, type AssetRoutesConfig } from './routes.js'
