/**
 * Docs Agent Types
 *
 * Auto-generate and serve API documentation
 */

import type { AgentConfig } from '../../../runtime/parser.js'
import type { RouteAuthConfig } from '../../../routing/config.js'

/**
 * Documentation UI framework
 */
export type DocsUIFramework = 'stoplight' | 'redoc' | 'swagger' | 'scalar' | 'rapidoc'

/**
 * OpenAPI specification version
 */
export type OpenAPIVersion = '3.0' | '3.1'

/**
 * Docs paths configuration
 */
export interface DocsPathsConfig {
  /** Path to serve interactive docs */
  docs: string
  /** Path to serve OpenAPI YAML spec */
  yaml: string
  /** Path to serve OpenAPI JSON spec */
  json: string
}

/**
 * Auto-generation configuration
 */
export interface DocsAutoGenerateConfig {
  /** Enable auto-generation */
  enabled: boolean
  /** Use AI to enhance descriptions */
  useAI?: boolean
  /** AI agent name to use for enhancement */
  aiAgent?: string
  /** Paths to exclude from docs */
  exclude?: string[]
  /** Only include specific paths */
  include?: string[]
}

/**
 * Branding configuration
 */
export interface DocsBrandingConfig {
  /** Site title */
  title: string
  /** Site description */
  description?: string
  /** Logo URL */
  logo?: string
  /** Favicon URL */
  favicon?: string
  /** Primary color */
  primaryColor?: string
  /** Custom CSS */
  customCss?: string
}

/**
 * Authentication configuration for docs
 */
export interface DocsAuthConfig {
  /** Auth requirement */
  required: 'none' | 'optional' | 'required'
  /** API key locations to document */
  apiKeyLocations?: ('header' | 'query' | 'cookie')[]
  /** OAuth flows to document */
  oauthFlows?: string[]
}

/**
 * Docs agent configuration
 */
export interface DocsAgentConfig extends AgentConfig {
  /** Route configuration for UnifiedRouter integration */
  route?: {
    /** Route path (defaults to /docs) */
    path?: string
    /** HTTP methods (defaults to ['GET']) */
    methods?: string[]
    /** Auth configuration */
    auth?: Partial<RouteAuthConfig>
    /** Priority (defaults to 70 for docs) */
    priority?: number
  }
  /** UI framework to use */
  ui?: DocsUIFramework
  /** OpenAPI version */
  openApiVersion?: OpenAPIVersion
  /** Paths configuration */
  paths?: DocsPathsConfig
  /** Auto-generation config */
  autoGenerate?: DocsAutoGenerateConfig
  /** Branding configuration */
  branding?: DocsBrandingConfig
  /** Authentication config (DEPRECATED: use route.auth instead) */
  auth?: DocsAuthConfig
  /** Cache configuration */
  cache?: {
    enabled: boolean
    ttl: number
  }
  /** Custom OpenAPI spec (if not auto-generating) */
  customSpec?: string
  /** Base path for API */
  basePath?: string
  /** Server URLs */
  servers?: Array<{
    url: string
    description?: string
  }>
}

/**
 * Docs agent input
 */
export interface DocsMemberInput {
  /** Request context */
  request?: {
    url: string
    method: string
    headers: Record<string, string>
  }
  /** Override spec generation */
  customSpec?: any
}

/**
 * Docs agent output
 */
export interface DocsMemberOutput {
  /** Response HTML or JSON */
  content: string
  /** Content type */
  contentType: string
  /** HTTP status */
  status: number
  /** Response headers */
  headers: Record<string, string>
  /** Cache status */
  cacheStatus?: 'hit' | 'miss' | 'bypass'
}
