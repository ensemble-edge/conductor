/**
 * Provider Registry
 *
 * Manages AI provider instances with singleton pattern.
 * Makes it trivial to add new providers without modifying existing code.
 */
import type { AIProvider } from './base-provider.js';
/**
 * Provider Registry - manages all AI providers
 */
export declare class ProviderRegistry {
    private providers;
    constructor();
    /**
     * Register default providers
     */
    private registerDefaultProviders;
    /**
     * Register a provider
     */
    register(provider: AIProvider): void;
    /**
     * Get provider by ID
     */
    get(providerId: string): AIProvider | null;
    /**
     * Check if provider exists
     */
    has(providerId: string): boolean;
    /**
     * Get all registered provider IDs
     */
    getProviderIds(): string[];
    /**
     * Get all registered providers
     */
    getAllProviders(): AIProvider[];
}
/**
 * Get global provider registry
 */
export declare function getProviderRegistry(): ProviderRegistry;
/**
 * Reset global registry (useful for testing)
 */
export declare function resetProviderRegistry(): void;
//# sourceMappingURL=registry.d.ts.map