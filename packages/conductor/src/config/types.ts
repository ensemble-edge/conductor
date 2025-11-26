/**
 * Conductor Configuration Types
 *
 * Type-safe configuration for Conductor projects.
 */

/**
 * Main configuration interface
 */
export interface ConductorConfig {
  /** Project name */
  name?: string

  /** Project version */
  version?: string

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

  // === Legacy (deprecated, use 'ai' instead) ===
  /** @deprecated Use ai.enabled instead */
  useAI?: boolean

  /** @deprecated Use ai.model instead */
  aiAgent?: string
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
 */
export interface ObservabilityConfig {
  /** Enable structured logging */
  logging?: boolean

  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'

  /** Enable Analytics Engine metrics */
  metrics?: boolean

  /** OpenTelemetry configuration */
  opentelemetry?: {
    enabled?: boolean
    endpoint?: string
    headers?: Record<string, string>
  }

  /** Track token usage and costs */
  trackTokenUsage?: boolean
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
    logging: true,
    logLevel: 'info',
    metrics: true,
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
}
