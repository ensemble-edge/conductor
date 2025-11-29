/**
 * Built-In Members - Public Exports
 *
 * This file exports all built-in agents and the registry for external use.
 *
 * Note: Most agents have been moved to template-based agents that users own and can customize.
 * See: catalog/cloud/cloudflare/templates/agents/system/
 *
 * Only RAG and HITL remain as true built-ins because they require deep framework integration:
 * - RAG: Tight Cloudflare Vectorize and Workers AI embedding integration
 * - HITL: Requires Durable Objects runtime coordination for workflow suspension
 */

// Export registry
export { BuiltInMemberRegistry, getBuiltInRegistry } from './registry.js'

// Export types
export type { BuiltInMemberMetadata, BuiltInMemberFactory, BuiltInMemberEntry } from './types.js'

// Export built-in agents (only those requiring deep framework integration)
export { RAGMember } from './rag/index.js'
export { HITLMember } from './hitl/index.js'

// Export agent-specific types
export type * from './rag/index.js'
export type * from './hitl/index.js'
