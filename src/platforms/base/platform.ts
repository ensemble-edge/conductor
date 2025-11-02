/**
 * Base Platform Adapter - Refactored with Strong Types
 *
 * All platform adapters must implement PlatformAdapter interface.
 * Uses Result types for explicit error handling and strongly-typed platform data.
 */

import type {
	PlatformModelsData,
	PlatformCapabilities,
	ModelValidationResult,
	ValidationResult,
	ProviderModel,
	ModelWithProvider,
	ModelSearchOptions,
	DataVersion
} from '../../types/platform-data';
import type { ModelId, ProviderId } from '../../types/branded';
import { ModelValidation } from '../../types/platform-data';
import { Result } from '../../types/result';
import { Errors, ModelNotFoundError, ModelDeprecatedError, ModelEOLError } from '../../errors/error-types';

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
export abstract class BasePlatform implements PlatformAdapter {
	abstract name: string;
	abstract version: string;

	protected modelsData: PlatformModelsData;
	protected capabilitiesData: PlatformCapabilities;

	constructor(modelsData: PlatformModelsData, capabilitiesData: PlatformCapabilities) {
		this.modelsData = modelsData;
		this.capabilitiesData = capabilitiesData;
	}

	/**
	 * Validate a model with proper error handling
	 */
	validateModel(modelId: ModelId, provider?: ProviderId): ModelValidationResult {
		const model = this.findModel(modelId, provider);

		if (!model) {
			return {
				valid: false,
				isDeprecated: false,
				errors: [`Model "${modelId}" not found in platform data`],
				warnings: []
			};
		}

		const result: ModelValidationResult = {
			valid: true,
			model,
			isDeprecated: ModelValidation.isDeprecated(model),
			errors: [],
			warnings: []
		};

		// Check deprecation status
		if (result.isDeprecated) {
			if (model.deprecatedReason) {
				result.warnings.push(
					`Model "${modelId}" is deprecated: ${model.deprecatedReason}`
				);
			} else {
				result.warnings.push(`Model "${modelId}" is deprecated`);
			}

			// Add replacement recommendation
			if (model.replacementModel) {
				result.replacement = model.replacementModel;
				result.warnings.push(
					`Recommended replacement: ${model.replacementModel}`
				);
			}

			// Check end of life
			if (model.endOfLife) {
				const daysUntilEOL = ModelValidation.getDaysUntilEOL(model);

				if (daysUntilEOL !== null) {
					result.daysUntilEOL = daysUntilEOL;

					if (daysUntilEOL <= 0) {
						result.errors.push(
							`Model "${modelId}" has reached end of life (${model.endOfLife})`
						);
						result.valid = false;
					} else if (daysUntilEOL <= 30) {
						result.warnings.push(
							`Model will reach end of life in ${daysUntilEOL} days (${model.endOfLife})`
						);
					}
				}
			}
		}

		return result;
	}

	/**
	 * Get recommended replacement for a deprecated model
	 */
	getModelReplacement(modelId: ModelId): ModelId | null {
		const model = this.findModel(modelId);
		return model?.replacementModel || null;
	}

	/**
	 * Check if a model is deprecated
	 */
	isModelDeprecated(modelId: ModelId): boolean {
		const model = this.findModel(modelId);
		return model ? ModelValidation.isDeprecated(model) : false;
	}

	/**
	 * Get all models, optionally filtered
	 */
	getModels(
		provider?: ProviderId,
		filter?: 'active' | 'deprecated' | 'recommended'
	): ModelWithProvider[] {
		const providers = provider
			? { [provider]: this.modelsData.providers[provider] }
			: this.modelsData.providers;

		const models: ModelWithProvider[] = [];

		for (const [providerName, providerData] of Object.entries(providers)) {
			if (!providerData || !providerData.models) continue;

			for (const model of providerData.models) {
				// Apply filters
				if (filter === 'active' && !ModelValidation.isActive(model)) continue;
				if (filter === 'deprecated' && !ModelValidation.isDeprecated(model)) continue;
				if (filter === 'recommended' && !ModelValidation.isRecommended(model)) continue;

				models.push({
					...model,
					provider: providerName as ProviderId
				});
			}
		}

		return models;
	}

	/**
	 * Search for models by criteria
	 */
	searchModels(options: ModelSearchOptions): ModelWithProvider[] {
		let models = this.getModels(options.provider, options.filter);

		// Filter by minimum context window
		if (options.minContextWindow) {
			models = models.filter(m =>
				ModelValidation.meetsContextWindow(m, options.minContextWindow!)
			);
		}

		// Filter by capabilities
		if (options.capabilities && options.capabilities.length > 0) {
			models = models.filter(m =>
				ModelValidation.hasAllCapabilities(m, options.capabilities!)
			);
		}

		return models;
	}

	/**
	 * Get platform capabilities
	 */
	getCapabilities(): PlatformCapabilities {
		return this.capabilitiesData;
	}

	/**
	 * Get platform data version
	 */
	getDataVersion(): DataVersion {
		return {
			version: this.modelsData.version,
			lastUpdated: this.modelsData.lastUpdated
		};
	}

	/**
	 * Find a model by ID across all providers
	 */
	protected findModel(modelId: ModelId, providerFilter?: ProviderId): ProviderModel | null {
		const providers = providerFilter
			? { [providerFilter]: this.modelsData.providers[providerFilter] }
			: this.modelsData.providers;

		for (const providerData of Object.values(providers)) {
			if (!providerData || !providerData.models) continue;

			const model = providerData.models.find(m => m.id === modelId);
			if (model) return model;
		}

		return null;
	}

	/**
	 * Get the provider for a given model ID
	 */
	protected getProviderForModel(modelId: ModelId): ProviderId | null {
		for (const [providerName, providerData] of Object.entries(this.modelsData.providers)) {
			if (!providerData || !providerData.models) continue;

			const model = providerData.models.find(m => m.id === modelId);
			if (model) return providerName as ProviderId;
		}

		return null;
	}
}
