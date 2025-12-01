/**
 * Conductor Configuration
 *
 * Type-safe configuration management for Conductor projects.
 * Includes Zod schemas for runtime validation.
 */
export type { ConductorConfig, DocsConfig, TestingConfig, ObservabilityConfig, ExecutionConfig, StorageConfig, SecurityConfigOptions, } from './types.js';
export { DEFAULT_CONFIG } from './types.js';
export type { DiscoveryConfig, DiscoveryTypeConfig, AgentDiscoveryConfig, EnsembleDiscoveryConfig, DocsDiscoveryConfig, ScriptsDiscoveryConfig, } from './discovery.js';
export { DEFAULT_DISCOVERY_CONFIG, DEFAULT_AGENT_DISCOVERY, DEFAULT_ENSEMBLE_DISCOVERY, DEFAULT_DOCS_DISCOVERY, DEFAULT_SCRIPTS_DISCOVERY, mergeDiscoveryConfig, getDiscoveryTypeConfig, buildGlobPattern, buildExcludePatterns, validateDiscoveryConfig, DiscoveryConfigSchema, AgentDiscoveryConfigSchema, EnsembleDiscoveryConfigSchema, DocsDiscoveryConfigSchema, ScriptsDiscoveryConfigSchema, } from './discovery.js';
export { loadConfig, loadConfigSync, getConfigValue } from './loader.js';
export { createConfig, type ConfigSource } from './loader-workers.js';
export { type SecurityConfig, DEFAULT_SECURITY_CONFIG, createSecurityConfig, isAuthRequired, isDirectAgentExecutionAllowed, isAutoPermissionsEnabled, getRequiredPermission, isProductionEnvironment, getProductionEnvironments, } from './security.js';
export { ConductorConfigSchema, SecurityConfigOptionsSchema, RoutingConfigSchema, DocsConfigSchema, TestingConfigSchema, ObservabilityConfigSchema, ExecutionConfigSchema, StorageConfigSchema, AuthConfigSchema, AuthRuleSchema, LoggingConfigSchema, MetricsConfigSchema, OpenTelemetryConfigSchema, validateConfig, validateConfigOrThrow, validateSection, formatValidationErrors, type ValidatedConductorConfig, type ValidationResult, } from './schemas.js';
//# sourceMappingURL=index.d.ts.map