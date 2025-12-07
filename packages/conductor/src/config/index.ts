/**
 * Conductor Configuration
 *
 * Type-safe configuration management for Conductor projects.
 * Includes Zod schemas for runtime validation.
 */

export type {
  ConductorConfig,
  DocsConfig,
  TestingConfig,
  ObservabilityConfig,
  ExecutionConfig,
  StorageConfig,
  SecurityConfigOptions,
  PublicAssetsConfig,
  ProtectedAssetsConfig,
  ApiConfig,
} from './types.js'

export { DEFAULT_CONFIG } from './types.js'

// Discovery configuration
export type {
  DiscoveryConfig,
  DiscoveryTypeConfig,
  AgentDiscoveryConfig,
  EnsembleDiscoveryConfig,
  DocsDiscoveryConfig,
  ScriptsDiscoveryConfig,
} from './discovery.js'

export {
  DEFAULT_DISCOVERY_CONFIG,
  DEFAULT_AGENT_DISCOVERY,
  DEFAULT_ENSEMBLE_DISCOVERY,
  DEFAULT_DOCS_DISCOVERY,
  DEFAULT_SCRIPTS_DISCOVERY,
  mergeDiscoveryConfig,
  getDiscoveryTypeConfig,
  buildGlobPattern,
  buildExcludePatterns,
  validateDiscoveryConfig,
  DiscoveryConfigSchema,
  AgentDiscoveryConfigSchema,
  EnsembleDiscoveryConfigSchema,
  DocsDiscoveryConfigSchema,
  ScriptsDiscoveryConfigSchema,
} from './discovery.js'

export { loadConfig, loadConfigSync, getConfigValue } from './loader.js'

// Workers-compatible config loading
export { createConfig, type ConfigSource } from './loader-workers.js'

// Security configuration (stateless - pass config through context)
export {
  type SecurityConfig,
  DEFAULT_SECURITY_CONFIG,
  createSecurityConfig,
  isAuthRequired,
  isDirectAgentExecutionAllowed,
  isAutoPermissionsEnabled,
  getRequiredPermission,
  isProductionEnvironment,
  getProductionEnvironments,
} from './security.js'

// Zod validation schemas for runtime config validation
export {
  // Main schema
  ConductorConfigSchema,
  // Section schemas
  SecurityConfigOptionsSchema,
  RoutingConfigSchema,
  DocsConfigSchema,
  TestingConfigSchema,
  ObservabilityConfigSchema,
  ExecutionConfigSchema,
  StorageConfigSchema,
  ApiConfigSchema,
  PublicAssetsConfigSchema,
  // Sub-schemas
  AuthConfigSchema,
  AuthRuleSchema,
  LoggingConfigSchema,
  MetricsConfigSchema,
  OpenTelemetryConfigSchema,
  ExternalAssetMappingSchema,
  // Validation helpers
  validateConfig,
  validateConfigOrThrow,
  validateSection,
  formatValidationErrors,
  // Inferred types
  type ValidatedConductorConfig,
  type ValidatedPublicAssetsConfig,
  type ValidationResult,
} from './schemas.js'
