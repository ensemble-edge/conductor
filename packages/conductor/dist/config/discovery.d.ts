/**
 * Discovery Configuration
 *
 * Centralized configuration for build-time auto-discovery of agents,
 * ensembles, docs, and scripts. This provides a single source of truth
 * for directory paths and file patterns across Vite plugins and loaders.
 *
 * @example conductor.config.json
 * ```json
 * {
 *   "discovery": {
 *     "agents": {
 *       "enabled": true,
 *       "directory": "agents",
 *       "patterns": ["**\/*.yaml", "**\/*.yml"]
 *     },
 *     "ensembles": {
 *       "enabled": true,
 *       "directory": "ensembles",
 *       "patterns": ["**\/*.yaml", "**\/*.yml", "**\/*.ts"]
 *     }
 *   }
 * }
 * ```
 */
import { z } from 'zod';
/**
 * Configuration for a single discovery type (agents, ensembles, docs, scripts)
 */
export interface DiscoveryTypeConfig {
    /**
     * Whether this discovery type is enabled
     * @default true
     */
    enabled?: boolean;
    /**
     * Directory to scan for files (relative to project root)
     * @example 'agents', 'ensembles', 'docs'
     */
    directory: string;
    /**
     * Glob patterns to match files within the directory
     * Supports recursive patterns like "**\/*.yaml"
     * @example ['**\/*.yaml', '**\/*.yml']
     */
    patterns: string[];
    /**
     * Config filename to look for (optional, for agent/ensemble discovery)
     * @example 'agent.yaml', 'ensemble.yaml'
     */
    configFile?: string;
    /**
     * Directories to exclude from discovery
     * @example ['node_modules', 'generate-docs']
     */
    excludeDirs?: string[];
    /**
     * Whether to include example files in discovery
     * @default true
     */
    includeExamples?: boolean;
}
/**
 * Agent-specific discovery configuration
 */
export interface AgentDiscoveryConfig extends DiscoveryTypeConfig {
    /**
     * File extensions for handler files
     * @default ['.ts']
     */
    handlerExtensions?: string[];
}
/**
 * Ensemble-specific discovery configuration
 */
export interface EnsembleDiscoveryConfig extends DiscoveryTypeConfig {
    /**
     * Whether to support TypeScript ensembles
     * @default true
     */
    supportTypeScript?: boolean;
}
/**
 * Docs-specific discovery configuration
 */
export interface DocsDiscoveryConfig extends DiscoveryTypeConfig {
    /**
     * Whether to exclude README files
     * @default true
     */
    excludeReadme?: boolean;
}
/**
 * Scripts-specific discovery configuration
 */
export interface ScriptsDiscoveryConfig extends DiscoveryTypeConfig {
    /**
     * Entry point file pattern for scripts
     * @default 'index.ts'
     */
    entryPoint?: string;
}
/**
 * Complete discovery configuration
 */
export interface DiscoveryConfig {
    /**
     * Agent discovery configuration
     */
    agents?: AgentDiscoveryConfig;
    /**
     * Ensemble discovery configuration
     */
    ensembles?: EnsembleDiscoveryConfig;
    /**
     * Docs discovery configuration
     */
    docs?: DocsDiscoveryConfig;
    /**
     * Scripts discovery configuration
     */
    scripts?: ScriptsDiscoveryConfig;
}
/**
 * Default agent discovery configuration
 */
export declare const DEFAULT_AGENT_DISCOVERY: AgentDiscoveryConfig;
/**
 * Default ensemble discovery configuration
 */
export declare const DEFAULT_ENSEMBLE_DISCOVERY: EnsembleDiscoveryConfig;
/**
 * Default docs discovery configuration
 */
export declare const DEFAULT_DOCS_DISCOVERY: DocsDiscoveryConfig;
/**
 * Default scripts discovery configuration
 */
export declare const DEFAULT_SCRIPTS_DISCOVERY: ScriptsDiscoveryConfig;
/**
 * Complete default discovery configuration
 */
export declare const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig;
/**
 * Base discovery type schema
 */
export declare const DiscoveryTypeConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    directory: z.ZodString;
    patterns: z.ZodArray<z.ZodString, "many">;
    configFile: z.ZodOptional<z.ZodString>;
    excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
}, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
}>;
/**
 * Agent discovery schema
 */
export declare const AgentDiscoveryConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    directory: z.ZodString;
    patterns: z.ZodArray<z.ZodString, "many">;
    configFile: z.ZodOptional<z.ZodString>;
    excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
} & {
    handlerExtensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    handlerExtensions?: string[] | undefined;
}, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    handlerExtensions?: string[] | undefined;
}>;
/**
 * Ensemble discovery schema
 */
export declare const EnsembleDiscoveryConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    directory: z.ZodString;
    patterns: z.ZodArray<z.ZodString, "many">;
    configFile: z.ZodOptional<z.ZodString>;
    excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
} & {
    supportTypeScript: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    supportTypeScript?: boolean | undefined;
}, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    supportTypeScript?: boolean | undefined;
}>;
/**
 * Docs discovery schema
 */
export declare const DocsDiscoveryConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    directory: z.ZodString;
    patterns: z.ZodArray<z.ZodString, "many">;
    configFile: z.ZodOptional<z.ZodString>;
    excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
} & {
    excludeReadme: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    excludeReadme?: boolean | undefined;
}, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    excludeReadme?: boolean | undefined;
}>;
/**
 * Scripts discovery schema
 */
export declare const ScriptsDiscoveryConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    directory: z.ZodString;
    patterns: z.ZodArray<z.ZodString, "many">;
    configFile: z.ZodOptional<z.ZodString>;
    excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    includeExamples: z.ZodOptional<z.ZodBoolean>;
} & {
    entryPoint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    entryPoint?: string | undefined;
}, {
    directory: string;
    patterns: string[];
    enabled?: boolean | undefined;
    configFile?: string | undefined;
    excludeDirs?: string[] | undefined;
    includeExamples?: boolean | undefined;
    entryPoint?: string | undefined;
}>;
/**
 * Complete discovery configuration schema
 */
export declare const DiscoveryConfigSchema: z.ZodObject<{
    agents: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        directory: z.ZodString;
        patterns: z.ZodArray<z.ZodString, "many">;
        configFile: z.ZodOptional<z.ZodString>;
        excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeExamples: z.ZodOptional<z.ZodBoolean>;
    } & {
        handlerExtensions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        handlerExtensions?: string[] | undefined;
    }, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        handlerExtensions?: string[] | undefined;
    }>>;
    ensembles: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        directory: z.ZodString;
        patterns: z.ZodArray<z.ZodString, "many">;
        configFile: z.ZodOptional<z.ZodString>;
        excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeExamples: z.ZodOptional<z.ZodBoolean>;
    } & {
        supportTypeScript: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        supportTypeScript?: boolean | undefined;
    }, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        supportTypeScript?: boolean | undefined;
    }>>;
    docs: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        directory: z.ZodString;
        patterns: z.ZodArray<z.ZodString, "many">;
        configFile: z.ZodOptional<z.ZodString>;
        excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeExamples: z.ZodOptional<z.ZodBoolean>;
    } & {
        excludeReadme: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        excludeReadme?: boolean | undefined;
    }, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        excludeReadme?: boolean | undefined;
    }>>;
    scripts: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        directory: z.ZodString;
        patterns: z.ZodArray<z.ZodString, "many">;
        configFile: z.ZodOptional<z.ZodString>;
        excludeDirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeExamples: z.ZodOptional<z.ZodBoolean>;
    } & {
        entryPoint: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        entryPoint?: string | undefined;
    }, {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        entryPoint?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    agents?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        handlerExtensions?: string[] | undefined;
    } | undefined;
    ensembles?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        supportTypeScript?: boolean | undefined;
    } | undefined;
    docs?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        excludeReadme?: boolean | undefined;
    } | undefined;
    scripts?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        entryPoint?: string | undefined;
    } | undefined;
}, {
    agents?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        handlerExtensions?: string[] | undefined;
    } | undefined;
    ensembles?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        supportTypeScript?: boolean | undefined;
    } | undefined;
    docs?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        excludeReadme?: boolean | undefined;
    } | undefined;
    scripts?: {
        directory: string;
        patterns: string[];
        enabled?: boolean | undefined;
        configFile?: string | undefined;
        excludeDirs?: string[] | undefined;
        includeExamples?: boolean | undefined;
        entryPoint?: string | undefined;
    } | undefined;
}>;
/**
 * Merge user config with defaults
 *
 * @param userConfig - User-provided discovery config
 * @returns Complete discovery config with defaults applied
 */
export declare function mergeDiscoveryConfig(userConfig?: Partial<DiscoveryConfig>): DiscoveryConfig;
/**
 * Get discovery config for a specific type
 *
 * @param config - Discovery config
 * @param type - Discovery type
 * @returns Type-specific config or undefined if disabled
 */
export declare function getDiscoveryTypeConfig(config: DiscoveryConfig, type: keyof DiscoveryConfig): DiscoveryTypeConfig | undefined;
/**
 * Build glob pattern string from config
 *
 * @param config - Discovery type config
 * @returns Glob pattern for file matching
 */
export declare function buildGlobPattern(config: DiscoveryTypeConfig): string;
/**
 * Build exclude patterns from config
 *
 * @param config - Discovery type config
 * @returns Array of exclude patterns for glob ignore
 */
export declare function buildExcludePatterns(config: DiscoveryTypeConfig): string[];
/**
 * Validate discovery configuration
 *
 * @param config - Config to validate
 * @returns Validation result
 */
export declare function validateDiscoveryConfig(config: unknown): {
    success: true;
    data: DiscoveryConfig;
} | {
    success: false;
    error: z.ZodError;
};
/**
 * Inferred type from Zod schema
 */
export type ValidatedDiscoveryConfig = z.infer<typeof DiscoveryConfigSchema>;
//# sourceMappingURL=discovery.d.ts.map