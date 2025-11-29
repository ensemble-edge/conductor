/**
 * Base Agent class
 *
 * Foundation for all agent types (Think, Function, Data, API, etc.)
 * Provides standard interface, response wrapping, error handling, and cache key generation
 */
import type { AgentConfig } from '../runtime/parser.js';
import type { ConductorEnv } from '../types/env.js';
import type { Logger } from '../observability/types.js';
import type { MetricsRecorder } from '../observability/context.js';
import type { AuthContext } from '../auth/types.js';
import type { SchemaRegistry } from '../components/schemas.js';
import type { PromptRegistry } from '../components/prompts.js';
import type { ConfigRegistry } from '../components/configs.js';
import type { QueryRegistry } from '../components/queries.js';
import type { ScriptRegistry } from '../components/scripts.js';
import type { TemplateRegistry } from '../components/templates.js';
import type { AgentRegistry, EnsembleRegistry } from '../components/discovery.js';
import type { SafeFetchOptions } from '../utils/safe-fetch.js';
import type { ExecutionId, RequestId } from '../types/branded.js';
/**
 * Execution context passed to agents
 *
 * Contains everything an agent needs to execute:
 * - Input data
 * - State management
 * - Environment bindings
 * - Observability (logger + metrics)
 */
export interface AgentExecutionContext {
    /** Input data for the agent */
    input: Record<string, any>;
    /** Shared state (if ensemble has state config) */
    state?: Record<string, any>;
    /** Function to update shared state */
    setState?: (updates: Record<string, any>) => void;
    /** Cloudflare environment bindings */
    env: ConductorEnv;
    /** Cloudflare execution context */
    ctx: ExecutionContext;
    /** Outputs from previous agents in the flow */
    previousOutputs?: Record<string, any>;
    /**
     * Scoped logger for this agent
     * Pre-configured with agent name, ensemble name, and execution IDs
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { logger } = context
     *   logger.info('Processing started', { itemCount: items.length })
     *   // ... do work ...
     *   logger.debug('Processing complete', { result })
     *   return result
     * }
     * ```
     */
    logger?: Logger;
    /**
     * Metrics recorder for Analytics Engine
     * Pre-configured with agent context
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { metrics } = context
     *   const startTime = Date.now()
     *   // ... do work ...
     *   metrics.record('items.processed', items.length)
     *   return result
     * }
     * ```
     */
    metrics?: MetricsRecorder;
    /**
     * Unique execution ID for tracing
     * Same across all agents in an ensemble execution
     * Branded type ensures type safety - use ExecutionId.unwrap() to get string
     */
    executionId?: ExecutionId;
    /**
     * Unique request ID
     * Same across the entire HTTP request lifecycle
     * Branded type ensures type safety - use RequestId.unwrap() to get string
     */
    requestId?: RequestId;
    /**
     * Authentication context from the request
     * Available when request was authenticated via trigger auth or API middleware
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { auth } = context
     *   if (auth?.authenticated) {
     *     logger.info('Request from user', { userId: auth.user?.id })
     *   }
     *   return { userAuthenticated: auth?.authenticated ?? false }
     * }
     * ```
     */
    auth?: AuthContext;
    /**
     * Schema registry for validating data against JSON schemas
     * Schemas are loaded from KV storage with versioning support
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { schemas, input } = context
     *
     *   // Validate input against a schema
     *   const result = await schemas.validate('order@v1.0.0', input)
     *   if (!result.valid) {
     *     throw new Error(`Validation failed: ${result.errors[0].message}`)
     *   }
     *
     *   // Quick boolean check
     *   if (await schemas.isValid('order', input)) {
     *     // process valid order
     *   }
     *
     *   return { validated: true }
     * }
     * ```
     */
    schemas?: SchemaRegistry;
    /**
     * Prompt registry for accessing and rendering prompt templates
     * Prompts are loaded from KV storage with Handlebars rendering
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { prompts, input } = context
     *
     *   // Get raw prompt template
     *   const template = await prompts.get('extraction@v1.0.0')
     *
     *   // Render with variables
     *   const rendered = await prompts.render('docs-writer', {
     *     page: input.page,
     *     projectName: 'MyApp'
     *   })
     *
     *   return { prompt: rendered }
     * }
     * ```
     */
    prompts?: PromptRegistry;
    /**
     * Config registry for accessing shared configuration components
     * Configs are loaded from KV storage with versioning and merging support
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { configs } = context
     *
     *   // Get full config
     *   const settings = await configs.get('docs-settings')
     *
     *   // Get nested value with default
     *   const theme = await configs.getValueOrDefault(
     *     'docs-settings',
     *     'theme.primaryColor',
     *     '#3B82F6'
     *   )
     *
     *   // Merge with overrides
     *   const customSettings = await configs.merge('docs-settings', {
     *     theme: { primaryColor: '#FF0000' }
     *   })
     *
     *   return { theme }
     * }
     * ```
     */
    configs?: ConfigRegistry;
    /**
     * Query registry for accessing SQL query templates
     * Queries are loaded from KV storage with versioning support
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { queries, env } = context
     *
     *   // Get a query template
     *   const sql = await queries.getSql('find-users@v1.0.0')
     *
     *   // Execute with D1
     *   const stmt = env.DB.prepare(sql)
     *   const results = await stmt.bind(userId).all()
     *
     *   return { users: results.results }
     * }
     * ```
     */
    queries?: QueryRegistry;
    /**
     * Script registry for accessing JavaScript/TypeScript scripts
     * Scripts are loaded from KV storage with versioning support
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { scripts } = context
     *
     *   // Get a script's source code
     *   const script = await scripts.get('transform-data@v1.0.0')
     *
     *   // Check if a script exists
     *   if (await scripts.exists('custom-validator')) {
     *     const validator = await scripts.get('custom-validator')
     *   }
     *
     *   return { processed: true }
     * }
     * ```
     */
    scripts?: ScriptRegistry;
    /**
     * Template registry for accessing HTML/Handlebars templates
     * Templates are loaded from KV storage with versioning and rendering support
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { templates } = context
     *
     *   // Get a template
     *   const template = await templates.get('email-header@v1.0.0')
     *
     *   // Render with variables
     *   const html = await templates.render('page-layout', {
     *     title: 'Welcome',
     *     content: 'Hello World',
     *   })
     *
     *   return { html }
     * }
     * ```
     */
    templates?: TemplateRegistry;
    /**
     * Agent-specific configuration from the ensemble definition
     * This is the `config` block defined for this agent in the YAML
     *
     * @example
     * ```yaml
     * # In ensemble YAML:
     * agents:
     *   - name: my-agent
     *     operation: code
     *     config:
     *       apiKey: ${env.API_KEY}
     *       maxRetries: 3
     *       options:
     *         verbose: true
     * ```
     *
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { config } = context
     *
     *   const apiKey = config?.apiKey as string
     *   const maxRetries = config?.maxRetries ?? 1
     *   const verbose = config?.options?.verbose ?? false
     *
     *   return { configured: true }
     * }
     * ```
     */
    config?: Record<string, any>;
    /**
     * Agent registry for discovering available agents
     * Useful for introspection and dynamic orchestration
     *
     * @example
     * ```typescript
     * export default async function(ctx: AgentExecutionContext) {
     *   const { agentRegistry } = ctx
     *
     *   // List all available agents
     *   const agents = agentRegistry?.list() || []
     *
     *   // Find agents by type
     *   const dataAgents = agents.filter(a => a.operation === 'data')
     *
     *   // Check if a specific agent exists
     *   if (agentRegistry?.has('my-custom-agent')) {
     *     const meta = agentRegistry.get('my-custom-agent')
     *     // Use agent metadata...
     *   }
     *
     *   return { availableAgents: agents.map(a => a.name) }
     * }
     * ```
     */
    agentRegistry?: AgentRegistry;
    /**
     * Ensemble registry for discovering available ensembles
     * Useful for generating API docs (OpenAPI) or building orchestration UIs
     *
     * @example
     * ```typescript
     * export default async function(ctx: AgentExecutionContext) {
     *   const { ensembleRegistry } = ctx
     *
     *   // List all ensembles
     *   const ensembles = ensembleRegistry?.list() || []
     *
     *   // Find HTTP-triggered ensembles for OpenAPI generation
     *   const httpEnsembles = ensembles.filter(e =>
     *     e.triggers.some(t => t.type === 'http')
     *   )
     *
     *   // Generate paths for OpenAPI spec
     *   const paths = {}
     *   for (const ensemble of httpEnsembles) {
     *     for (const trigger of ensemble.triggers) {
     *       if (trigger.type === 'http' && trigger.path) {
     *         paths[trigger.path] = {
     *           [trigger.methods?.[0]?.toLowerCase() || 'get']: {
     *             summary: ensemble.description,
     *             operationId: ensemble.name,
     *           }
     *         }
     *       }
     *     }
     *   }
     *
     *   return { openapi: { paths } }
     * }
     * ```
     */
    ensembleRegistry?: EnsembleRegistry;
    /**
     * SSRF-protected fetch function for making HTTP requests
     *
     * **ALWAYS use this instead of the global `fetch()`** when making requests
     * to URLs that come from user input or external sources.
     *
     * By default, this blocks requests to:
     * - Private IP ranges (10.x, 172.16.x, 192.168.x)
     * - Localhost (127.0.0.1, ::1)
     * - Cloud metadata services (169.254.169.254)
     * - Internal hostnames (.local, .internal)
     *
     * @example
     * ```typescript
     * export default async function(context: AgentExecutionContext) {
     *   const { fetch, input } = context
     *
     *   // Safe - SSRF protection is automatic
     *   const response = await fetch(input.url)
     *   const data = await response.json()
     *
     *   return { data }
     * }
     * ```
     *
     * @example
     * ```typescript
     * // If you MUST access internal URLs (use with extreme caution!)
     * const response = await fetch(internalUrl, {
     *   allowInternalRequests: true
     * })
     * ```
     */
    fetch?: (input: string | URL | Request, init?: SafeFetchOptions) => Promise<Response>;
}
export interface AgentResponse {
    success: boolean;
    data?: unknown;
    output?: any;
    error?: string;
    timestamp: string;
    cached: boolean;
    executionTime: number;
    metadata?: Record<string, unknown>;
}
/**
 * Security settings for agents
 * Read from AgentConfig.security and used to control automatic security features
 */
export interface AgentSecuritySettings {
    /**
     * Enable SSRF protection for fetch requests
     * When true (default), requests to private IPs, localhost, and metadata services are blocked
     * @default true
     */
    ssrf: boolean;
}
/**
 * Base class for all agent types
 */
export declare abstract class BaseAgent {
    protected config: AgentConfig;
    protected name: string;
    protected type: string;
    protected security: AgentSecuritySettings;
    constructor(config: AgentConfig);
    /**
     * Execute the agent with given input and context
     * @param context - Execution context
     * @returns Agent response
     */
    execute(context: AgentExecutionContext): Promise<AgentResponse>;
    /**
     * Enrich the execution context with automatic security features
     *
     * This method injects security utilities into the context based on
     * the agent's security settings. Developers don't need to remember
     * to add these - they're automatic.
     *
     * @param context - Original execution context
     * @returns Enriched context with security features
     */
    protected enrichContext(context: AgentExecutionContext): AgentExecutionContext;
    /**
     * Abstract method to be implemented by each agent type
     * @param context - Execution context
     * @returns Execution result
     */
    protected abstract run(context: AgentExecutionContext): Promise<any>;
    /**
     * Wrap successful execution result
     * @param data - Result data
     * @param executionTime - Time taken in milliseconds
     * @param cached - Whether result was cached
     * @returns Wrapped response
     */
    protected wrapSuccess(data: unknown, executionTime: number, cached?: boolean): AgentResponse;
    /**
     * Wrap error response
     * @param error - Error object
     * @param executionTime - Time taken in milliseconds
     * @returns Wrapped error response
     */
    protected wrapError(error: unknown, executionTime: number): AgentResponse;
    /**
     * Generate cache key for this agent's execution
     * @param input - Input data
     * @returns Cache key string
     */
    generateCacheKey(input: Record<string, any>): Promise<string>;
    /**
     * Sort object keys recursively for stable stringification
     * @param obj - Object to sort
     * @returns Sorted object
     */
    private sortObjectKeys;
    /**
     * Cryptographically secure SHA-256 hash function
     * @param str - String to hash
     * @returns Hash value (hex string)
     */
    private hashString;
    /**
     * Get agent configuration
     * @returns Agent configuration
     */
    getConfig(): AgentConfig;
    /**
     * Get agent name
     * @returns Agent name
     */
    getName(): string;
    /**
     * Get agent type
     * @returns Agent type
     */
    getType(): string;
}
//# sourceMappingURL=base-agent.d.ts.map