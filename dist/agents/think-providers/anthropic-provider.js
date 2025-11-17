/**
 * Anthropic Provider
 *
 * Handles Anthropic API calls with proper message formatting.
 */
import { BaseAIProvider } from './base-provider.js';
export class AnthropicProvider extends BaseAIProvider {
    constructor() {
        super(...arguments);
        this.id = 'anthropic';
        this.name = 'Anthropic';
        this.defaultEndpoint = 'https://api.anthropic.com/v1/messages';
        this.defaultModel = 'claude-3-sonnet-20240229';
    }
    async execute(request) {
        const { messages, config, env } = request;
        const apiKey = this.getApiKey(config, env, 'ANTHROPIC_API_KEY');
        if (!apiKey) {
            throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config');
        }
        const endpoint = config.apiEndpoint || this.defaultEndpoint;
        // Anthropic format: system is separate, only user/assistant in messages
        const anthropicMessages = messages.filter((m) => m.role !== 'system');
        const systemMessage = messages.find((m) => m.role === 'system')?.content || config.systemPrompt;
        // Build request body
        const requestBody = {
            model: config.model || this.defaultModel,
            messages: anthropicMessages,
            system: systemMessage,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
        };
        // Add schema for structured outputs if configured
        if (config.schema) {
            const schema = typeof config.schema === 'string' ? JSON.parse(config.schema) : config.schema;
            // Use Anthropic's native JSON schema support
            requestBody.response_format = {
                type: 'json_schema',
                json_schema: schema,
            };
        }
        const data = (await this.makeRequest(endpoint, {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        }, requestBody));
        return {
            content: data.content[0]?.text || '',
            model: config.model || this.defaultModel,
            tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            provider: this.id,
            metadata: {
                stopReason: data.stop_reason,
                inputTokens: data.usage?.input_tokens,
                outputTokens: data.usage?.output_tokens,
                schema: config.schema ? (typeof config.schema === 'string' ? config.schema : JSON.stringify(config.schema)) : undefined,
            },
        };
    }
    getConfigError(config, env) {
        const apiKey = this.getApiKey(config, env, 'ANTHROPIC_API_KEY');
        if (!apiKey) {
            return 'Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config.apiKey';
        }
        return null;
    }
}
