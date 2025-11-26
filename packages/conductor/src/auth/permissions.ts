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
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // No permissions required
  if (!requiredPermission) {
    return true
  }

  // No user permissions
  if (!userPermissions || userPermissions.length === 0) {
    return false
  }

  // Check each user permission
  for (const userPerm of userPermissions) {
    if (matchesPermission(userPerm, requiredPermission)) {
      return true
    }
  }

  return false
}

/**
 * Check if a single user permission matches the required permission
 */
function matchesPermission(userPerm: string, required: string): boolean {
  // Exact match
  if (userPerm === required) {
    return true
  }

  // Superuser wildcard
  if (userPerm === '*') {
    return true
  }

  // Parse permissions into parts
  const userParts = userPerm.split(':')
  const requiredParts = required.split(':')

  // Category-level wildcard (e.g., "ensemble:*" matches "ensemble:foo:execute")
  if (userParts.length === 2 && userParts[1] === '*') {
    return requiredParts[0] === userParts[0]
  }

  // Three-part permission matching with wildcards
  if (userParts.length === 3 && requiredParts.length === 3) {
    const [userResource, userName, userAction] = userParts
    const [reqResource, reqName, reqAction] = requiredParts

    // Resource must match
    if (userResource !== reqResource && userResource !== '*') {
      return false
    }

    // Action must match (or wildcard)
    if (userAction !== reqAction && userAction !== '*') {
      return false
    }

    // Name matching with glob-style wildcards
    if (userName === '*') {
      return true
    }

    // Pattern matching (e.g., "billing-*" matches "billing-invoice")
    if (userName.includes('*')) {
      return matchesGlob(userName, reqName)
    }

    // Exact name match
    return userName === reqName
  }

  return false
}

/**
 * Simple glob-style pattern matching
 * Supports * as wildcard for any characters
 *
 * Examples:
 *   - "billing-*" matches "billing-invoice", "billing-receipt"
 *   - "*-pdf" matches "invoice-pdf", "report-pdf"
 *   - "report-*-v2" matches "report-monthly-v2"
 */
function matchesGlob(pattern: string, value: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
    .replace(/\*/g, '.*') // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(value)
}

/**
 * Check if user has ANY of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((perm) => hasPermission(userPermissions, perm))
}

/**
 * Check if user has ALL of the required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((perm) => hasPermission(userPermissions, perm))
}

/**
 * Get missing permissions from required set
 */
export function getMissingPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): string[] {
  return requiredPermissions.filter((perm) => !hasPermission(userPermissions, perm))
}

/**
 * Normalize permission string (lowercase, trim)
 */
export function normalizePermission(permission: string): string {
  return permission.toLowerCase().trim()
}

/**
 * Validate permission format
 * Returns true if permission follows the resource:name:action pattern
 */
export function isValidPermissionFormat(permission: string): boolean {
  // Superuser wildcard is valid
  if (permission === '*') {
    return true
  }

  const parts = permission.split(':')

  // Two-part (category wildcard) or three-part (full permission)
  if (parts.length < 2 || parts.length > 3) {
    return false
  }

  // Each part must be non-empty
  return parts.every((part) => part.length > 0)
}

/**
 * Parse a permission string into its components
 */
export function parsePermission(permission: string): {
  resource: string
  name: string
  action: string
} | null {
  if (permission === '*') {
    return { resource: '*', name: '*', action: '*' }
  }

  const parts = permission.split(':')

  if (parts.length === 2) {
    return { resource: parts[0], name: parts[1], action: '*' }
  }

  if (parts.length === 3) {
    return { resource: parts[0], name: parts[1], action: parts[2] }
  }

  return null
}

/**
 * Build a permission string from components
 */
export function buildPermission(
  resource: string,
  name: string,
  action: string = 'execute'
): string {
  return `${resource}:${name}:${action}`
}
