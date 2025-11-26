/**
 * Permission Utilities
 *
 * Industry-standard permission checking with wildcard support.
 * Compatible with OAuth 2.0 / RBAC permission patterns.
 *
 * Permission format: {resource}:{name}:{action}
 * Examples:
 *   - ensemble:invoice-pdf:execute
 *   - agent:http:execute
 *   - ensemble:*:execute (wildcard)
 *   - * (superuser)
 */
/**
 * Check if user has the required permission
 *
 * Supports wildcards:
 *   - "*" matches everything (superuser)
 *   - "ensemble:*" matches all ensemble permissions
 *   - "ensemble:*:execute" matches execute on any ensemble
 *   - "ensemble:billing-*:execute" matches pattern
 *
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermission - The permission required for the action
 * @returns true if user has permission
 */
export declare function hasPermission(userPermissions: string[], requiredPermission: string): boolean;
/**
 * Check if user has ANY of the required permissions
 */
export declare function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean;
/**
 * Check if user has ALL of the required permissions
 */
export declare function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean;
/**
 * Get missing permissions from required set
 */
export declare function getMissingPermissions(userPermissions: string[], requiredPermissions: string[]): string[];
/**
 * Normalize permission string (lowercase, trim)
 */
export declare function normalizePermission(permission: string): string;
/**
 * Validate permission format
 * Returns true if permission follows the resource:name:action pattern
 */
export declare function isValidPermissionFormat(permission: string): boolean;
/**
 * Parse a permission string into its components
 */
export declare function parsePermission(permission: string): {
    resource: string;
    name: string;
    action: string;
} | null;
/**
 * Build a permission string from components
 */
export declare function buildPermission(resource: string, name: string, action?: string): string;
//# sourceMappingURL=permissions.d.ts.map