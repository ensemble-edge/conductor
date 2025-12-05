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
// ============================================================================
// Default Configuration
// ============================================================================
/**
 * Default agent discovery configuration
 */
export const DEFAULT_AGENT_DISCOVERY = {
    enabled: true,
    directory: 'agents',
    patterns: ['**/*.yaml', '**/*.yml'],
    configFile: 'agent.yaml',
    excludeDirs: ['generate-docs', 'node_modules'],
    includeExamples: true,
    handlerExtensions: ['.ts'],
};
/**
 * Default ensemble discovery configuration
 */
export const DEFAULT_ENSEMBLE_DISCOVERY = {
    enabled: true,
    directory: 'ensembles',
    patterns: ['**/*.yaml', '**/*.yml', '**/*.ts'],
    configFile: 'ensemble.yaml',
    excludeDirs: ['node_modules'],
    includeExamples: true,
    supportTypeScript: true,
};
/**
 * Default docs discovery configuration
 */
export const DEFAULT_DOCS_DISCOVERY = {
    enabled: true,
    directory: 'docs',
    patterns: ['**/*.md'],
    excludeDirs: ['node_modules'],
    excludeReadme: true,
};
/**
 * Default scripts discovery configuration
 */
export const DEFAULT_SCRIPTS_DISCOVERY = {
    enabled: false, // Scripts disabled by default
    directory: 'scripts',
    patterns: ['**/*.ts'],
    excludeDirs: ['node_modules'],
    entryPoint: 'index.ts',
};
/**
 * Complete default discovery configuration
 */
export const DEFAULT_DISCOVERY_CONFIG = {
    agents: DEFAULT_AGENT_DISCOVERY,
    ensembles: DEFAULT_ENSEMBLE_DISCOVERY,
    docs: DEFAULT_DOCS_DISCOVERY,
    scripts: DEFAULT_SCRIPTS_DISCOVERY,
};
// ============================================================================
// Zod Schemas for Validation
// ============================================================================
/**
 * Base discovery type schema
 */
export const DiscoveryTypeConfigSchema = z.object({
    enabled: z.boolean().optional().describe('Whether this discovery type is enabled'),
    directory: z.string().min(1).describe('Directory to scan for files'),
    patterns: z.array(z.string()).min(1).describe('Glob patterns to match files'),
    configFile: z.string().optional().describe('Config filename to look for'),
    excludeDirs: z.array(z.string()).optional().describe('Directories to exclude'),
    includeExamples: z.boolean().optional().describe('Include example files'),
});
/**
 * Agent discovery schema
 */
export const AgentDiscoveryConfigSchema = DiscoveryTypeConfigSchema.extend({
    handlerExtensions: z.array(z.string()).optional().describe('Handler file extensions'),
});
/**
 * Ensemble discovery schema
 */
export const EnsembleDiscoveryConfigSchema = DiscoveryTypeConfigSchema.extend({
    supportTypeScript: z.boolean().optional().describe('Support TypeScript ensembles'),
});
/**
 * Docs discovery schema
 */
export const DocsDiscoveryConfigSchema = DiscoveryTypeConfigSchema.extend({
    excludeReadme: z.boolean().optional().describe('Exclude README files'),
});
/**
 * Scripts discovery schema
 */
export const ScriptsDiscoveryConfigSchema = DiscoveryTypeConfigSchema.extend({
    entryPoint: z.string().optional().describe('Entry point file pattern'),
});
/**
 * Complete discovery configuration schema
 */
export const DiscoveryConfigSchema = z.object({
    agents: AgentDiscoveryConfigSchema.optional(),
    ensembles: EnsembleDiscoveryConfigSchema.optional(),
    docs: DocsDiscoveryConfigSchema.optional(),
    scripts: ScriptsDiscoveryConfigSchema.optional(),
});
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Merge user config with defaults
 *
 * @param userConfig - User-provided discovery config
 * @returns Complete discovery config with defaults applied
 */
export function mergeDiscoveryConfig(userConfig) {
    if (!userConfig) {
        return DEFAULT_DISCOVERY_CONFIG;
    }
    return {
        agents: userConfig.agents
            ? { ...DEFAULT_AGENT_DISCOVERY, ...userConfig.agents }
            : DEFAULT_AGENT_DISCOVERY,
        ensembles: userConfig.ensembles
            ? { ...DEFAULT_ENSEMBLE_DISCOVERY, ...userConfig.ensembles }
            : DEFAULT_ENSEMBLE_DISCOVERY,
        docs: userConfig.docs
            ? { ...DEFAULT_DOCS_DISCOVERY, ...userConfig.docs }
            : DEFAULT_DOCS_DISCOVERY,
        scripts: userConfig.scripts
            ? { ...DEFAULT_SCRIPTS_DISCOVERY, ...userConfig.scripts }
            : DEFAULT_SCRIPTS_DISCOVERY,
    };
}
/**
 * Get discovery config for a specific type
 *
 * @param config - Discovery config
 * @param type - Discovery type
 * @returns Type-specific config or undefined if disabled
 */
export function getDiscoveryTypeConfig(config, type) {
    const typeConfig = config[type];
    if (!typeConfig || typeConfig.enabled === false) {
        return undefined;
    }
    return typeConfig;
}
/**
 * Build glob pattern string from config
 *
 * @param config - Discovery type config
 * @returns Glob pattern for file matching
 */
export function buildGlobPattern(config) {
    const { patterns } = config;
    if (patterns.length === 1) {
        return patterns[0];
    }
    // Build combined pattern for multiple extensions
    return `{${patterns.join(',')}}`;
}
/**
 * Build exclude patterns from config
 *
 * @param config - Discovery type config
 * @returns Array of exclude patterns for glob ignore
 */
export function buildExcludePatterns(config) {
    const excludes = [...(config.excludeDirs || [])];
    // Add examples to excludes if not including them
    if (config.includeExamples === false) {
        excludes.push('examples');
    }
    return excludes.map((dir) => `${dir}/**`);
}
/**
 * Validate discovery configuration
 *
 * @param config - Config to validate
 * @returns Validation result
 */
export function validateDiscoveryConfig(config) {
    const result = DiscoveryConfigSchema.safeParse(config);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
