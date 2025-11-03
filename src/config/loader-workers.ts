/**
 * Workers-Compatible Configuration Loader
 *
 * Config loading strategies that work in Cloudflare Workers environment.
 * No filesystem dependencies - uses environment variables, direct objects,
 * KV storage, or bundled imports.
 */

import type { ConductorConfig } from './types'
import { DEFAULT_CONFIG } from './types'
import { Result } from '../types/result'

/**
 * Configuration source types
 */
export type ConfigSource =
  | { type: 'object'; config: Partial<ConductorConfig> }
  | { type: 'env'; env: Record<string, string> }
  | { type: 'kv'; namespace: KVNamespace; key?: string }
  | { type: 'imported'; module: { default: Partial<ConductorConfig> } }

/**
 * Create configuration from source (Workers-compatible)
 *
 * @example Direct object
 * ```typescript
 * const config = await createConfig({
 *   type: 'object',
 *   config: { docs: { useAI: true } }
 * });
 * ```
 *
 * @example Environment variables
 * ```typescript
 * const config = await createConfig({
 *   type: 'env',
 *   env: process.env  // or Cloudflare env bindings
 * });
 * ```
 *
 * @example KV storage
 * ```typescript
 * const config = await createConfig({
 *   type: 'kv',
 *   namespace: env.CONDUCTOR_KV
 * });
 * ```
 *
 * @example Bundled import (Wrangler bundles this)
 * ```typescript
 * import config from './conductor.config';
 * const result = await createConfig({
 *   type: 'imported',
 *   module: config
 * });
 * ```
 */
export async function createConfig(source?: ConfigSource): Promise<Result<ConductorConfig, Error>> {
  try {
    // No source - return defaults
    if (!source) {
      return Result.ok(DEFAULT_CONFIG)
    }

    let userConfig: Partial<ConductorConfig>

    switch (source.type) {
      case 'object':
        userConfig = source.config
        break

      case 'env':
        userConfig = configFromEnv(source.env)
        break

      case 'kv':
        const kvResult = await configFromKV(source.namespace, source.key)
        if (!kvResult.success) {
          return kvResult
        }
        userConfig = kvResult.value
        break

      case 'imported':
        userConfig = source.module.default || {}
        break

      default:
        return Result.err(new Error(`Unknown config source type`))
    }

    // Merge with defaults
    const config = mergeConfig(DEFAULT_CONFIG, userConfig)

    // Validate
    const validationResult = validateConfig(config)
    if (!validationResult.success) {
      return Result.err(validationResult.error)
    }

    return Result.ok(config)
  } catch (error) {
    return Result.err(error as Error)
  }
}

/**
 * Load config from environment variables
 *
 * Supports both Node.js process.env and Cloudflare env bindings
 *
 * Env var format:
 * - CONDUCTOR_DOCS_USE_AI=true
 * - CONDUCTOR_DOCS_FORMAT=json
 * - CONDUCTOR_OBSERVABILITY_LOG_LEVEL=debug
 */
function configFromEnv(env: Record<string, string>): Partial<ConductorConfig> {
  const config: Partial<ConductorConfig> = {}

  // Docs config
  if (env.CONDUCTOR_DOCS_USE_AI !== undefined) {
    config.docs = config.docs || {}
    config.docs.useAI = env.CONDUCTOR_DOCS_USE_AI === 'true'
  }
  if (env.CONDUCTOR_DOCS_AI_MEMBER) {
    config.docs = config.docs || {}
    config.docs.aiMember = env.CONDUCTOR_DOCS_AI_MEMBER
  }
  if (env.CONDUCTOR_DOCS_FORMAT) {
    config.docs = config.docs || {}
    config.docs.format = env.CONDUCTOR_DOCS_FORMAT as 'yaml' | 'json'
  }
  if (env.CONDUCTOR_DOCS_OUTPUT_DIR) {
    config.docs = config.docs || {}
    config.docs.outputDir = env.CONDUCTOR_DOCS_OUTPUT_DIR
  }

  // Observability config
  if (env.CONDUCTOR_OBSERVABILITY_LOGGING !== undefined) {
    config.observability = config.observability || {}
    config.observability.logging = env.CONDUCTOR_OBSERVABILITY_LOGGING === 'true'
  }
  if (env.CONDUCTOR_OBSERVABILITY_LOG_LEVEL) {
    config.observability = config.observability || {}
    config.observability.logLevel = env.CONDUCTOR_OBSERVABILITY_LOG_LEVEL as any
  }
  if (env.CONDUCTOR_OBSERVABILITY_METRICS !== undefined) {
    config.observability = config.observability || {}
    config.observability.metrics = env.CONDUCTOR_OBSERVABILITY_METRICS === 'true'
  }

  // Execution config
  if (env.CONDUCTOR_EXECUTION_DEFAULT_TIMEOUT) {
    config.execution = config.execution || {}
    config.execution.defaultTimeout = parseInt(env.CONDUCTOR_EXECUTION_DEFAULT_TIMEOUT, 10)
  }
  if (env.CONDUCTOR_EXECUTION_TRACK_HISTORY !== undefined) {
    config.execution = config.execution || {}
    config.execution.trackHistory = env.CONDUCTOR_EXECUTION_TRACK_HISTORY === 'true'
  }
  if (env.CONDUCTOR_EXECUTION_MAX_HISTORY_ENTRIES) {
    config.execution = config.execution || {}
    config.execution.maxHistoryEntries = parseInt(env.CONDUCTOR_EXECUTION_MAX_HISTORY_ENTRIES, 10)
  }

  // Storage config
  if (env.CONDUCTOR_STORAGE_TYPE) {
    config.storage = config.storage || {}
    config.storage.type = env.CONDUCTOR_STORAGE_TYPE as any
  }
  if (env.CONDUCTOR_STORAGE_PATH) {
    config.storage = config.storage || {}
    config.storage.path = env.CONDUCTOR_STORAGE_PATH
  }

  return config
}

/**
 * Load config from KV storage
 */
async function configFromKV(
  namespace: KVNamespace,
  key: string = 'conductor-config'
): Promise<Result<Partial<ConductorConfig>, Error>> {
  try {
    const json = await namespace.get(key, 'json')
    if (!json) {
      // No config in KV, use defaults
      return Result.ok({})
    }
    return Result.ok(json as Partial<ConductorConfig>)
  } catch (error) {
    return Result.err(new Error(`Failed to load config from KV: ${error}`))
  }
}

/**
 * Merge user config with defaults (deep merge)
 */
function mergeConfig(defaults: ConductorConfig, user: Partial<ConductorConfig>): ConductorConfig {
  return {
    docs: { ...defaults.docs, ...user.docs },
    testing: {
      ...defaults.testing,
      ...user.testing,
      coverage: {
        ...defaults.testing?.coverage,
        ...user.testing?.coverage,
      },
    },
    observability: {
      ...defaults.observability,
      ...user.observability,
      opentelemetry: {
        ...defaults.observability?.opentelemetry,
        ...user.observability?.opentelemetry,
      },
    },
    execution: { ...defaults.execution, ...user.execution },
    storage: { ...defaults.storage, ...user.storage },
  }
}

/**
 * Validate configuration
 */
function validateConfig(config: ConductorConfig): Result<void, Error> {
  const errors: string[] = []

  // Validate docs config
  if (config.docs?.format && !['yaml', 'json'].includes(config.docs.format)) {
    errors.push(`Invalid docs.format: ${config.docs.format}. Must be 'yaml' or 'json'`)
  }

  // Validate testing config
  if (config.testing?.coverage) {
    const c = config.testing.coverage
    if (c.lines !== undefined && (c.lines < 0 || c.lines > 100)) {
      errors.push(`Invalid testing.coverage.lines: ${c.lines}. Must be between 0 and 100`)
    }
    if (c.functions !== undefined && (c.functions < 0 || c.functions > 100)) {
      errors.push(`Invalid testing.coverage.functions: ${c.functions}. Must be between 0 and 100`)
    }
    if (c.branches !== undefined && (c.branches < 0 || c.branches > 100)) {
      errors.push(`Invalid testing.coverage.branches: ${c.branches}. Must be between 0 and 100`)
    }
    if (c.statements !== undefined && (c.statements < 0 || c.statements > 100)) {
      errors.push(`Invalid testing.coverage.statements: ${c.statements}. Must be between 0 and 100`)
    }
  }

  // Validate observability config
  if (config.observability?.logLevel) {
    const validLevels = ['debug', 'info', 'warn', 'error']
    if (!validLevels.includes(config.observability.logLevel)) {
      errors.push(
        `Invalid observability.logLevel: ${config.observability.logLevel}. Must be one of: ${validLevels.join(', ')}`
      )
    }
  }

  // Validate execution config
  if (config.execution) {
    if (config.execution.defaultTimeout !== undefined && config.execution.defaultTimeout < 0) {
      errors.push(
        `Invalid execution.defaultTimeout: ${config.execution.defaultTimeout}. Must be >= 0`
      )
    }
    if (
      config.execution.maxHistoryEntries !== undefined &&
      config.execution.maxHistoryEntries < 0
    ) {
      errors.push(
        `Invalid execution.maxHistoryEntries: ${config.execution.maxHistoryEntries}. Must be >= 0`
      )
    }
  }

  // Validate storage config
  if (config.storage?.type) {
    const validTypes = ['filesystem', 'd1', 'kv']
    if (!validTypes.includes(config.storage.type)) {
      errors.push(
        `Invalid storage.type: ${config.storage.type}. Must be one of: ${validTypes.join(', ')}`
      )
    }
  }

  if (errors.length > 0) {
    return Result.err(new Error(`Configuration validation failed:\n${errors.join('\n')}`))
  }

  return Result.ok(undefined)
}

/**
 * Get config value with type safety
 */
export function getConfigValue<K extends keyof ConductorConfig>(
  config: ConductorConfig,
  key: K
): ConductorConfig[K] {
  return config[key]
}
