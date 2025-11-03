/**
 * OpenAI Provider
 *
 * Handles OpenAI API calls with proper error handling and validation.
 */

import { BaseAIProvider } from './base-provider'
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider'
import type { ProviderId } from '../../types/branded'

export class OpenAIProvider extends BaseAIProvider {
  readonly id = 'openai' as ProviderId
  readonly name = 'OpenAI'

  private readonly defaultEndpoint = 'https://api.openai.com/v1/chat/completions'

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    const { messages, config, env } = request

    const apiKey = this.getApiKey(config, env, 'OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY in env or config')
    }

    const endpoint = config.apiEndpoint || this.defaultEndpoint

    const data = (await this.makeRequest(
      endpoint,
      { Authorization: `Bearer ${apiKey}` },
      {
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }
    )) as {
      choices: Array<{ message?: { content?: string }; finish_reason?: string }>
      usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }
    }

    return {
      content: data.choices[0]?.message?.content || '',
      model: config.model,
      tokensUsed: data.usage?.total_tokens,
      provider: this.id,
      metadata: {
        finishReason: data.choices[0]?.finish_reason,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
    }
  }

  getConfigError(config: AIProviderConfig, env: Env): string | null {
    const apiKey = this.getApiKey(config, env, 'OPENAI_API_KEY')
    if (!apiKey) {
      return 'OpenAI API key not found. Set OPENAI_API_KEY in env or config.apiKey'
    }
    return null
  }
}
