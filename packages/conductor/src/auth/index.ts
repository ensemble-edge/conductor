/**
 * Authentication System
 *
 * Unified authentication for all routes with multiple methods
 */

// Export types
export * from './types.js'

// Export providers
export * from './providers/bearer.js'
export * from './providers/apikey.js'
export * from './providers/cookie.js'
export * from './providers/unkey.js'
export * from './providers/custom.js'
export * from './providers/signature.js'
export * from './providers/basic.js'

// Export trigger auth bridge
export * from './trigger-auth.js'

// Export permission utilities
export * from './permissions.js'
