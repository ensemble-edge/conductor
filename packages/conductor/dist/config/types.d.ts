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
    name?: string;
    /** Project version */
    version?: string;
    /** Security configuration */
    security?: SecurityConfigOptions;
    /** Routing configuration */
    routing?: RoutingConfig;
    /** Documentation generation settings */
    docs?: DocsConfig;
    /** Testing configuration */
    testing?: TestingConfig;
    /** Observability configuration */
    observability?: ObservabilityConfig;
    /** Execution configuration */
    execution?: ExecutionConfig;
    /** Storage configuration for debugging */
    storage?: StorageConfig;
}
/**
 * Security configuration options
 */
export interface SecurityConfigOptions {
    /**
     * Require authentication on /api/* routes
     * @default true
     */
    requireAuth?: boolean;
    /**
     * Allow direct agent execution via API
     * When true, agents can be called via /api/v1/execute/agent/:name
     * @default true
     */
    allowDirectAgentExecution?: boolean;
    /**
     * Automatically require resource-specific permissions
     * When true, executing ensemble:foo requires permission "ensemble:foo:execute"
     * @default false
     */
    autoPermissions?: boolean;
}
/**
 * Routing configuration
 */
export interface RoutingConfig {
    /** Auto-discover pages from directory structure */
    autoDiscover?: boolean;
    /** Base path for all routes */
    basePath?: string;
    /** Authentication configuration */
    auth?: AuthConfig;
}
/**
 * Authentication configuration
 */
export interface AuthConfig {
    /** Type-specific defaults */
    defaults?: {
        pages?: AuthRule;
        api?: AuthRule;
        webhooks?: AuthRule;
        forms?: AuthRule;
        docs?: AuthRule;
    };
    /** Path-based rules (override defaults) */
    rules?: PathAuthRule[];
}
/**
 * Authentication rule
 */
export interface AuthRule {
    /** Authentication requirement level */
    requirement?: 'public' | 'optional' | 'required';
    /** Authentication methods to use */
    methods?: Array<'bearer' | 'apiKey' | 'cookie' | 'custom'>;
    /** Custom validator name (for custom auth) */
    customValidator?: string;
    /** Required roles */
    roles?: string[];
    /** Required permissions */
    permissions?: string[];
    /** Failure handling */
    onFailure?: {
        action?: 'error' | 'redirect' | 'page';
        redirectTo?: string;
        page?: string;
        preserveReturn?: boolean;
    };
    /** Rate limiting */
    rateLimit?: {
        requests: number;
        window: number;
        keyBy: 'ip' | 'user' | 'apiKey';
    };
}
/**
 * Path-based authentication rule
 */
export interface PathAuthRule {
    /** Path pattern (supports wildcards) */
    pattern: string;
    /** Authentication settings */
    auth?: AuthRule;
    /** Priority (higher = evaluated first) */
    priority?: number;
}
/**
 * Documentation UI framework
 */
export type DocsUIFramework = 'stoplight' | 'redoc' | 'swagger' | 'scalar' | 'rapidoc';
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
    /** Documentation title */
    title?: string;
    /** Documentation description */
    description?: string;
    /** Logo URL */
    logo?: string;
    /** Favicon URL */
    favicon?: string;
    /** UI framework to use for interactive docs */
    ui?: DocsUIFramework;
    /** Theme/styling options */
    theme?: {
        /** Primary brand color (hex) */
        primaryColor?: string;
        /** Custom CSS to inject */
        customCss?: string;
        /** Dark mode preference */
        darkMode?: boolean;
    };
    /** Authentication configuration for docs pages */
    auth?: {
        /** Access requirement: 'public', 'optional', or 'required' */
        requirement?: 'public' | 'optional' | 'required';
        /** Redirect URL when auth required but not provided */
        redirectTo?: string;
    };
    /** AI enhancement settings */
    ai?: {
        /** Enable AI-powered documentation enhancement */
        enabled?: boolean;
        /** AI model to use (Workers AI model ID or provider model) */
        model?: string;
        /** AI provider: 'cloudflare' (default), 'openai', 'anthropic' */
        provider?: 'cloudflare' | 'openai' | 'anthropic';
        /** Temperature for generation (0-1, lower = more deterministic) */
        temperature?: number;
    };
    /** Path patterns to include in docs (glob patterns) */
    include?: string[];
    /** Path patterns to exclude from docs (glob patterns) */
    exclude?: string[];
    /** Include usage examples in generated docs */
    includeExamples?: boolean;
    /** Include security schemes in OpenAPI spec */
    includeSecurity?: boolean;
    /** Cache configuration */
    cache?: {
        /** Enable caching of generated docs */
        enabled?: boolean;
        /** Cache TTL in seconds */
        ttl?: number;
    };
    /** Output directory for CLI-generated docs */
    outputDir?: string;
    /** Output format for CLI */
    format?: 'yaml' | 'json';
    /** Server URLs to include in OpenAPI spec */
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    /** @deprecated Use ai.enabled instead */
    useAI?: boolean;
    /** @deprecated Use ai.model instead */
    aiAgent?: string;
}
/**
 * Testing configuration
 */
export interface TestingConfig {
    /** Coverage thresholds */
    coverage?: {
        lines?: number;
        functions?: number;
        branches?: number;
        statements?: number;
    };
    /** Test timeout in milliseconds */
    timeout?: number;
    /** Test environment */
    environment?: 'node' | 'jsdom' | 'edge-runtime';
    /** Setup files */
    setupFiles?: string[];
    /** Global test settings */
    globals?: boolean;
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
    logging?: boolean | LoggingConfig;
    /**
     * Metrics configuration (Cloudflare Analytics Engine)
     * Set to `false` to disable metrics, `true` for defaults
     */
    metrics?: boolean | MetricsConfig;
    /**
     * OpenTelemetry export configuration
     * For external observability platforms (Datadog, Honeycomb, etc.)
     */
    opentelemetry?: OpenTelemetryConfig;
    /**
     * Track AI token usage and costs
     * @default true
     */
    trackTokenUsage?: boolean;
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
    /**
     * Enable logging
     * @default true
     */
    enabled?: boolean;
    /**
     * Minimum log level
     * @default 'info' in production, 'debug' in development
     */
    level?: 'debug' | 'info' | 'warn' | 'error';
    /**
     * Output format
     * @default 'json' (for Cloudflare Workers Logs indexing)
     */
    format?: 'json' | 'pretty';
    /**
     * Context fields to include in all logs
     * @default ['requestId', 'executionId', 'ensembleName', 'agentName']
     */
    context?: string[];
    /**
     * Sensitive fields to redact (replaced with [REDACTED])
     * Supports dot notation for nested fields (e.g., 'input.password')
     * @default ['password', 'apiKey', 'token', 'authorization', 'secret']
     */
    redact?: string[];
    /**
     * Events to log automatically
     * @default ['request', 'response', 'agent:start', 'agent:complete', 'agent:error']
     */
    events?: LogEventType[];
}
/**
 * Log event types for automatic logging
 */
export type LogEventType = 'request' | 'response' | 'agent:start' | 'agent:complete' | 'agent:error' | 'ensemble:start' | 'ensemble:complete' | 'ensemble:error' | 'cache:hit' | 'cache:miss';
/**
 * Metrics configuration (Cloudflare Analytics Engine)
 */
export interface MetricsConfig {
    /**
     * Enable metrics collection
     * @default true
     */
    enabled?: boolean;
    /**
     * Analytics Engine binding name in wrangler.toml
     * @default 'ANALYTICS'
     */
    binding?: string;
    /**
     * Metrics to track automatically
     * @default ['ensemble:execution', 'agent:execution', 'http:request', 'error']
     */
    track?: MetricType[];
    /**
     * Custom dimensions to include in all metrics
     * Values are resolved from environment (e.g., 'ENVIRONMENT' → env.ENVIRONMENT)
     */
    dimensions?: string[];
}
/**
 * Metric types for automatic tracking
 */
export type MetricType = 'ensemble:execution' | 'agent:execution' | 'http:request' | 'cache:performance' | 'error';
/**
 * OpenTelemetry configuration for external providers
 */
export interface OpenTelemetryConfig {
    /**
     * Enable OpenTelemetry export
     * @default false
     */
    enabled?: boolean;
    /**
     * OTLP endpoint URL
     * @example 'https://api.honeycomb.io'
     */
    endpoint?: string;
    /**
     * Headers for authentication
     * @example { 'x-honeycomb-team': '${HONEYCOMB_API_KEY}' }
     */
    headers?: Record<string, string>;
    /**
     * Sampling rate (0.0 to 1.0)
     * @default 1.0 (100%)
     */
    samplingRate?: number;
}
/**
 * Execution configuration
 */
export interface ExecutionConfig {
    /** Default timeout for agents (ms) */
    defaultTimeout?: number;
    /** Enable execution history tracking */
    trackHistory?: boolean;
    /** Maximum execution history entries to keep */
    maxHistoryEntries?: number;
    /** Store state snapshots during execution */
    storeStateSnapshots?: boolean;
}
/**
 * Storage configuration for debugging
 */
export interface StorageConfig {
    /** Storage type */
    type?: 'filesystem' | 'd1' | 'kv';
    /** Storage path (for filesystem) */
    path?: string;
    /** D1 database binding name */
    d1Binding?: string;
    /** KV namespace binding name */
    kvBinding?: string;
}
/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: ConductorConfig;
//# sourceMappingURL=types.d.ts.map