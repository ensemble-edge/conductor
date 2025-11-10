/**
 * @ensemble-edge/conductor/cloudflare
 *
 * Cloudflare Workers-specific exports
 *
 * Import from this module when you need Cloudflare-specific features
 * like Durable Objects for stateful workflows.
 *
 * @example
 * ```typescript
 * // In your Cloudflare Workers project
 * import { ExecutionState, HITLState } from '@ensemble-edge/conductor/cloudflare';
 *
 * export { ExecutionState, HITLState };
 * ```
 */

// Re-export everything from main index
export * from './index.js'

// Durable Objects (require Cloudflare Workers environment)
export { ExecutionState } from './durable-objects/execution-state.js'
export { HITLState } from './durable-objects/hitl-state.js'

// Cloudflare-specific platform utilities
export * from './platforms/cloudflare/index.js'
