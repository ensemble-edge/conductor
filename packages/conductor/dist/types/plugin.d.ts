/**
 * Plugin System Types
 *
 * Defines the plugin architecture for Conductor.
 * Supports two patterns:
 * 1. Functional plugins - Simple config transformers
 * 2. Lifecycle plugins - Complex plugins with async initialization
 */
import type { PluginRegistry, OperationHandler, OperationMetadata } from '../runtime/plugin-registry.js';
import type { ConductorEnv } from './env.js';
/**
 * Configuration for Conductor
 */
export interface ConductorConfig {
    /** Registered plugins */
    plugins?: ConductorPlugin[];
    /** Custom operations */
    operations?: OperationRegistration[];
    /** Environment-specific configuration */
    env?: Record<string, any>;
    /** Additional configuration */
    [key: string]: any;
}
/**
 * Plugin context provided during initialization
 */
export interface PluginContext {
    /** Global plugin registry */
    operationRegistry: PluginRegistry;
    /** Cloudflare Workers environment bindings */
    env: ConductorEnv;
    /** Cloudflare Workers execution context */
    ctx: ExecutionContext;
    /** Configuration passed to the plugin */
    config: Record<string, any>;
    /** Plugin-specific logger */
    logger: PluginLogger;
}
/**
 * Plugin logger interface
 */
export interface PluginLogger {
    info(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    error(message: string, error?: Error, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
}
/**
 * Operation registration from plugin
 */
export interface OperationRegistration {
    /** Operation name (e.g., 'plasmic:render', 'unkey:validate') */
    name: string;
    /** Operation handler */
    handler: OperationHandler;
    /** Operation metadata */
    metadata?: OperationMetadata;
}
/**
 * Middleware registration from plugin
 */
export interface MiddlewareRegistration {
    /** Middleware name */
    name: string;
    /** Middleware handler */
    handler: (context: any) => Promise<any>;
    /** Apply to specific routes/paths */
    paths?: string[];
}
/**
 * Agent registration from plugin
 */
export interface AgentRegistration {
    /** Agent type name */
    type: string;
    /** Agent class or factory */
    factory: any;
}
/**
 * Auth validator registration from plugin
 */
export interface AuthValidatorRegistration {
    /** Validator name */
    name: string;
    /** Validation handler */
    handler: (token: string, context: PluginContext) => Promise<AuthValidationResult>;
}
/**
 * Auth validation result
 */
export interface AuthValidationResult {
    valid: boolean;
    user?: any;
    metadata?: Record<string, any>;
    error?: string;
}
/**
 * Plugin dependency declaration
 */
export interface PluginDependency {
    /** Plugin name */
    name: string;
    /** Required version (semver) */
    version?: string;
    /** Is this dependency optional */
    optional?: boolean;
}
/**
 * Functional Plugin Pattern
 *
 * Simple plugins that transform configuration.
 * Use for lightweight integrations without async setup.
 *
 * @example
 * ```typescript
 * export const simplePlugin = (options: Options) =>
 *   (config: ConductorConfig): ConductorConfig => ({
 *     ...config,
 *     operations: [
 *       ...config.operations,
 *       { name: 'simple:op', handler: simpleHandler }
 *     ]
 *   })
 * ```
 */
export type FunctionalPlugin = (config: ConductorConfig) => ConductorConfig | Promise<ConductorConfig>;
/**
 * Lifecycle Plugin Pattern
 *
 * Complex plugins with full lifecycle management.
 * Use for external API connections, database setup, etc.
 *
 * @example
 * ```typescript
 * export const complexPlugin: LifecyclePlugin = {
 *   name: 'complex',
 *   version: '1.0.0',
 *   async initialize(context) {
 *     await connectToExternalService()
 *     context.operationRegistry.register('complex:op', handler)
 *   }
 * }
 * ```
 */
export interface LifecyclePlugin {
    /** Plugin identifier (unique name) */
    name: string;
    /** Plugin version (semver) */
    version: string;
    /** Human-readable description */
    description?: string;
    /**
     * Initialize plugin (called once during Conductor startup)
     * Register operations, setup connections, etc.
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Shutdown plugin (called on Worker termination)
     * Cleanup connections, close handles, etc.
     */
    shutdown?(): Promise<void>;
    /**
     * Operations provided by this plugin
     * Called during initialization to register operations
     */
    operations?(): OperationRegistration[];
    /**
     * Middleware provided by this plugin
     */
    middleware?(): MiddlewareRegistration[];
    /**
     * Agents provided by this plugin
     */
    agents?(): AgentRegistration[];
    /**
     * Auth validators provided by this plugin
     */
    authValidators?(): AuthValidatorRegistration[];
    /**
     * Plugin dependencies
     */
    dependencies?: PluginDependency[];
    /**
     * Required environment variables
     */
    requiredEnv?: string[];
    /**
     * Plugin configuration schema (for validation)
     */
    configSchema?: any;
}
/**
 * Union type supporting both plugin patterns
 */
export type ConductorPlugin = FunctionalPlugin | LifecyclePlugin;
/**
 * Type guard to check if plugin is lifecycle-based
 */
export declare function isLifecyclePlugin(plugin: ConductorPlugin): plugin is LifecyclePlugin;
/**
 * Type guard to check if plugin is functional
 */
export declare function isFunctionalPlugin(plugin: ConductorPlugin): plugin is FunctionalPlugin;
/**
 * Plugin builder helper for functional plugins
 *
 * @example
 * ```typescript
 * export const myPlugin = buildPlugin((options: Options) => (config) => {
 *   // Transform config
 *   return config
 * })
 * ```
 */
export declare function buildPlugin<TOptions = any>(factory: (options?: TOptions) => FunctionalPlugin): (options?: TOptions) => FunctionalPlugin;
/**
 * Plugin metadata (for discovery and documentation)
 */
export interface PluginMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    license?: string;
}
//# sourceMappingURL=plugin.d.ts.map