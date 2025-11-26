/**
 * Conductor Configuration
 *
 * Type-safe configuration management for Conductor projects.
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

// Security configuration
export {
  type SecurityConfig,
  DEFAULT_SECURITY_CONFIG,
  initSecurityConfig,
  getSecurityConfig,
  isAuthRequired,
  isDirectAgentExecutionAllowed,
  isAutoPermissionsEnabled,
  getRequiredPermission,
} from './security.js'
