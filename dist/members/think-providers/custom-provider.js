/**
 * Custom Provider
 *
 * Handles custom API endpoints with OpenAI-compatible format.
 */
import { BaseAIProvider } from './base-provider.js';
export class CustomProvider extends BaseAIProvider {
    constructor() {
        super(...arguments);
        this.id = 'custom';
        this.name = 'Custom API';
    }
    async execute(request) {
        const { messages, config, env } = request;
        if (!config.apiEndpoint) {
            throw new Error('Custom provider requires apiEndpoint in config');
        }
        const apiKey = this.getApiKey(config, env, 'AI_API_KEY');
        const headers = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const data = (await this.makeRequest(config.apiEndpoint, headers, {
            model: config.model,
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
        }));
        // Try multiple response formats
        const content = data.choices?.[0]?.message?.content || data.response || data.content || '';
        return {
            content,
            model: config.model,
            tokensUsed: data.usage?.total_tokens,
            provider: this.id,
            metadata: data,
        };
    }
    getConfigError(config, env) {
        if (!config.apiEndpoint) {
            return 'Custom provider requires apiEndpoint in config';
        }
        return null;
    }
}
