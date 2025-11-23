/**
 * Common Cache Configuration Types
 *
 * Shared cache configuration interfaces for all agent types
 */
/**
 * Type guard to check if a config has cache support
 */
export function hasCacheConfig(config) {
    return config && typeof config.cache === 'object' && typeof config.cache.enabled === 'boolean';
}
/**
 * Type guard to check if cache warming is enabled
 */
export function isCacheWarmingEnabled(config) {
    if (!hasCacheConfig(config)) {
        return false;
    }
    return config.cache.enabled && (config.cache.warming === true || config.cache.prewarm === true);
}
/**
 * Extract cache config from any agent config
 */
export function getCacheConfig(config) {
    return hasCacheConfig(config) ? config.cache : null;
}
