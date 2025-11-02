/**
 * Base Platform Adapter Interface
 *
 * All platform adapters must implement this interface to provide
 * platform-specific functionality (AI, storage, deployment)
 */

import type { ModelValidationResult, ValidationResult } from './types';

export interface PlatformAdapter {
	/** Platform name (e.g., "cloudflare", "vercel") */
	name: string;

	/** Platform adapter version */
	version: string;

	/**
	 * Validate a model ID against the platform's model list
	 * @param modelId - Model ID to validate
	 * @param provider - Optional provider filter
	 * @returns Validation result with model info and deprecation status
	 */
	validateModel(modelId: string, provider?: string): ModelValidationResult;

	/**
	 * Get recommended replacement for a deprecated model
	 * @param modelId - Deprecated model ID
	 * @returns Replacement model ID or null if no replacement
	 */
	getModelReplacement(modelId: string): string | null;

	/**
	 * Check if a model is deprecated
	 * @param modelId - Model ID to check
	 * @returns True if deprecated
	 */
	isModelDeprecated(modelId: string): boolean;

	/**
	 * Get all models for a provider
	 * @param provider - Provider name (e.g., "openai", "anthropic", "cloudflare-ai")
	 * @param filter - Optional filter (active, deprecated, recommended)
	 * @returns Array of models
	 */
	getModels(provider?: string, filter?: 'active' | 'deprecated' | 'recommended'): any[];

	/**
	 * Get platform capabilities
	 * @returns Platform capabilities object
	 */
	getCapabilities(): any;

	/**
	 * Get platform data version
	 * @returns Version string and last updated timestamp
	 */
	getDataVersion(): { version: string; lastUpdated: string };
}

/**
 * Base Platform Adapter implementation
 * Provides common functionality for all platforms
 */
export abstract class BasePlatform implements PlatformAdapter {
	abstract name: string;
	abstract version: string;

	protected modelsData: any;
	protected capabilitiesData: any;

	constructor(modelsData: any, capabilitiesData: any) {
		this.modelsData = modelsData;
		this.capabilitiesData = capabilitiesData;
	}

	validateModel(modelId: string, provider?: string): ModelValidationResult {
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
			isDeprecated: model.status === 'deprecated',
			errors: [],
			warnings: []
		};

		if (model.status === 'deprecated') {
			result.warnings.push(
				`Model "${modelId}" is deprecated. ${model.deprecatedReason || ''}`
			);

			if (model.replacementModel) {
				result.replacement = model.replacementModel;
				result.warnings.push(`Recommended replacement: ${model.replacementModel}`);
			}

			if (model.endOfLife) {
				const eolDate = new Date(model.endOfLife);
				const now = new Date();
				const daysUntilEOL = Math.floor(
					(eolDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				);

				result.daysUntilEOL = daysUntilEOL;

				if (daysUntilEOL <= 0) {
					result.errors.push(`Model "${modelId}" has reached end of life`);
					result.valid = false;
				} else if (daysUntilEOL <= 30) {
					result.warnings.push(
						`Model will reach end of life in ${daysUntilEOL} days (${model.endOfLife})`
					);
				}
			}
		}

		return result;
	}

	getModelReplacement(modelId: string): string | null {
		const model = this.findModel(modelId);
		return model?.replacementModel || null;
	}

	isModelDeprecated(modelId: string): boolean {
		const model = this.findModel(modelId);
		return model?.status === 'deprecated';
	}

	getModels(provider?: string, filter?: 'active' | 'deprecated' | 'recommended'): any[] {
		const providers = provider
			? { [provider]: this.modelsData.providers[provider] }
			: this.modelsData.providers;

		const models: any[] = [];

		for (const [providerName, providerData] of Object.entries(providers)) {
			if (!providerData || !(providerData as any).models) continue;

			for (const model of (providerData as any).models) {
				if (filter === 'active' && model.status !== 'active') continue;
				if (filter === 'deprecated' && model.status !== 'deprecated') continue;
				if (filter === 'recommended' && !model.recommended) continue;

				models.push({
					...model,
					provider: providerName
				});
			}
		}

		return models;
	}

	getCapabilities(): any {
		return this.capabilitiesData;
	}

	getDataVersion(): { version: string; lastUpdated: string } {
		return {
			version: this.modelsData.version,
			lastUpdated: this.modelsData.lastUpdated
		};
	}

	/**
	 * Find a model by ID across all providers
	 * @param modelId - Model ID to find
	 * @param providerFilter - Optional provider filter
	 * @returns Model object or null
	 */
	protected findModel(modelId: string, providerFilter?: string): any {
		const providers = providerFilter
			? { [providerFilter]: this.modelsData.providers[providerFilter] }
			: this.modelsData.providers;

		for (const providerData of Object.values(providers)) {
			if (!providerData || !(providerData as any).models) continue;

			const model = (providerData as any).models.find((m: any) => m.id === modelId);
			if (model) return model;
		}

		return null;
	}
}
