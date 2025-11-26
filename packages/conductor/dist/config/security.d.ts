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
}
/**
 * Default security configuration
 * Secure by default - requires auth and allows agent execution
 */
export declare const DEFAULT_SECURITY_CONFIG: SecurityConfig;
/**
 * Initialize security configuration
 * Called during app startup with config from environment/file
 */
export declare function initSecurityConfig(config?: Partial<SecurityConfig>): void;
/**
 * Get current security configuration
 */
export declare function getSecurityConfig(): SecurityConfig;
/**
 * Check if authentication is required for API routes
 */
export declare function isAuthRequired(): boolean;
/**
 * Check if direct agent execution is allowed
 */
export declare function isDirectAgentExecutionAllowed(): boolean;
/**
 * Check if auto-permissions are enabled
 */
export declare function isAutoPermissionsEnabled(): boolean;
/**
 * Get required permission for a resource
 * Returns null if auto-permissions are disabled
 */
export declare function getRequiredPermission(resourceType: 'ensemble' | 'agent', resourceName: string, action?: string): string | null;
//# sourceMappingURL=security.d.ts.map