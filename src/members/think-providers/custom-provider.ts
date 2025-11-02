/**
 * Custom Provider
 *
 * Handles custom API endpoints with OpenAI-compatible format.
 */

import { BaseAIProvider } from './base-provider';
import type {
	AIProviderConfig,
	AIProviderRequest,
	AIProviderResponse
} from './base-provider';
import type { ProviderId } from '../../types/branded';

export class CustomProvider extends BaseAIProvider {
	readonly id = 'custom' as ProviderId;
	readonly name = 'Custom API';

	async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
		const { messages, config, env } = request;

		if (!config.apiEndpoint) {
			throw new Error('Custom provider requires apiEndpoint in config');
		}

		const apiKey = this.getApiKey(config, env, 'AI_API_KEY');
		const headers: Record<string, string> = {};

		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		const data = await this.makeRequest(
			config.apiEndpoint,
			headers,
			{
				model: config.model,
				messages,
				temperature: config.temperature,
				max_tokens: config.maxTokens
			}
		);

		// Try multiple response formats
		const content =
			data.choices?.[0]?.message?.content ||
			data.response ||
			data.content ||
			'';

		return {
			content,
			model: config.model,
			tokensUsed: data.usage?.total_tokens,
			provider: this.id,
			metadata: data
		};
	}

	getConfigError(config: AIProviderConfig, env: Env): string | null {
		if (!config.apiEndpoint) {
			return 'Custom provider requires apiEndpoint in config';
		}
		return null;
	}
}
