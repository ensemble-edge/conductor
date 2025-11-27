/**
 * Config Component Registry
 *
 * Provides typed access to config components.
 * Wraps the ComponentRegistry for config-specific operations.
 *
 * @module components/configs
 */

import { parseNameWithVersion, type ComponentRegistry } from './registry.js'

/**
 * Config component registry - access config components
 *
 * Config components are reusable configuration objects that can be
 * shared across agents and ensembles. They're stored in KV and
 * versioned like other components.
 *
 * @example
 * ```typescript
 * // Get a config component
 * const settings = await ctx.configs.get('docs-settings')
 * const settingsWithVersion = await ctx.configs.get('docs-settings@v1.0.0')
 *
 * // Type-safe access
 * interface DocsSettings {
 *   theme: string
 *   includeExamples: boolean
 * }
 * const typedSettings = await ctx.configs.get<DocsSettings>('docs-settings')
 * ```
 */
export class ConfigRegistry {
  constructor(private parent: ComponentRegistry) {}

  /**
   * Get a config component by name (with optional @version)
   *
   * @param nameOrRef - Config name with optional version
   * @returns Config object (typed with generic parameter)
   *
   * @example
   * ```typescript
   * ctx.configs.get('settings')           // settings@latest
   * ctx.configs.get('settings@v1.0.0')    // exact version
   * ctx.configs.get<MySettings>('settings') // typed
   * ```
   */
  async get<T = Record<string, any>>(nameOrRef: string): Promise<T> {
    const { name, version } = parseNameWithVersion(nameOrRef)
    const ref = `configs/${name}@${version}`
    return this.parent.resolve(ref)
  }

  /**
   * Get a config value at a specific path
   *
   * Allows accessing nested properties directly.
   *
   * @param nameOrRef - Config name with optional version
   * @param path - Dot-separated path to the value
   * @returns Value at the path
   *
   * @example
   * ```typescript
   * // Get nested value
   * const theme = await ctx.configs.getValue('docs-settings', 'theme.primaryColor')
   * const aiEnabled = await ctx.configs.getValue('docs-settings', 'ai.enabled')
   * ```
   */
  async getValue<T = any>(nameOrRef: string, path: string): Promise<T | undefined> {
    const config = await this.get(nameOrRef)
    return getNestedValue(config, path)
  }

  /**
   * Get a config value with a default fallback
   *
   * @param nameOrRef - Config name with optional version
   * @param path - Dot-separated path to the value
   * @param defaultValue - Default value if path doesn't exist
   * @returns Value at the path or default
   *
   * @example
   * ```typescript
   * const theme = await ctx.configs.getValueOrDefault(
   *   'docs-settings',
   *   'theme.primaryColor',
   *   '#3B82F6'
   * )
   * ```
   */
  async getValueOrDefault<T>(nameOrRef: string, path: string, defaultValue: T): Promise<T> {
    const value = await this.getValue<T>(nameOrRef, path)
    return value !== undefined ? value : defaultValue
  }

  /**
   * Check if a config component exists
   *
   * @param nameOrRef - Config name with optional version
   * @returns True if config exists
   */
  async exists(nameOrRef: string): Promise<boolean> {
    try {
      await this.get(nameOrRef)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if a config has a specific path
   *
   * @param nameOrRef - Config name with optional version
   * @param path - Dot-separated path to check
   * @returns True if path exists
   */
  async hasPath(nameOrRef: string, path: string): Promise<boolean> {
    const value = await this.getValue(nameOrRef, path)
    return value !== undefined
  }

  /**
   * Merge a config with overrides
   *
   * Returns a new object with overrides applied (does not modify stored config).
   *
   * @param nameOrRef - Config name with optional version
   * @param overrides - Values to override
   * @returns Merged config object
   *
   * @example
   * ```typescript
   * const customSettings = await ctx.configs.merge('docs-settings', {
   *   theme: { primaryColor: '#FF0000' }
   * })
   * ```
   */
  async merge<T = Record<string, any>>(
    nameOrRef: string,
    overrides: Partial<T>
  ): Promise<T> {
    const base = await this.get<T>(nameOrRef)
    return deepMerge(base as Record<string, any>, overrides as Record<string, any>) as T
  }
}

/**
 * Get a nested value from an object using dot notation
 *
 * @param obj - Object to get value from
 * @param path - Dot-separated path
 * @returns Value at path or undefined
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * Deep merge two objects
 *
 * @param target - Base object
 * @param source - Object with overrides
 * @returns New merged object
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge objects
      (result as any)[key] = deepMerge(targetValue, sourceValue)
    } else if (sourceValue !== undefined) {
      // Override with source value
      (result as any)[key] = sourceValue
    }
  }

  return result
}
