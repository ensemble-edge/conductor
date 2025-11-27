/**
 * Config Component Registry
 *
 * Provides typed access to config components.
 * Wraps the ComponentRegistry for config-specific operations.
 *
 * @module components/configs
 */
import { type ComponentRegistry } from './registry.js';
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
export declare class ConfigRegistry {
    private parent;
    constructor(parent: ComponentRegistry);
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
    get<T = Record<string, any>>(nameOrRef: string): Promise<T>;
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
    getValue<T = any>(nameOrRef: string, path: string): Promise<T | undefined>;
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
    getValueOrDefault<T>(nameOrRef: string, path: string, defaultValue: T): Promise<T>;
    /**
     * Check if a config component exists
     *
     * @param nameOrRef - Config name with optional version
     * @returns True if config exists
     */
    exists(nameOrRef: string): Promise<boolean>;
    /**
     * Check if a config has a specific path
     *
     * @param nameOrRef - Config name with optional version
     * @param path - Dot-separated path to check
     * @returns True if path exists
     */
    hasPath(nameOrRef: string, path: string): Promise<boolean>;
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
    merge<T = Record<string, any>>(nameOrRef: string, overrides: Partial<T>): Promise<T>;
}
//# sourceMappingURL=configs.d.ts.map