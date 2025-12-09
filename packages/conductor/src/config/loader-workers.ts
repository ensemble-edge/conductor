/**
 * Workers-Compatible Configuration Loader
 *
 * Config loading strategies that work in Cloudflare Workers environment.
 * No filesystem dependencies - uses environment variables, direct objects,
 * KV storage, or bundled imports.
 *
 * Uses Zod schemas for runtime validation with detailed error messages.
 */

import type { ConductorConfig } from './types.js'
import { DEFAULT_CONFIG } from './types.js'
import { Result } from '../types/result.js'
import {
  ConductorConfigSchema,
  formatValidationErrors,
  type ValidatedConductorConfig,
} from './schemas.js'

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
 *   config: { docs: { ai: { enabled: true } } }
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
 * import config from './conductor.config.js';
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
 * - CONDUCTOR_DOCS_AI_ENABLED=true
 * - CONDUCTOR_DOCS_AI_MODEL=gpt-4
 * - CONDUCTOR_DOCS_FORMAT=json
 * - CONDUCTOR_OBSERVABILITY_LOG_LEVEL=debug
 */
function configFromEnv(env: Record<string, string>): Partial<ConductorConfig> {
  const config: Partial<ConductorConfig> = {}

  // Docs config
  if (env.CONDUCTOR_DOCS_AI_ENABLED !== undefined) {
    config.docs = config.docs || {}
    config.docs.ai = config.docs.ai || {}
    config.docs.ai.enabled = env.CONDUCTOR_DOCS_AI_ENABLED === 'true'
  }
  if (env.CONDUCTOR_DOCS_AI_MODEL) {
    config.docs = config.docs || {}
    config.docs.ai = config.docs.ai || {}
    config.docs.ai.model = env.CONDUCTOR_DOCS_AI_MODEL
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
    // Initialize logging as object if it's boolean or undefined
    if (typeof config.observability.logging !== 'object') {
      config.observability.logging = { enabled: config.observability.logging !== false }
    }
    config.observability.logging.level = env.CONDUCTOR_OBSERVABILITY_LOG_LEVEL as
      | 'debug'
      | 'info'
      | 'warn'
      | 'error'
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
    const storageType = env.CONDUCTOR_STORAGE_TYPE
    // Validate storage type at runtime
    if (['filesystem', 'kv', 'd1'].includes(storageType)) {
      config.storage = config.storage || {}
      config.storage.type = storageType as 'filesystem' | 'kv' | 'd1'
    }
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
 * Validate configuration using Zod schema
 *
 * Provides detailed, path-specific error messages for invalid configs.
 */
function validateConfig(config: ConductorConfig): Result<ValidatedConductorConfig, Error> {
  const result = ConductorConfigSchema.safeParse(config)

  if (result.success) {
    return Result.ok(result.data)
  }

  // Format validation errors for user-friendly display
  const errorMessages = formatValidationErrors(result.error)
  return Result.err(new Error(`Configuration validation failed:\n${errorMessages.join('\n')}`))
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
