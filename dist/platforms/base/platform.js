/**
 * Base Platform Adapter - Refactored with Strong Types
 *
 * All platform adapters must implement PlatformAdapter interface.
 * Uses Result types for explicit error handling and strongly-typed platform data.
 */
import { ModelValidation } from '../../types/platform-data';
/**
 * Base Platform Adapter implementation
 * Provides common functionality for all platforms
 */
export class BasePlatform {
    constructor(modelsData, capabilitiesData) {
        this.modelsData = modelsData;
        this.capabilitiesData = capabilitiesData;
    }
    /**
     * Validate a model with proper error handling
     */
    validateModel(modelId, provider) {
        const model = this.findModel(modelId, provider);
        if (!model) {
            return {
                valid: false,
                isDeprecated: false,
                errors: [`Model "${modelId}" not found in platform data`],
                warnings: [],
            };
        }
        const result = {
            valid: true,
            model,
            isDeprecated: ModelValidation.isDeprecated(model),
            errors: [],
            warnings: [],
        };
        // Check deprecation status
        if (result.isDeprecated) {
            if (model.deprecatedReason) {
                result.warnings.push(`Model "${modelId}" is deprecated: ${model.deprecatedReason}`);
            }
            else {
                result.warnings.push(`Model "${modelId}" is deprecated`);
            }
            // Add replacement recommendation
            if (model.replacementModel) {
                result.replacement = model.replacementModel;
                result.warnings.push(`Recommended replacement: ${model.replacementModel}`);
            }
            // Check end of life
            if (model.endOfLife) {
                const daysUntilEOL = ModelValidation.getDaysUntilEOL(model);
                if (daysUntilEOL !== null) {
                    result.daysUntilEOL = daysUntilEOL;
                    if (daysUntilEOL <= 0) {
                        result.errors.push(`Model "${modelId}" has reached end of life (${model.endOfLife})`);
                        result.valid = false;
                    }
                    else if (daysUntilEOL <= 30) {
                        result.warnings.push(`Model will reach end of life in ${daysUntilEOL} days (${model.endOfLife})`);
                    }
                }
            }
        }
        return result;
    }
    /**
     * Get recommended replacement for a deprecated model
     */
    getModelReplacement(modelId) {
        const model = this.findModel(modelId);
        return model?.replacementModel || null;
    }
    /**
     * Check if a model is deprecated
     */
    isModelDeprecated(modelId) {
        const model = this.findModel(modelId);
        return model ? ModelValidation.isDeprecated(model) : false;
    }
    /**
     * Get all models, optionally filtered
     */
    getModels(provider, filter) {
        const providers = provider
            ? { [provider]: this.modelsData.providers[provider] }
            : this.modelsData.providers;
        const models = [];
        for (const [providerName, providerData] of Object.entries(providers)) {
            if (!providerData || !providerData.models)
                continue;
            for (const model of providerData.models) {
                // Apply filters
                if (filter === 'active' && !ModelValidation.isActive(model))
                    continue;
                if (filter === 'deprecated' && !ModelValidation.isDeprecated(model))
                    continue;
                if (filter === 'recommended' && !ModelValidation.isRecommended(model))
                    continue;
                models.push({
                    ...model,
                    provider: providerName,
                });
            }
        }
        return models;
    }
    /**
     * Search for models by criteria
     */
    searchModels(options) {
        let models = this.getModels(options.provider, options.filter);
        // Filter by minimum context window
        if (options.minContextWindow) {
            models = models.filter((m) => ModelValidation.meetsContextWindow(m, options.minContextWindow));
        }
        // Filter by capabilities
        if (options.capabilities && options.capabilities.length > 0) {
            models = models.filter((m) => ModelValidation.hasAllCapabilities(m, options.capabilities));
        }
        return models;
    }
    /**
     * Get platform capabilities
     */
    getCapabilities() {
        return this.capabilitiesData;
    }
    /**
     * Get platform data version
     */
    getDataVersion() {
        return {
            version: this.modelsData.version,
            lastUpdated: this.modelsData.lastUpdated,
        };
    }
    /**
     * Find a model by ID across all providers
     */
    findModel(modelId, providerFilter) {
        const providers = providerFilter
            ? { [providerFilter]: this.modelsData.providers[providerFilter] }
            : this.modelsData.providers;
        for (const providerData of Object.values(providers)) {
            if (!providerData || !providerData.models)
                continue;
            const model = providerData.models.find((m) => m.id === modelId);
            if (model)
                return model;
        }
        return null;
    }
    /**
     * Get the provider for a given model ID
     */
    getProviderForModel(modelId) {
        for (const [providerName, providerData] of Object.entries(this.modelsData.providers)) {
            if (!providerData || !providerData.models)
                continue;
            const model = providerData.models.find((m) => m.id === modelId);
            if (model)
                return providerName;
        }
        return null;
    }
}
