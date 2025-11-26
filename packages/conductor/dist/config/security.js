/**
 * Security Configuration
 *
 * Centralized security settings for Conductor API.
 * Controls authentication requirements and execution permissions.
 */
/**
 * Default security configuration
 * Secure by default - requires auth and allows agent execution
 */
export const DEFAULT_SECURITY_CONFIG = {
    requireAuth: true,
    allowDirectAgentExecution: true,
    autoPermissions: false,
};
// Global security config (set at startup)
let securityConfig = { ...DEFAULT_SECURITY_CONFIG };
/**
 * Initialize security configuration
 * Called during app startup with config from environment/file
 */
export function initSecurityConfig(config = {}) {
    securityConfig = {
        ...DEFAULT_SECURITY_CONFIG,
        ...config,
    };
}
/**
 * Get current security configuration
 */
export function getSecurityConfig() {
    return securityConfig;
}
/**
 * Check if authentication is required for API routes
 */
export function isAuthRequired() {
    return securityConfig.requireAuth;
}
/**
 * Check if direct agent execution is allowed
 */
export function isDirectAgentExecutionAllowed() {
    return securityConfig.allowDirectAgentExecution;
}
/**
 * Check if auto-permissions are enabled
 */
export function isAutoPermissionsEnabled() {
    return securityConfig.autoPermissions;
}
/**
 * Get required permission for a resource
 * Returns null if auto-permissions are disabled
 */
export function getRequiredPermission(resourceType, resourceName, action = 'execute') {
    if (!securityConfig.autoPermissions) {
        return null;
    }
    return `${resourceType}:${resourceName}:${action}`;
}
