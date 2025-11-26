/**
 * Security Configuration
 *
 * Centralized security settings for Conductor API.
 * Controls authentication requirements and execution permissions.
 */

/**
 * Security configuration options
 */
export interface SecurityConfig {
  /**
   * Require authentication on /api/* routes
   * When true (default), all API routes return 401 without valid auth
   * When false, allows anonymous access (insecure, use only for development)
   */
  requireAuth: boolean

  /**
   * Allow direct agent execution via API
   * When true (default), agents can be called directly via /api/v1/execute/agent/:name
   * When false, only ensemble execution is allowed
   */
  allowDirectAgentExecution: boolean

  /**
   * Automatically require resource-specific permissions
   * When true, executing ensemble:foo requires permission "ensemble:foo:execute"
   * When false, any authenticated user can execute any resource
   */
  autoPermissions: boolean
}

/**
 * Default security configuration
 * Secure by default - requires auth and allows agent execution
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireAuth: true,
  allowDirectAgentExecution: true,
  autoPermissions: false,
}

// Global security config (set at startup)
let securityConfig: SecurityConfig = { ...DEFAULT_SECURITY_CONFIG }

/**
 * Initialize security configuration
 * Called during app startup with config from environment/file
 */
export function initSecurityConfig(config: Partial<SecurityConfig> = {}): void {
  securityConfig = {
    ...DEFAULT_SECURITY_CONFIG,
    ...config,
  }
}

/**
 * Get current security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return securityConfig
}

/**
 * Check if authentication is required for API routes
 */
export function isAuthRequired(): boolean {
  return securityConfig.requireAuth
}

/**
 * Check if direct agent execution is allowed
 */
export function isDirectAgentExecutionAllowed(): boolean {
  return securityConfig.allowDirectAgentExecution
}

/**
 * Check if auto-permissions are enabled
 */
export function isAutoPermissionsEnabled(): boolean {
  return securityConfig.autoPermissions
}

/**
 * Get required permission for a resource
 * Returns null if auto-permissions are disabled
 */
export function getRequiredPermission(
  resourceType: 'ensemble' | 'agent',
  resourceName: string,
  action: string = 'execute'
): string | null {
  if (!securityConfig.autoPermissions) {
    return null
  }
  return `${resourceType}:${resourceName}:${action}`
}
