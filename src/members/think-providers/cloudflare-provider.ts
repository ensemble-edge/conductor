/**
 * Cloudflare Provider
 *
 * Handles Cloudflare Workers AI binding calls.
 */

import { BaseAIProvider } from './base-provider'
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider'
import type { ProviderId } from '../../types/branded'

export class CloudflareProvider extends BaseAIProvider {
  readonly id = 'workers-ai' as ProviderId
  readonly name = 'Cloudflare Workers AI'

  private readonly defaultModel = '@cf/meta/llama-2-7b-chat-int8'

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    const { messages, config, env } = request

    if (!env.AI) {
      throw new Error(
        'Cloudflare AI binding not available. Add [ai] binding = "AI" to wrangler.toml'
      )
    }

    const model = config.model || this.defaultModel

    // Call Cloudflare AI binding
    const response = (await env.AI.run(model as any, {
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    })) as any

    return {
      content: response.response || response.result?.response || String(response),
      model,
      tokensUsed: response.tokens_used,
      provider: this.id,
      metadata: {
        raw: response,
      },
    }
  }

  getConfigError(config: AIProviderConfig, env: Env): string | null {
    if (!env.AI) {
      return 'Cloudflare AI binding not found. Add [ai] binding = "AI" to wrangler.toml'
    }
    return null
  }
}
