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
 * Documentation generation settings
 */
export interface DocsConfig {
  /** Use AI to enhance documentation */
  useAI?: boolean

  /** AI member to use for documentation enhancement */
  aiMember?: string

  /** Output format */
  format?: 'yaml' | 'json'

  /** Include examples in generated documentation */
  includeExamples?: boolean

  /** Include security schemes in documentation */
  includeSecurity?: boolean

  /** Output directory for generated docs */
  outputDir?: string

  /** Cache configuration (uses KV) */
  cache?: {
    enabled?: boolean
    ttl?: number
  }
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
  /** Default timeout for members (ms) */
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
    useAI: false,
    aiMember: 'docs-writer',
    format: 'yaml',
    includeExamples: true,
    includeSecurity: true,
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
