/**
 * Provider Registry
 *
 * Manages AI provider instances with singleton pattern.
 * Makes it trivial to add new providers without modifying existing code.
 */

import type { AIProvider } from './base-provider.js'
import type { ProviderId } from '../../types/branded.js'
import { OpenAIProvider } from './openai-provider.js'
import { AnthropicProvider } from './anthropic-provider.js'
import { CloudflareProvider } from './cloudflare-provider.js'
import { CustomProvider } from './custom-provider.js'

/**
 * Provider Registry - manages all AI providers
 */
export class ProviderRegistry {
  private providers = new Map<string, AIProvider>()

  constructor() {
    this.registerDefaultProviders()
  }

  /**
   * Register default providers
   */
  private registerDefaultProviders(): void {
    this.register(new OpenAIProvider())
    this.register(new AnthropicProvider())
    this.register(new CloudflareProvider())
    this.register(new CustomProvider())
  }

  /**
   * Register a provider
   */
  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
  }

  /**
   * Get provider by ID
   */
  get(providerId: string): AIProvider | null {
    return this.providers.get(providerId) || null
  }

  /**
   * Check if provider exists
   */
  has(providerId: string): boolean {
    return this.providers.has(providerId)
  }

  /**
   * Get all registered provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values())
  }
}

/**
 * Singleton instance for global use
 */
let globalRegistry: ProviderRegistry | null = null

/**
 * Get global provider registry
 */
export function getProviderRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry()
  }
  return globalRegistry
}

/**
 * Reset global registry (useful for testing)
 */
export function resetProviderRegistry(): void {
  globalRegistry = null
}
