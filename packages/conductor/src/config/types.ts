/**
 * Conductor Configuration Types
 *
 * Type-safe configuration for Conductor projects.
 */

import type { DiscoveryConfig } from './discovery.js'

/**
 * Main configuration interface
 */
export interface ConductorConfig {
  /** Project name */
  name?: string

  /** Project version */
  version?: string

  /**
   * Ensemble Cloud configuration
   *
   * Settings for connecting to Ensemble Cloud platform and Pulse analytics.
   * The projectId is auto-generated at `conductor init`.
   */
  cloud?: CloudConfig

  /** Security configuration */
  security?: SecurityConfigOptions

  /** Routing configuration */
  routing?: RoutingConfig

  /** Documentation generation settings */
  docs?: DocsConfig

  /** Testing configuration */
  testing?: TestingConfig

  /** Observability configuration */
  observability?: ObservabilityConfig

  /** Execution configuration */
  execution?: ExecutionConfig

  /** Storage configuration for debugging */
  storage?: StorageConfig

  /** API configuration (Execute API controls) */
  api?: ApiConfig

  /** Discovery configuration for auto-discovery of agents, ensembles, docs, scripts */
  discovery?: DiscoveryConfig

  /**
   * Static assets configuration
   *
   * Settings for public static assets served via Cloudflare Workers Static Assets.
   * Assets in `assets/public/` are served at root URLs (e.g., `/favicon.ico`, `/styles/*`).
   * For protected assets, configure `api.protectedAssets`.
   */
  assets?: PublicAssetsConfig
}

/**
 * API configuration
 */
export interface ApiConfig {
  /** Execute API controls */
  execution?: ApiExecutionConfig

  /**
   * Protected assets settings
   *
   * Settings for auth-protected static assets.
   * Requires api.auth (via routing.auth) to be configured for access.
   */
  protectedAssets?: ProtectedAssetsConfig
}

/**
 * Public assets configuration
 *
 * Settings for public static assets served at root URLs (e.g., /favicon.ico).
 * These assets are served without authentication and edge-cached.
 */
export interface PublicAssetsConfig {
  /**
   * Cache-Control header for public assets
   * @default 'public, max-age=31536000, immutable'
   */
  cacheControl?: string

  /**
   * External URL mapping for public assets
   *
   * Redirect or proxy requests for specific asset paths to external storage.
   * Use this for large files that exceed worker size limits (~25MB).
   *
   * @example 'https://cdn.example.com/public'
   * @example { url: 'https://my-bucket.r2.cloudflarestorage.com/assets', mode: 'redirect' }
   */
  external?:
    | string
    | {
        url: string
        mode?: 'redirect' | 'proxy'
      }

  /**
   * Root file mappings
   *
   * Map root-level paths to other locations for convenience routes.
   * With `directory = "./assets/public"` in wrangler.toml, most root files
   * are served automatically. Use this for custom redirects only.
   *
   * @example { '/old-favicon.ico': '/favicon.ico' }
   */
  rootFiles?: Record<string, string>
}

/**
 * Protected assets configuration
 *
 * Settings for auth-protected static assets.
 * These assets require API authentication (configured via routing.auth).
 */
export interface ProtectedAssetsConfig {
  /**
   * Cache-Control header for protected assets
   * @default 'private, max-age=3600'
   */
  cacheControl?: string

  /**
   * External URL to redirect/proxy protected assets
   *
   * Use this for large files stored in R2, S3, or other external storage.
   * When mode is 'redirect' (default), returns 302 redirect to external URL.
   * When mode is 'proxy', proxies the request (auth still applies).
   *
   * @example 'https://my-bucket.r2.cloudflarestorage.com/protected'
   * @example { url: 'https://cdn.example.com/protected', mode: 'proxy' }
   */
  external?:
    | string
    | {
        url: string
        mode?: 'redirect' | 'proxy'
      }
}

/**
 * Execute API controls
 *
 * Controls whether agents and ensembles can be executed via the Execute API
 * (/api/v1/execute/agent/* and /api/v1/execute/ensemble/*)
 */
export interface ApiExecutionConfig {
  /** Agent execution controls */
  agents?: {
    /**
     * When true, agents need explicit apiExecutable: true to be API executable
     * When false (default), agents are executable unless apiExecutable: false
     * @default false
     */
    requireExplicit?: boolean
  }
  /** Ensemble execution controls */
  ensembles?: {
    /**
     * When true, ensembles need explicit apiExecutable: true to be API executable
     * When false (default), ensembles are executable unless apiExecutable: false
     * @default false
     */
    requireExplicit?: boolean
  }
}

/**
 * Security configuration options
 */
export interface SecurityConfigOptions {
  /**
   * Require authentication on /api/* routes
   * @default true
   */
  requireAuth?: boolean

  /**
   * Allow direct agent execution via API
   * When true, agents can be called via /api/v1/execute/agent/:name
   * @default true
   */
  allowDirectAgentExecution?: boolean

  /**
   * Automatically require resource-specific permissions
   * When true, executing ensemble:foo requires permission "ensemble:foo:execute"
   * @default false
   */
  autoPermissions?: boolean

  /**
   * Environment names that should be treated as production
   * In production environments:
   * - Error messages are sanitized (no internal details leaked)
   * - Error details are only included for client errors (4xx), not server errors (5xx)
   *
   * @default ['production', 'prod']
   * @example ['production', 'prod', 'live', 'main']
   */
  productionEnvironments?: string[]

  // ─────────────────────────────────────────────────────────────────────────────
  // Stealth Mode Settings
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Stealth mode - hide API structure from unauthenticated users
   *
   * When enabled:
   * - Auth failures return generic 404 (not 401/403)
   * - /cloud/health endpoint is hidden (returns 404)
   * - Timing attacks are mitigated with response delays
   *
   * Use this for maximum security when you don't want to reveal
   * which endpoints exist on your API.
   *
   * @default false
   */
  stealthMode?: boolean

  /**
   * Minimum response time (ms) for stealth 404 responses
   * Helps prevent timing attacks that could reveal protected endpoints.
   *
   * Only applies when stealthMode is enabled.
   *
   * Note: Uses scheduler.wait() which requires:
   * - Cloudflare Workers: Paid plan (Workers Unbound or Workers Paid)
   * - On free tiers, delay is gracefully skipped (no error, no timing protection)
   *
   * Set to 0 to disable timing protection entirely.
   *
   * @default 50
   */
  stealthDelayMs?: number

  /**
   * Add X-Powered-By: Ensemble-Edge Conductor header to responses
   * Useful for debugging and identification.
   *
   * @default true
   */
  conductorHeader?: boolean

  /**
   * Include debug headers in responses
   * (X-Conductor-Duration, X-Conductor-Cache, etc.)
   *
   * @default true in development/preview, false in production
   */
  debugHeaders?: boolean
}

/**
 * Routing configuration
 */
export interface RoutingConfig {
  /** Auto-discover pages from directory structure */
  autoDiscover?: boolean

  /** Base path for all routes */
  basePath?: string

  /** Authentication configuration */
  auth?: AuthConfig
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Type-specific defaults */
  defaults?: {
    pages?: AuthRule
    api?: AuthRule
    webhooks?: AuthRule
    forms?: AuthRule
    docs?: AuthRule
  }

  /** Path-based rules (override defaults) */
  rules?: PathAuthRule[]
}

/**
 * Authentication rule
 */
export interface AuthRule {
  /** Authentication requirement level */
  requirement?: 'public' | 'optional' | 'required'

  /** Authentication methods to use */
  methods?: Array<'bearer' | 'apiKey' | 'cookie' | 'custom'>

  /** Custom validator name (for custom auth) */
  customValidator?: string

  /** Required roles */
  roles?: string[]

  /** Required permissions */
  permissions?: string[]

  /** Failure handling */
  onFailure?: {
    action?: 'error' | 'redirect' | 'page'
    redirectTo?: string
    page?: string
    preserveReturn?: boolean
  }

  /** Rate limiting */
  rateLimit?: {
    requests: number
    window: number
    keyBy: 'ip' | 'user' | 'apiKey'
  }
}

/**
 * Path-based authentication rule
 */
export interface PathAuthRule {
  /** Path pattern (supports wildcards) */
  pattern: string

  /** Authentication settings */
  auth?: AuthRule

  /** Priority (higher = evaluated first) */
  priority?: number
}

/**
 * Documentation UI framework
 */
export type DocsUIFramework = 'stoplight' | 'redoc' | 'swagger' | 'scalar' | 'rapidoc'

/**
 * Documentation configuration
 *
 * Unified config for both CLI generation and runtime serving.
 * Can be defined in conductor.config.ts OR as docs.yaml in project root.
 *
 * @example YAML format (docs.yaml):
 * ```yaml
 * title: My API
 * description: My awesome API
 * ui: scalar
 * theme:
 *   primaryColor: '#3B82F6'
 * auth:
 *   requirement: required
 * ai:
 *   enabled: true
 *   model: '@cf/meta/llama-3.1-70b-instruct'
 * ```
 */
export interface DocsConfig {
  // === Branding ===
  /** Documentation title */
  title?: string

  /** Documentation description */
  description?: string

  /** Logo URL */
  logo?: string

  /** Favicon URL */
  favicon?: string

  // === UI Framework ===
  /** UI framework to use for interactive docs */
  ui?: DocsUIFramework

  /** Theme/styling options */
  theme?: {
    /** Primary brand color (hex) */
    primaryColor?: string
    /** Custom CSS to inject */
    customCss?: string
    /** Dark mode preference */
    darkMode?: boolean
  }

  // === Access Control ===
  /** Authentication configuration for docs pages */
  auth?: {
    /** Access requirement: 'public', 'optional', or 'required' */
    requirement?: 'public' | 'optional' | 'required'
    /** Redirect URL when auth required but not provided */
    redirectTo?: string
  }

  // === AI Enhancement ===
  /** AI enhancement settings */
  ai?: {
    /** Enable AI-powered documentation enhancement */
    enabled?: boolean
    /** AI model to use (Workers AI model ID or provider model) */
    model?: string
    /** AI provider: 'cloudflare' (default), 'openai', 'anthropic' */
    provider?: 'cloudflare' | 'openai' | 'anthropic'
    /** Temperature for generation (0-1, lower = more deterministic) */
    temperature?: number
  }

  // === Content Filtering ===
  /** Path patterns to include in docs (glob patterns) */
  include?: string[]

  /** Path patterns to exclude from docs (glob patterns) */
  exclude?: string[]

  /** Include usage examples in generated docs */
  includeExamples?: boolean

  /** Include security schemes in OpenAPI spec */
  includeSecurity?: boolean

  // === Caching ===
  /** Cache configuration */
  cache?: {
    /** Enable caching of generated docs */
    enabled?: boolean
    /** Cache TTL in seconds */
    ttl?: number
  }

  // === Output (CLI only) ===
  /** Output directory for CLI-generated docs */
  outputDir?: string

  /** Output format for CLI */
  format?: 'yaml' | 'json'

  // === Server URLs ===
  /** Server URLs to include in OpenAPI spec */
  servers?: Array<{
    url: string
    description?: string
  }>
}

/**
 * Testing configuration
 */
export interface TestingConfig {
  /** Coverage thresholds */
  coverage?: {
    lines?: number
    functions?: number
    branches?: number
    statements?: number
  }

  /** Test timeout in milliseconds */
  timeout?: number

  /** Test environment */
  environment?: 'node' | 'jsdom' | 'edge-runtime'

  /** Setup files */
  setupFiles?: string[]

  /** Global test settings */
  globals?: boolean
}

/**
 * Observability configuration
 *
 * Cloudflare-first observability with support for external providers.
 * All features work out of the box with sensible defaults.
 *
 * @example
 * ```typescript
 * observability: {
 *   logging: {
 *     level: 'info',
 *     redact: ['password', 'apiKey'],
 *   },
 *   metrics: {
 *     enabled: true,
 *     binding: 'ANALYTICS',
 *   },
 * }
 * ```
 */
export interface ObservabilityConfig {
  /**
   * Logging configuration
   * Set to `false` to disable all logging, `true` for defaults
   */
  logging?: boolean | LoggingConfig

  /**
   * Metrics configuration (Cloudflare Analytics Engine)
   * Set to `false` to disable metrics, `true` for defaults
   */
  metrics?: boolean | MetricsConfig

  /**
   * OpenTelemetry export configuration
   * For external observability platforms (Datadog, Honeycomb, etc.)
   */
  opentelemetry?: OpenTelemetryConfig

  /**
   * Track AI token usage and costs
   * @default true
   */
  trackTokenUsage?: boolean
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /**
   * Enable logging
   * @default true
   */
  enabled?: boolean

  /**
   * Minimum log level
   * @default 'info' in production, 'debug' in development
   */
  level?: 'debug' | 'info' | 'warn' | 'error'

  /**
   * Output format
   * @default 'json' (for Cloudflare Workers Logs indexing)
   */
  format?: 'json' | 'pretty'

  /**
   * Context fields to include in all logs
   * @default ['requestId', 'executionId', 'ensembleName', 'agentName']
   */
  context?: string[]

  /**
   * Sensitive fields to redact (replaced with [REDACTED])
   * Supports dot notation for nested fields (e.g., 'input.password')
   * @default ['password', 'apiKey', 'token', 'authorization', 'secret']
   */
  redact?: string[]

  /**
   * Events to log automatically
   * @default ['request', 'response', 'agent:start', 'agent:complete', 'agent:error']
   */
  events?: LogEventType[]
}

/**
 * Log event types for automatic logging
 */
export type LogEventType =
  | 'request' // Log incoming HTTP requests
  | 'response' // Log outgoing HTTP responses
  | 'agent:start' // Log agent execution start
  | 'agent:complete' // Log agent completion with duration
  | 'agent:error' // Log agent errors
  | 'ensemble:start' // Log ensemble execution start
  | 'ensemble:complete' // Log ensemble completion
  | 'ensemble:error' // Log ensemble errors
  | 'cache:hit' // Log cache hits
  | 'cache:miss' // Log cache misses

/**
 * Metrics configuration (Cloudflare Analytics Engine)
 */
export interface MetricsConfig {
  /**
   * Enable metrics collection
   * @default true
   */
  enabled?: boolean

  /**
   * Analytics Engine binding name in wrangler.toml
   * @default 'ANALYTICS'
   */
  binding?: string

  /**
   * Metrics to track automatically
   * @default ['ensemble:execution', 'agent:execution', 'http:request', 'error']
   */
  track?: MetricType[]

  /**
   * Custom dimensions to include in all metrics
   * Values are resolved from environment (e.g., 'ENVIRONMENT' → env.ENVIRONMENT)
   */
  dimensions?: string[]
}

/**
 * Metric types for automatic tracking
 */
export type MetricType =
  | 'ensemble:execution' // Track ensemble execution duration and success/failure
  | 'agent:execution' // Track agent execution per step
  | 'http:request' // Track HTTP request counts and duration
  | 'cache:performance' // Track cache hit/miss rates
  | 'error' // Track error counts by type

/**
 * OpenTelemetry configuration for external providers
 */
export interface OpenTelemetryConfig {
  /**
   * Enable OpenTelemetry export
   * @default false
   */
  enabled?: boolean

  /**
   * OTLP endpoint URL
   * @example 'https://api.honeycomb.io'
   */
  endpoint?: string

  /**
   * Headers for authentication
   * @example { 'x-honeycomb-team': '${HONEYCOMB_API_KEY}' }
   */
  headers?: Record<string, string>

  /**
   * Sampling rate (0.0 to 1.0)
   * @default 1.0 (100%)
   */
  samplingRate?: number
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  /** Default timeout for agents (ms) */
  defaultTimeout?: number

  /** Enable execution history tracking */
  trackHistory?: boolean

  /** Maximum execution history entries to keep */
  maxHistoryEntries?: number

  /** Store state snapshots during execution */
  storeStateSnapshots?: boolean
}

/**
 * Storage configuration for debugging
 */
export interface StorageConfig {
  /** Storage type */
  type?: 'filesystem' | 'd1' | 'kv'

  /** Storage path (for filesystem) */
  path?: string

  /** D1 database binding name */
  d1Binding?: string

  /** KV namespace binding name */
  kvBinding?: string
}

/**
 * Ensemble Cloud configuration
 *
 * Settings for connecting this Conductor project to Ensemble Cloud
 * and for anonymous usage metrics (Pulse).
 *
 * @example
 * ```typescript
 * cloud: {
 *   // Auto-generated at `conductor init` - don't change unless you want
 *   // to appear as a new project in analytics
 *   projectId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 *
 *   // Your deployed Worker URL (for Cloud integration)
 *   workerUrl: 'https://my-project.workers.dev',
 *
 *   // Anonymous usage metrics - helps improve Conductor
 *   // Disable with: pulse: false, or env DO_NOT_TRACK=1
 *   pulse: true,
 * }
 * ```
 */
export interface CloudConfig {
  /**
   * Project ID (UUID)
   *
   * Auto-generated at `conductor init`. Used for anonymous Pulse metrics
   * and Cloud platform identification.
   *
   * Changing this makes your project appear as a new project in analytics.
   * If deleted, it will be regenerated on next `conductor init`.
   */
  projectId?: string

  /**
   * Deployed Worker URL
   *
   * The production URL where this Conductor project is deployed.
   * Used by Ensemble Cloud to communicate with your Worker.
   *
   * @example 'https://my-project.workers.dev'
   * @example 'https://api.mycompany.com'
   */
  workerUrl?: string

  /**
   * Pulse - Anonymous usage metrics
   *
   * When enabled, sends anonymous usage data to help improve Conductor:
   * - Project ID (random UUID, not identifiable)
   * - Event type (e.g., server.start)
   * - Conductor version
   * - Agent/ensemble/component counts
   * - Country code (from Cloudflare, not your IP)
   *
   * NO personal data, project names, code, or API keys are ever collected.
   *
   * Disable by setting to false, or via environment:
   * - DO_NOT_TRACK=1 (industry standard)
   * - CONDUCTOR_PULSE=false
   *
   * @default true
   * @see https://docs.ensemble.ai/pulse
   */
  pulse?: boolean
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ConductorConfig = {
  docs: {
    title: 'API Documentation',
    ui: 'stoplight',
    auth: {
      requirement: 'public',
    },
    ai: {
      enabled: false,
      model: '@cf/meta/llama-3.1-8b-instruct',
      provider: 'cloudflare',
      temperature: 0.3,
    },
    includeExamples: true,
    includeSecurity: true,
    cache: {
      enabled: true,
      ttl: 300,
    },
    format: 'yaml',
    outputDir: './docs',
  },
  testing: {
    coverage: {
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70,
    },
    timeout: 30000,
    environment: 'node',
    globals: true,
  },
  observability: {
    logging: {
      enabled: true,
      level: 'info',
      format: 'json',
      context: ['requestId', 'executionId', 'ensembleName', 'agentName'],
      redact: ['password', 'apiKey', 'token', 'authorization', 'secret', 'creditCard'],
      events: ['request', 'response', 'agent:start', 'agent:complete', 'agent:error'],
    },
    metrics: {
      enabled: true,
      binding: 'ANALYTICS',
      track: ['ensemble:execution', 'agent:execution', 'http:request', 'error'],
    },
    trackTokenUsage: true,
  },
  execution: {
    defaultTimeout: 30000,
    trackHistory: true,
    maxHistoryEntries: 1000,
    storeStateSnapshots: true,
  },
  storage: {
    type: 'filesystem',
    path: './.conductor',
  },
  api: {
    execution: {
      agents: {
        requireExplicit: false,
      },
      ensembles: {
        requireExplicit: false,
      },
    },
  },
}
