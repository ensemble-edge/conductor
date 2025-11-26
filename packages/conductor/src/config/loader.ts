/**
 * Configuration Loader
 *
 * Load and validate Conductor configuration files.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { pathToFileURL } from 'url'
import type { ConductorConfig } from './types.js'
import { DEFAULT_CONFIG } from './types.js'
import { Result } from '../types/result.js'

/**
 * Load configuration from project directory
 */
export async function loadConfig(projectPath: string): Promise<Result<ConductorConfig, Error>> {
  try {
    const configPath = path.join(projectPath, 'conductor.config.ts')

    // Check if config file exists
    try {
      await fs.access(configPath)
    } catch {
      // Config file doesn't exist, return defaults
      return Result.ok(DEFAULT_CONFIG)
    }

    // Dynamic import the config file
    const fileUrl = pathToFileURL(configPath).href
    const configModule = await import(fileUrl)

    // Get default export
    const userConfig = configModule.default as ConductorConfig

    // Merge with defaults
    const config = mergeConfig(DEFAULT_CONFIG, userConfig)

    // Validate config
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
 * Load configuration synchronously (for templates)
 */
export function loadConfigSync(projectPath: string): ConductorConfig {
  try {
    const configPath = path.join(projectPath, 'conductor.config.ts')

    // Check if config file exists
    if (!require('fs').existsSync(configPath)) {
      return DEFAULT_CONFIG
    }

    // Require the config
    const configModule = require(configPath)
    const userConfig = configModule.default as ConductorConfig

    // Merge with defaults
    return mergeConfig(DEFAULT_CONFIG, userConfig)
  } catch {
    return DEFAULT_CONFIG
  }
}

/**
 * Merge user config with defaults
 */
function mergeConfig(defaults: ConductorConfig, user: ConductorConfig): ConductorConfig {
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
  if (config.docs) {
    if (config.docs.format && !['yaml', 'json'].includes(config.docs.format)) {
      errors.push(`Invalid docs.format: ${config.docs.format}. Must be 'yaml' or 'json'`)
    }
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
  if (config.observability?.logging && typeof config.observability.logging === 'object') {
    const logLevel = config.observability.logging.level
    if (logLevel) {
      const validLevels = ['debug', 'info', 'warn', 'error']
      if (!validLevels.includes(logLevel)) {
        errors.push(
          `Invalid observability.logging.level: ${logLevel}. Must be one of: ${validLevels.join(', ')}`
        )
      }
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
