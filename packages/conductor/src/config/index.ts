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
} from './types.js'

export { DEFAULT_CONFIG } from './types.js'

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
  // Sub-schemas
  AuthConfigSchema,
  AuthRuleSchema,
  LoggingConfigSchema,
  MetricsConfigSchema,
  OpenTelemetryConfigSchema,
  // Validation helpers
  validateConfig,
  validateConfigOrThrow,
  validateSection,
  formatValidationErrors,
  // Inferred types
  type ValidatedConductorConfig,
  type ValidationResult,
} from './schemas.js'
