/**
 * Anthropic Provider
 *
 * Handles Anthropic API calls with proper message formatting.
 */

import { BaseAIProvider } from './base-provider.js'
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider.js'
import type { ProviderId } from '../../types/branded.js'

export class AnthropicProvider extends BaseAIProvider {
  readonly id = 'anthropic' as ProviderId
  readonly name = 'Anthropic'

  private readonly defaultEndpoint = 'https://api.anthropic.com/v1/messages'
  private readonly defaultModel = 'claude-3-sonnet-20240229'

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    const { messages, config, env } = request

    const apiKey = this.getApiKey(config, env, 'ANTHROPIC_API_KEY')
    if (!apiKey) {
      throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config')
    }

    const endpoint = config.apiEndpoint || this.defaultEndpoint

    // Anthropic format: system is separate, only user/assistant in messages
    const anthropicMessages = messages.filter((m) => m.role !== 'system')
    const systemMessage = messages.find((m) => m.role === 'system')?.content || config.systemPrompt

    const data = (await this.makeRequest(
      endpoint,
      {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      {
        model: config.model || this.defaultModel,
        messages: anthropicMessages,
        system: systemMessage,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }
    )) as {
      content: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
      stop_reason?: string
    }

    return {
      content: data.content[0]?.text || '',
      model: config.model || this.defaultModel,
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      provider: this.id,
      metadata: {
        stopReason: data.stop_reason,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    }
  }

  getConfigError(config: AIProviderConfig, env: Env): string | null {
    const apiKey = this.getApiKey(config, env, 'ANTHROPIC_API_KEY')
    if (!apiKey) {
      return 'Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config.apiKey'
    }
    return null
  }
}
