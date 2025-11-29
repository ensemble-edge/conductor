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
    requireAuth: boolean;
    /**
     * Allow direct agent execution via API
     * When true (default), agents can be called directly via /api/v1/execute/agent/:name
     * When false, only ensemble execution is allowed
     */
    allowDirectAgentExecution: boolean;
    /**
     * Automatically require resource-specific permissions
     * When true, executing ensemble:foo requires permission "ensemble:foo:execute"
     * When false, any authenticated user can execute any resource
     */
    autoPermissions: boolean;
    /**
     * Environment names that should be treated as production
     * In production environments:
     * - Error messages are sanitized (no internal details leaked)
     * - Error details are only included for client errors (4xx), not server errors (5xx)
     *
     * @default ['production', 'prod']
     * @example ['production', 'prod', 'live', 'main']
     */
    productionEnvironments: string[];
}
/**
 * Default security configuration
 * Secure by default - requires auth and allows agent execution
 */
export declare const DEFAULT_SECURITY_CONFIG: SecurityConfig;
/**
 * Create a security configuration by merging with defaults
 */
export declare function createSecurityConfig(config?: Partial<SecurityConfig>): SecurityConfig;
/**
 * Check if authentication is required for API routes
 */
export declare function isAuthRequired(config: SecurityConfig): boolean;
/**
 * Check if direct agent execution is allowed
 */
export declare function isDirectAgentExecutionAllowed(config: SecurityConfig): boolean;
/**
 * Check if auto-permissions are enabled
 */
export declare function isAutoPermissionsEnabled(config: SecurityConfig): boolean;
/**
 * Get required permission for a resource
 * Returns null if auto-permissions are disabled
 */
export declare function getRequiredPermission(config: SecurityConfig, resourceType: 'ensemble' | 'agent', resourceName: string, action?: string): string | null;
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
export declare function isProductionEnvironment(config: SecurityConfig, environmentName: string | undefined): boolean;
/**
 * Get the list of environment names treated as production
 */
export declare function getProductionEnvironments(config: SecurityConfig): string[];
//# sourceMappingURL=security.d.ts.map