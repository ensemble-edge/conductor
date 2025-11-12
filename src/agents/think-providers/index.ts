/**
 * Think Providers - Composition-based AI Provider System
 *
 * Exports all provider types and registry.
 * Makes it trivial to add new AI providers without modifying existing code.
 */

// Base types and interfaces
export type {
  AIMessage,
  AIProvider,
  AIProviderConfig,
  AIProviderRequest,
  AIProviderResponse,
} from './base-provider.js'

export { BaseAIProvider } from './base-provider.js'

// Provider implementations
export { OpenAIProvider } from './openai-provider.js'
export { AnthropicProvider } from './anthropic-provider.js'
export { CloudflareProvider } from './cloudflare-provider.js'
export { CustomProvider } from './custom-provider.js'

// Registry
export { ProviderRegistry, getProviderRegistry, resetProviderRegistry } from './registry.js'
