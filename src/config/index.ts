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
} from './types'

export { DEFAULT_CONFIG } from './types'

export { loadConfig, loadConfigSync, getConfigValue } from './loader'

// Workers-compatible config loading
export { createConfig, type ConfigSource } from './loader-workers'
