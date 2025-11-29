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

  /**
   * Environment names that should be treated as production
   * In production environments:
   * - Error messages are sanitized (no internal details leaked)
   * - Error details are only included for client errors (4xx), not server errors (5xx)
   *
   * @default ['production', 'prod']
   * @example ['production', 'prod', 'live', 'main']
   */
  productionEnvironments: string[]
}

/**
 * Default security configuration
 * Secure by default - requires auth and allows agent execution
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  requireAuth: true,
  allowDirectAgentExecution: true,
  autoPermissions: false,
  productionEnvironments: ['production', 'prod'],
}

/**
 * Create a security configuration by merging with defaults
 */
export function createSecurityConfig(config: Partial<SecurityConfig> = {}): SecurityConfig {
  return {
    ...DEFAULT_SECURITY_CONFIG,
    ...config,
  }
}

/**
 * Check if authentication is required for API routes
 */
export function isAuthRequired(config: SecurityConfig): boolean {
  return config.requireAuth
}

/**
 * Check if direct agent execution is allowed
 */
export function isDirectAgentExecutionAllowed(config: SecurityConfig): boolean {
  return config.allowDirectAgentExecution
}

/**
 * Check if auto-permissions are enabled
 */
export function isAutoPermissionsEnabled(config: SecurityConfig): boolean {
  return config.autoPermissions
}

/**
 * Get required permission for a resource
 * Returns null if auto-permissions are disabled
 */
export function getRequiredPermission(
  config: SecurityConfig,
  resourceType: 'ensemble' | 'agent',
  resourceName: string,
  action: string = 'execute'
): string | null {
  if (!config.autoPermissions) {
    return null
  }
  return `${resourceType}:${resourceName}:${action}`
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
export function isProductionEnvironment(
  config: SecurityConfig,
  environmentName: string | undefined
): boolean {
  if (!environmentName) {
    // If no environment is set, default to production behavior (secure by default)
    return true
  }
  return config.productionEnvironments.includes(environmentName.toLowerCase())
}

/**
 * Get the list of environment names treated as production
 */
export function getProductionEnvironments(config: SecurityConfig): string[] {
  return config.productionEnvironments
}
