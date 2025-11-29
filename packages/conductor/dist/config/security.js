/**
 * Security Configuration
 *
 * Centralized security settings for Conductor API.
 * Controls authentication requirements and execution permissions.
 *
 * This module is designed to be stateless - configuration is passed
 * through Hono context, not stored in global state.
 */
/**
 * Default security configuration
 * Secure by default - requires auth and allows agent execution
 */
export const DEFAULT_SECURITY_CONFIG = {
    requireAuth: true,
    allowDirectAgentExecution: true,
    autoPermissions: false,
    productionEnvironments: ['production', 'prod'],
};
/**
 * Create a security configuration by merging with defaults
 */
export function createSecurityConfig(config = {}) {
    return {
        ...DEFAULT_SECURITY_CONFIG,
        ...config,
    };
}
/**
 * Check if authentication is required for API routes
 */
export function isAuthRequired(config) {
    return config.requireAuth;
}
/**
 * Check if direct agent execution is allowed
 */
export function isDirectAgentExecutionAllowed(config) {
    return config.allowDirectAgentExecution;
}
/**
 * Check if auto-permissions are enabled
 */
export function isAutoPermissionsEnabled(config) {
    return config.autoPermissions;
}
/**
 * Get required permission for a resource
 * Returns null if auto-permissions are disabled
 */
export function getRequiredPermission(config, resourceType, resourceName, action = 'execute') {
    if (!config.autoPermissions) {
        return null;
    }
    return `${resourceType}:${resourceName}:${action}`;
}
/**
 * Check if the given environment name is considered a production environment
 *
 * @param config - Security configuration
 * @param environmentName - The environment name to check (e.g., from ENVIRONMENT env var)
 * @returns true if this environment should be treated as production
 *
 * @example
 * ```typescript
 * // In error handler
 * const config = c.get('securityConfig')
 * const isProduction = isProductionEnvironment(config, env.ENVIRONMENT)
 * if (isProduction) {
 *   // Sanitize error messages
 * }
 * ```
 */
export function isProductionEnvironment(config, environmentName) {
    if (!environmentName) {
        // If no environment is set, default to production behavior (secure by default)
        return true;
    }
    return config.productionEnvironments.includes(environmentName.toLowerCase());
}
/**
 * Get the list of environment names treated as production
 */
export function getProductionEnvironments(config) {
    return config.productionEnvironments;
}
