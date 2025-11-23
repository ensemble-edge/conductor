/**
 * Plugin System Types
 *
 * Defines the plugin architecture for Conductor.
 * Supports two patterns:
 * 1. Functional plugins - Simple config transformers
 * 2. Lifecycle plugins - Complex plugins with async initialization
 */
/**
 * Type guard to check if plugin is lifecycle-based
 */
export function isLifecyclePlugin(plugin) {
    return typeof plugin === 'object' && 'initialize' in plugin;
}
/**
 * Type guard to check if plugin is functional
 */
export function isFunctionalPlugin(plugin) {
    return typeof plugin === 'function';
}
/**
 * Plugin builder helper for functional plugins
 *
 * @example
 * ```typescript
 * export const myPlugin = buildPlugin((options: Options) => (config) => {
 *   // Transform config
 *   return config
 * })
 * ```
 */
export function buildPlugin(factory) {
    return factory;
}
