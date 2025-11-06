/**
 * Provider Registry
 *
 * Manages AI provider instances with singleton pattern.
 * Makes it trivial to add new providers without modifying existing code.
 */
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { CloudflareProvider } from './cloudflare-provider.js';
import { CustomProvider } from './custom-provider.js';
/**
 * Provider Registry - manages all AI providers
 */
export class ProviderRegistry {
    constructor() {
        this.providers = new Map();
        this.registerDefaultProviders();
    }
    /**
     * Register default providers
     */
    registerDefaultProviders() {
        this.register(new OpenAIProvider());
        this.register(new AnthropicProvider());
        this.register(new CloudflareProvider());
        this.register(new CustomProvider());
    }
    /**
     * Register a provider
     */
    register(provider) {
        this.providers.set(provider.id, provider);
    }
    /**
     * Get provider by ID
     */
    get(providerId) {
        return this.providers.get(providerId) || null;
    }
    /**
     * Check if provider exists
     */
    has(providerId) {
        return this.providers.has(providerId);
    }
    /**
     * Get all registered provider IDs
     */
    getProviderIds() {
        return Array.from(this.providers.keys());
    }
    /**
     * Get all registered providers
     */
    getAllProviders() {
        return Array.from(this.providers.values());
    }
}
/**
 * Singleton instance for global use
 */
let globalRegistry = null;
/**
 * Get global provider registry
 */
export function getProviderRegistry() {
    if (!globalRegistry) {
        globalRegistry = new ProviderRegistry();
    }
    return globalRegistry;
}
/**
 * Reset global registry (useful for testing)
 */
export function resetProviderRegistry() {
    globalRegistry = null;
}
