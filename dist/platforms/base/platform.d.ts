/**
 * Base Platform Adapter - Refactored with Strong Types
 *
 * All platform adapters must implement PlatformAdapter interface.
 * Uses Result types for explicit error handling and strongly-typed platform data.
 */
import type { PlatformModelsData, PlatformCapabilities, ModelValidationResult, ProviderModel, ModelWithProvider, ModelSearchOptions, DataVersion } from '../../types/platform-data.js';
import type { ModelId, ProviderId } from '../../types/branded.js';
/**
 * Platform Adapter interface - all platforms must implement this
 */
export interface PlatformAdapter {
    /** Platform name (e.g., "cloudflare", "vercel") */
    name: string;
    /** Platform adapter version */
    version: string;
    /**
     * Validate a model ID against the platform's model list
     */
    validateModel(modelId: ModelId, provider?: ProviderId): ModelValidationResult;
    /**
     * Get recommended replacement for a deprecated model
     */
    getModelReplacement(modelId: ModelId): ModelId | null;
    /**
     * Check if a model is deprecated
     */
    isModelDeprecated(modelId: ModelId): boolean;
    /**
     * Get all models, optionally filtered
     */
    getModels(provider?: ProviderId, filter?: 'active' | 'deprecated' | 'recommended'): ModelWithProvider[];
    /**
     * Search for models by criteria
     */
    searchModels(options: ModelSearchOptions): ModelWithProvider[];
    /**
     * Get platform capabilities
     */
    getCapabilities(): PlatformCapabilities;
    /**
     * Get platform data version
     */
    getDataVersion(): DataVersion;
}
/**
 * Base Platform Adapter implementation
 * Provides common functionality for all platforms
 */
export declare abstract class BasePlatform implements PlatformAdapter {
    abstract name: string;
    abstract version: string;
    protected modelsData: PlatformModelsData;
    protected capabilitiesData: PlatformCapabilities;
    constructor(modelsData: PlatformModelsData, capabilitiesData: PlatformCapabilities);
    /**
     * Validate a model with proper error handling
     */
    validateModel(modelId: ModelId, provider?: ProviderId): ModelValidationResult;
    /**
     * Get recommended replacement for a deprecated model
     */
    getModelReplacement(modelId: ModelId): ModelId | null;
    /**
     * Check if a model is deprecated
     */
    isModelDeprecated(modelId: ModelId): boolean;
    /**
     * Get all models, optionally filtered
     */
    getModels(provider?: ProviderId, filter?: 'active' | 'deprecated' | 'recommended'): ModelWithProvider[];
    /**
     * Search for models by criteria
     */
    searchModels(options: ModelSearchOptions): ModelWithProvider[];
    /**
     * Get platform capabilities
     */
    getCapabilities(): PlatformCapabilities;
    /**
     * Get platform data version
     */
    getDataVersion(): DataVersion;
    /**
     * Find a model by ID across all providers
     */
    protected findModel(modelId: ModelId, providerFilter?: ProviderId): ProviderModel | null;
    /**
     * Get the provider for a given model ID
     */
    protected getProviderForModel(modelId: ModelId): ProviderId | null;
}
//# sourceMappingURL=platform.d.ts.map