/**
 * Page Agent Types
 *
 * JSX/Compiled page components with server-side rendering,
 * props passing, data binding, and client-side hydration
 */

import type { AgentConfig } from '../../../runtime/parser.js'
import type { RouteAuthConfig, CORSConfig } from '../../../routing/config.js'
import type { BaseCacheConfig } from '../../../types/cache.js'

/**
 * Page rendering mode
 */
export type PageRenderMode = 'ssr' | 'static' | 'hybrid'

/**
 * Hydration strategy
 */
export type HydrationStrategy = 'none' | 'htmx' | 'progressive' | 'islands'

/**
 * Page component type
 */
export type PageComponentType = 'jsx' | 'tsx' | 'function' | 'class'

/**
 * Page layout configuration
 */
export interface PageLayout {
  /** Layout template name */
  name: string
  /** Layout props */
  props?: Record<string, unknown>
  /** Layout slots */
  slots?: Record<string, string>
}

/**
 * Page head configuration
 */
export interface PageHead {
  /** Page title */
  title?: string
  /** Meta tags */
  meta?: MetaTag[]
  /** Link tags (CSS, fonts, etc.) */
  links?: LinkTag[]
  /** Inline scripts */
  scripts?: ScriptTag[]
  /** Open Graph tags */
  og?: OpenGraphTags
  /** Twitter Card tags */
  twitter?: TwitterCardTags
}

/**
 * Meta tag
 */
export interface MetaTag {
  name?: string
  property?: string
  content: string
  charset?: string
  httpEquiv?: string
}

/**
 * Link tag
 */
export interface LinkTag {
  rel: string
  href: string
  type?: string
  media?: string
  crossorigin?: string
  integrity?: string
}

/**
 * Script tag
 */
export interface ScriptTag {
  src?: string
  inline?: string
  async?: boolean
  defer?: boolean
  type?: string
  crossorigin?: string
  integrity?: string
}

/**
 * Open Graph tags
 */
export interface OpenGraphTags {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  locale?: string
}

/**
 * Twitter Card tags
 */
export interface TwitterCardTags {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player'
  site?: string
  creator?: string
  title?: string
  description?: string
  image?: string
}

/**
 * htmx configuration
 */
export interface HtmxConfig {
  /** Enable htmx */
  enabled: boolean
  /** htmx version */
  version?: string
  /** htmx extensions to load */
  extensions?: string[]
  /** htmx global config */
  config?: Record<string, unknown>
  /** Custom htmx attributes */
  customAttributes?: Record<string, string>
}

/**
 * Client-side hydration configuration
 */
export interface HydrationConfig {
  /** Hydration strategy */
  strategy: HydrationStrategy
  /** htmx configuration */
  htmx?: HtmxConfig
  /** Component islands (for islands hydration) */
  islands?: ComponentIsland[]
  /** Progressive enhancement config */
  progressive?: ProgressiveConfig
}

/**
 * Component island for islands architecture
 */
export interface ComponentIsland {
  /** Island ID */
  id: string
  /** Component name */
  component: string
  /** Props for the island */
  props?: Record<string, unknown>
  /** Hydration priority */
  priority?: 'high' | 'medium' | 'low'
  /** Load condition (e.g., 'visible', 'idle', 'interaction') */
  loadOn?: 'immediate' | 'visible' | 'idle' | 'interaction'
}

/**
 * Progressive enhancement configuration
 */
export interface ProgressiveConfig {
  /** Enhance forms with htmx */
  enhanceForms?: boolean
  /** Enhance links with htmx */
  enhanceLinks?: boolean
  /** Custom enhancements */
  customEnhancements?: CustomEnhancement[]
}

/**
 * Custom enhancement rule
 */
export interface CustomEnhancement {
  /** CSS selector */
  selector: string
  /** htmx attributes to add */
  attributes: Record<string, string>
}

/**
 * SEO configuration
 */
export interface SEOConfig {
  /** Canonical URL */
  canonical?: string
  /** Robots meta */
  robots?: string
  /** Alternative languages */
  alternates?: AlternateLink[]
  /** JSON-LD structured data */
  jsonLd?: Record<string, unknown>[]
}

/**
 * Alternate language link
 */
export interface AlternateLink {
  /** Language code */
  hreflang: string
  /** URL for this language */
  href: string
}

/**
 * Page caching configuration
 * Extends base cache config with page-specific options
 */
export interface PageCacheConfig extends BaseCacheConfig {
  // All fields inherited from BaseCacheConfig
  // Page-specific cache fields can be added here in the future
}

/**
 * Page route configuration
 */
export interface PageRouteConfig {
  /** Route path (e.g., "/dashboard", "/blog/:slug") */
  path?: string
  /** HTTP methods this page responds to */
  methods?: string[]
  /** Route aliases */
  aliases?: string[]
  /** Authentication configuration (uses UnifiedRouter) */
  auth?: Partial<RouteAuthConfig>
  /** Priority (defaults to 80 for pages) */
  priority?: number
  /** Before render hook (function to call before rendering) */
  beforeRender?: string
  /** Response headers to add/override */
  headers?: Record<string, string>
  /** CORS configuration */
  cors?: CORSConfig
}

/**
 * Handler function context
 * Provides access to request data, route params, query params, headers, and env
 */
export interface HandlerContext {
  /** Request object */
  request: Request
  /** Cloudflare Workers environment bindings */
  env: any
  /** Execution context */
  ctx: ExecutionContext
  /** Route parameters (e.g., { slug: "hello-world" } from /blog/:slug) */
  params: Record<string, string>
  /** Query parameters (e.g., { page: "2" } from ?page=2) */
  query: Record<string, string>
  /** Request headers (as Record for easy access) */
  headers: Record<string, string>
}

/**
 * Handler function result
 * Data returned by handler will be merged into template context
 */
export type HandlerResult = Record<string, any> | Promise<Record<string, any>>

/**
 * Handler function signature
 * Receives context and returns data for the template
 */
export type HandlerFunction = (context: HandlerContext) => HandlerResult

/**
 * Page agent configuration
 */
export interface PageAgentConfig extends AgentConfig {
  /** Page component (JSX/TSX function or class) */
  component?: string
  /** Component file path (for loading from filesystem) */
  componentPath?: string
  /** Component type */
  componentType?: PageComponentType
  /** Render mode */
  renderMode?: PageRenderMode
  /** Layout configuration */
  layout?: PageLayout
  /** Page head configuration */
  head?: PageHead
  /** Hydration configuration */
  hydration?: HydrationConfig
  /** SEO configuration */
  seo?: SEOConfig
  /** Cache configuration */
  cache?: PageCacheConfig
  /** Route configuration (optional - defaults to convention-based) */
  route?: PageRouteConfig
  /** Enable streaming SSR */
  streaming?: boolean
  /** Custom error page component */
  errorComponent?: string
  /** Enable development mode (hot reload, etc.) */
  dev?: boolean
  /** Default input props for the page component */
  input?: Record<string, unknown>
  /** Template engine to use for rendering (default: 'liquid', Workers-compatible) */
  templateEngine?: 'simple' | 'liquid'
  /** Handler function for fetching data based on route params */
  handler?: HandlerFunction
}

/**
 * Page agent input
 */
export interface PageMemberInput {
  /** Props to pass to the page component */
  props?: Record<string, unknown>
  /** Request context */
  request?: PageRequestContext
  /** Override head config */
  head?: Partial<PageHead>
  /** Override hydration config */
  hydration?: Partial<HydrationConfig>
  /** Custom data for the page */
  data?: Record<string, unknown>
}

/**
 * Page request context
 */
export interface PageRequestContext {
  /** Request URL */
  url: string
  /** Request method */
  method: string
  /** Request headers */
  headers: Record<string, string>
  /** Query parameters */
  query: Record<string, string>
  /** Path parameters */
  params: Record<string, string>
  /** Cookies */
  cookies: Record<string, string>
  /** User agent */
  userAgent?: string
  /** IP address */
  ip?: string
}

/**
 * Page agent output
 */
export interface PageMemberOutput {
  /** Rendered HTML */
  html: string
  /** HTTP status code */
  status?: number
  /** Response headers */
  headers?: Record<string, string>
  /** Hydration data (serialized for client) */
  hydrationData?: string
  /** Component props (for debugging) */
  props?: Record<string, unknown>
  /** Render time (ms) */
  renderTime?: number
  /** Cache status */
  cacheStatus?: 'hit' | 'miss' | 'bypass'
  /** SEO data */
  seo?: SEOData
}

/**
 * SEO data for rendered page
 */
export interface SEOData {
  /** Page title */
  title: string
  /** Meta description */
  description?: string
  /** Canonical URL */
  canonical?: string
  /** Open Graph tags */
  og?: OpenGraphTags
  /** Twitter Card tags */
  twitter?: TwitterCardTags
  /** JSON-LD structured data */
  jsonLd?: Record<string, unknown>[]
}

/**
 * Component props type
 */
export type ComponentProps = Record<string, unknown>

/**
 * Page component function signature
 */
export type PageComponent = (props: ComponentProps) => string | Promise<string>

/**
 * Layout component function signature
 */
export type LayoutComponent = (
  props: { children: string } & ComponentProps
) => string | Promise<string>
