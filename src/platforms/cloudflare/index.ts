/**
 * Cloudflare Platform Adapter
 *
 * Provides Cloudflare Workers-specific platform functionality
 */

import { BasePlatform } from '../base/platform';
import type { ModelValidationResult } from '../base/types';

/**
 * Cloudflare Platform Adapter
 *
 * Loads and validates against Cloudflare platform data including:
 * - Workers AI models (platform-native, edge-hosted)
 * - OpenAI models (via AI Gateway or direct)
 * - Anthropic models (via AI Gateway or direct)
 * - Groq models (via AI Gateway or direct)
 *
 * Supports three routing modes:
 * - cloudflare: Platform-native Workers AI
 * - cloudflare-gateway: External providers via AI Gateway
 * - direct: Direct API calls to external providers
 */
export class CloudflarePlatform extends BasePlatform {
	name = 'cloudflare';
	version = '1.0.0';

	constructor(modelsData: any, capabilitiesData: any) {
		super(modelsData, capabilitiesData);
	}

	/**
	 * Validate a model specifically for Cloudflare context
	 * Considers Workers AI, AI Gateway, and direct API access
	 */
	validateModel(modelId: string, provider?: string): ModelValidationResult {
		// Use base validation logic
		const result = super.validateModel(modelId, provider);

		// Add Cloudflare-specific context to warnings
		if (result.model) {
			const modelProvider = this.getProviderForModel(modelId);

			if (modelProvider === 'workers-ai') {
				// Workers AI models require AI binding
				if (!result.warnings.some((w) => w.includes('binding'))) {
					result.warnings.push(
						'Workers AI models require AI binding in wrangler.toml'
					);
				}
			} else if (modelProvider === 'openai' || modelProvider === 'anthropic' || modelProvider === 'groq') {
				// External models can use AI Gateway or direct API
				if (!result.warnings.some((w) => w.includes('API key') || w.includes('Gateway'))) {
					result.warnings.push(
						`${modelProvider} models can use Cloudflare AI Gateway (recommended) or direct API`
					);
				}
			}
		}

		return result;
	}

	/**
	 * Get the provider for a given model ID
	 */
	private getProviderForModel(modelId: string): string | null {
		for (const [providerName, providerData] of Object.entries(this.modelsData.providers)) {
			const model = (providerData as any).models.find((m: any) => m.id === modelId);
			if (model) return providerName;
		}
		return null;
	}
}

/**
 * Create a Cloudflare platform instance with data
 */
export function createCloudfarePlatform(
	modelsData: any,
	capabilitiesData: any
): CloudflarePlatform {
	return new CloudflarePlatform(modelsData, capabilitiesData);
}
