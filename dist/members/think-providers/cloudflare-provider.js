/**
 * Cloudflare Provider
 *
 * Handles Cloudflare Workers AI binding calls.
 */
import { BaseAIProvider } from './base-provider';
export class CloudflareProvider extends BaseAIProvider {
    constructor() {
        super(...arguments);
        this.id = 'workers-ai';
        this.name = 'Cloudflare Workers AI';
        this.defaultModel = '@cf/meta/llama-2-7b-chat-int8';
    }
    async execute(request) {
        const { messages, config, env } = request;
        if (!env.AI) {
            throw new Error('Cloudflare AI binding not available. Add [ai] binding = "AI" to wrangler.toml');
        }
        const model = config.model || this.defaultModel;
        // Call Cloudflare AI binding
        const response = (await env.AI.run(model, {
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
        }));
        return {
            content: response.response || response.result?.response || String(response),
            model,
            tokensUsed: response.tokens_used,
            provider: this.id,
            metadata: {
                raw: response,
            },
        };
    }
    getConfigError(config, env) {
        if (!env.AI) {
            return 'Cloudflare AI binding not found. Add [ai] binding = "AI" to wrangler.toml';
        }
        return null;
    }
}
