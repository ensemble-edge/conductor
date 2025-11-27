/**
 * Ensemble Primitive
 *
 * The core primitive for creating ensembles programmatically.
 * Produces the same structure as YAML parsing.
 */
import type { FlowStepType, StateConfig, EnsembleHooks, Context, AgentSchemaConfig } from './types.js';
/**
 * Trigger configuration types
 */
export interface WebhookTrigger {
    type: 'webhook';
    path?: string;
    methods?: ('POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE')[];
    auth?: {
        type: 'bearer' | 'signature' | 'basic';
        secret: string;
    };
    public?: boolean;
    mode?: 'trigger' | 'resume';
    async?: boolean;
    timeout?: number;
}
export interface HttpTrigger {
    type: 'http';
    path?: string;
    methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS')[];
    auth?: {
        type: 'bearer' | 'signature' | 'basic';
        secret: string;
    };
    public?: boolean;
    mode?: 'trigger' | 'resume';
    async?: boolean;
    timeout?: number;
    rateLimit?: {
        requests: number;
        window: number;
        key?: 'ip' | 'user';
    };
    cors?: {
        origin?: string | string[];
        methods?: string[];
        allowHeaders?: string[];
        exposeHeaders?: string[];
        credentials?: boolean;
    };
    /**
     * Internal agent cache configuration
     * @deprecated Use agent-level cache config instead
     */
    cache?: {
        enabled: boolean;
        ttl: number;
        vary?: string[];
        tags?: string[];
    };
    /**
     * HTTP Cache-Control headers for CDN/browser caching
     *
     * NOTE: This is separate from agent `cache:` config which controls
     * internal computation caching. This controls HTTP response headers.
     *
     * @example
     * ```yaml
     * httpCache:
     *   public: true
     *   maxAge: 300
     *   staleWhileRevalidate: 60
     * ```
     */
    httpCache?: {
        /** Cache-Control: max-age=N (seconds) */
        maxAge?: number;
        /** Cache-Control: public (CDN can cache) */
        public?: boolean;
        /** Cache-Control: private (browser only, not CDN) */
        private?: boolean;
        /** Cache-Control: no-cache (must revalidate) */
        noCache?: boolean;
        /** Cache-Control: no-store (don't cache at all) */
        noStore?: boolean;
        /** stale-while-revalidate=N (seconds) */
        staleWhileRevalidate?: number;
        /** stale-if-error=N (seconds) */
        staleIfError?: number;
        /** Vary header values (merged with auth-added values) */
        vary?: string[];
        /** Custom Cache-Control directives */
        custom?: string;
    };
    middleware?: string[];
    responses?: {
        html?: {
            enabled: boolean;
        };
        json?: {
            enabled: boolean;
        };
        stream?: {
            enabled: boolean;
            chunkSize?: number;
        };
    };
    templateEngine?: 'handlebars' | 'liquid' | 'simple';
}
export interface McpTrigger {
    type: 'mcp';
    auth?: {
        type: 'bearer' | 'oauth';
        secret?: string;
    };
    public?: boolean;
}
export interface EmailTrigger {
    type: 'email';
    addresses: string[];
    auth?: {
        from: string[];
    };
    public?: boolean;
    reply_with_output?: boolean;
}
export interface QueueTrigger {
    type: 'queue';
    queue: string;
    batch_size?: number;
    max_retries?: number;
    max_wait_time?: number;
}
export interface CronTrigger {
    type: 'cron';
    cron: string;
    timezone?: string;
    enabled?: boolean;
    input?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export type TriggerConfig = WebhookTrigger | HttpTrigger | McpTrigger | EmailTrigger | QueueTrigger | CronTrigger;
/**
 * Notification configuration types
 */
export interface WebhookNotification {
    type: 'webhook';
    url: string;
    events: ('execution.started' | 'execution.completed' | 'execution.failed' | 'execution.timeout' | 'agent.completed' | 'state.updated')[];
    secret?: string;
    retries?: number;
    timeout?: number;
}
export interface EmailNotification {
    type: 'email';
    to: string[];
    events: ('execution.started' | 'execution.completed' | 'execution.failed' | 'execution.timeout' | 'agent.completed' | 'state.updated')[];
    subject?: string;
    from?: string;
}
export type NotificationConfig = WebhookNotification | EmailNotification;
/**
 * Scoring configuration
 */
export interface ScoringConfig {
    enabled: boolean;
    defaultThresholds: {
        minimum: number;
        target?: number;
        excellent?: number;
    };
    maxRetries?: number;
    backoffStrategy?: 'linear' | 'exponential' | 'fixed';
    initialBackoff?: number;
    trackInState?: boolean;
    criteria?: Record<string, string> | unknown[];
    aggregation?: 'weighted_average' | 'minimum' | 'geometric_mean';
}
/**
 * Inline agent configuration (for agents defined within ensemble)
 */
export interface InlineAgentConfig {
    name: string;
    operation: string;
    description?: string;
    config?: Record<string, unknown>;
    schema?: AgentSchemaConfig;
}
/**
 * Ensemble configuration options
 */
export interface EnsembleOptions {
    /** Unique ensemble name */
    name: string;
    /** Version string */
    version?: string;
    /** Human-readable description */
    description?: string;
    /**
     * Execution steps - can be static array or dynamic function
     *
     * Static: steps are defined at creation time
     * Dynamic: steps are generated at runtime based on context
     */
    steps: FlowStepType[] | ((context: Context) => FlowStepType[] | Promise<FlowStepType[]>);
    /** Inline agent definitions */
    agents?: InlineAgentConfig[];
    /** State management configuration */
    state?: StateConfig;
    /** Scoring configuration */
    scoring?: ScoringConfig;
    /** Trigger configurations (how the ensemble is invoked) */
    trigger?: TriggerConfig[];
    /** Notification configurations (outbound events) */
    notifications?: NotificationConfig[];
    /** Input schema definition */
    inputs?: Record<string, unknown>;
    /** Output mapping */
    output?: Record<string, unknown>;
    /**
     * Called before execution starts
     *
     * @example
     * ```typescript
     * beforeExecute: async (context) => {
     *   console.log(`Starting ensemble with input:`, context.input);
     *   await analytics.track('ensemble_started');
     * }
     * ```
     */
    beforeExecute?: (context: Context) => void | Promise<void>;
    /**
     * Called after execution completes successfully
     *
     * @example
     * ```typescript
     * afterExecute: async (result, context) => {
     *   await analytics.track('ensemble_completed', {
     *     duration: result.metrics.totalDuration
     *   });
     * }
     * ```
     */
    afterExecute?: (result: unknown, context: Context) => void | Promise<void>;
    /**
     * Called when an error occurs in a step
     *
     * @returns Action to take: 'retry', 'skip', or 'fail'
     *
     * @example
     * ```typescript
     * onError: (error, step, context) => {
     *   if (error.code === 'NETWORK_ERROR') {
     *     return 'retry';
     *   }
     *   return 'fail';
     * }
     * ```
     */
    onError?: (error: Error, step: FlowStepType, context: Context) => 'retry' | 'skip' | 'fail';
}
/**
 * Ensemble class - runtime representation of an ensemble
 *
 * This class is the canonical runtime object for both YAML and TS ensembles.
 */
export declare class Ensemble {
    /** Ensemble name */
    readonly name: string;
    /** Version string */
    readonly version?: string;
    /** Description */
    readonly description?: string;
    /** Static steps (if not dynamic) */
    readonly staticSteps?: FlowStepType[];
    /** Inline agent definitions */
    readonly agents?: InlineAgentConfig[];
    /** State configuration */
    readonly state?: StateConfig;
    /** Scoring configuration */
    readonly scoring?: ScoringConfig;
    /** Triggers */
    readonly trigger?: TriggerConfig[];
    /** Notifications */
    readonly notifications?: NotificationConfig[];
    /** Input schema */
    readonly inputs?: Record<string, unknown>;
    /** Output mapping */
    readonly output?: Record<string, unknown>;
    /** Lifecycle hooks */
    readonly hooks?: EnsembleHooks;
    /** Whether steps are dynamically generated */
    readonly isDynamic: boolean;
    constructor(options: EnsembleOptions);
    /**
     * Resolve steps for execution
     *
     * For static ensembles, returns the static steps.
     * For dynamic ensembles, calls the step generator function.
     */
    resolveSteps(context: Context): Promise<FlowStepType[]>;
    /**
     * Get the flow steps (for backward compatibility)
     *
     * Note: For dynamic ensembles, this returns an empty array.
     * Use resolveSteps() for runtime step resolution.
     */
    get flow(): FlowStepType[];
    /**
     * Convert to plain config object (for serialization/YAML export)
     */
    toConfig(): EnsembleConfig;
}
/**
 * Type alias for serializable ensemble config
 */
export interface EnsembleConfig {
    name: string;
    description?: string;
    state?: StateConfig;
    scoring?: ScoringConfig;
    trigger?: TriggerConfig[];
    notifications?: NotificationConfig[];
    agents?: Record<string, unknown>[];
    flow?: FlowStepType[];
    inputs?: Record<string, unknown>;
    output?: Record<string, unknown>;
}
/**
 * Create an ensemble programmatically
 *
 * @param options - Ensemble configuration
 * @returns Ensemble instance
 *
 * @example
 * ```typescript
 * // Simple static ensemble
 * const pipeline = createEnsemble({
 *   name: 'data-pipeline',
 *   steps: [
 *     step('fetch', { operation: 'http', config: { url: '...' } }),
 *     step('transform', { script: 'scripts/transform' }),
 *     step('store', { operation: 'storage', config: { ... } })
 *   ]
 * });
 *
 * // Dynamic ensemble with runtime step generation
 * const adaptive = createEnsemble({
 *   name: 'adaptive-pipeline',
 *   steps: (context) => {
 *     const sources = context.input.sources as string[];
 *     return [
 *       parallel(sources.map(url =>
 *         step(`fetch-${url}`, { operation: 'http', config: { url } })
 *       )),
 *       step('merge', { script: 'scripts/merge' })
 *     ];
 *   }
 * });
 *
 * // Ensemble with triggers and hooks
 * const service = createEnsemble({
 *   name: 'user-service',
 *   steps: [
 *     step('validate'),
 *     step('process'),
 *     step('respond')
 *   ],
 *   trigger: [{
 *     type: 'http',
 *     path: '/users',
 *     methods: ['POST'],
 *     public: false,
 *     auth: { type: 'bearer', secret: '${env.API_SECRET}' }
 *   }],
 *   beforeExecute: async (ctx) => {
 *     console.log('Request received');
 *   },
 *   afterExecute: async (result, ctx) => {
 *     console.log('Request completed');
 *   }
 * });
 * ```
 */
export declare function createEnsemble(options: EnsembleOptions): Ensemble;
/**
 * Check if a value is an Ensemble instance
 */
export declare function isEnsemble(value: unknown): value is Ensemble;
/**
 * Create an ensemble from a plain config object (for YAML parsing)
 *
 * This is used internally by the parser to convert parsed YAML to an Ensemble.
 */
export declare function ensembleFromConfig(config: EnsembleConfig): Ensemble;
//# sourceMappingURL=ensemble.d.ts.map