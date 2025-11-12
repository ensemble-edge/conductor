/**
 * Think Agent - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic
 */

import { BaseAgent, type AgentExecutionContext } from './base-agent.js'
import type { AgentConfig } from '../runtime/parser.js'
import { getProviderRegistry, type ProviderRegistry } from './think-providers/index.js'
import type { AIMessage, AIProviderConfig, AIProviderResponse } from './think-providers/index.js'
import { AIProvider } from '../types/constants.js'
import type { ConductorEnv } from '../types/env.js'
import { resolveValue, type ComponentResolutionContext } from '../utils/component-resolver.js'

export interface ThinkConfig {
  model?: string
  provider?: AIProvider
  temperature?: number
  maxTokens?: number
  apiKey?: string
  apiEndpoint?: string
  systemPrompt?: string
  prompt?: string // Reference to versioned prompt (e.g., "company-analysis-prompt@v1.0.0")
}

export interface ThinkInput {
  prompt?: string
  messages?: Array<{ role: string; content: string }>
  [key: string]: unknown
}

/**
 * Think Agent - Executes AI reasoning via provider system
 */
export class ThinkAgent extends BaseAgent {
  private thinkConfig: ThinkConfig
  private providerRegistry: ProviderRegistry

  constructor(config: AgentConfig, providerRegistry?: ProviderRegistry) {
    super(config)

    // Use injected registry for testing, or global registry for production
    this.providerRegistry = providerRegistry || getProviderRegistry()

    const cfg = config.config as ThinkConfig | undefined
    this.thinkConfig = {
      model: cfg?.model || 'claude-3-5-haiku-20241022',
      provider: cfg?.provider || AIProvider.Anthropic,
      temperature: cfg?.temperature || 0.7,
      maxTokens: cfg?.maxTokens || 1000,
      apiKey: cfg?.apiKey,
      apiEndpoint: cfg?.apiEndpoint,
      systemPrompt: cfg?.systemPrompt,
      prompt: cfg?.prompt,
    }
  }

  /**
   * Execute AI reasoning via provider system
   */
  protected async run(context: AgentExecutionContext): Promise<AIProviderResponse> {
    const { input, env } = context

    // Load versioned prompt if configured
    await this.resolvePrompt(env)

    // Get provider from registry
    const providerId = this.thinkConfig.provider || AIProvider.Anthropic
    const provider = this.providerRegistry.get(providerId)

    if (!provider) {
      throw new Error(
        `Unknown AI provider: ${providerId}. ` +
          `Available providers: ${this.providerRegistry.getProviderIds().join(', ')}`
      )
    }

    // Build provider config
    const providerConfig: AIProviderConfig = {
      model: this.thinkConfig.model || 'claude-3-5-haiku-20241022',
      temperature: this.thinkConfig.temperature,
      maxTokens: this.thinkConfig.maxTokens,
      apiKey: this.thinkConfig.apiKey,
      apiEndpoint: this.thinkConfig.apiEndpoint,
      systemPrompt: this.thinkConfig.systemPrompt,
    }

    // Validate configuration
    const configError = provider.getConfigError(providerConfig, env as any)
    if (configError) {
      throw new Error(configError)
    }

    // Build messages from input
    const messages = this.buildMessages(input)

    // Execute via provider
    return await provider.execute({
      messages,
      config: providerConfig,
      env: env as any,
    })
  }

  /**
   * Resolve prompt from Edgit if needed
   */
  private async resolvePrompt(env: ConductorEnv): Promise<void> {
    // If systemPrompt already set inline, use it
    if (this.thinkConfig.systemPrompt) return

    // If prompt reference configured, resolve it
    if (this.thinkConfig.prompt) {
      const context: ComponentResolutionContext = {
        env,
        baseDir: process.cwd(),
      }

      try {
        const resolved = await resolveValue(this.thinkConfig.prompt, context)

        // Set resolved content as systemPrompt
        if (typeof resolved.content === 'string') {
          this.thinkConfig.systemPrompt = resolved.content
        } else {
          throw new Error(`Prompt must resolve to a string, got ${typeof resolved.content}`)
        }
      } catch (error) {
        throw new Error(
          `Failed to resolve prompt "${this.thinkConfig.prompt}": ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }
  }

  /**
   * Build messages array from input
   */
  private buildMessages(input: ThinkInput): AIMessage[] {
    const messages: AIMessage[] = []

    // Add system prompt if configured
    if (this.thinkConfig.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.thinkConfig.systemPrompt,
      })
    }

    // If input has messages array, use it
    if (input.messages && Array.isArray(input.messages)) {
      messages.push(...(input.messages as AIMessage[]))
    }
    // Otherwise, build from prompt
    else if (input.prompt) {
      messages.push({
        role: 'user',
        content: input.prompt,
      })
    }
    // Build prompt from input data
    else {
      const promptParts: string[] = []
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'string') {
          promptParts.push(`${key}: ${value}`)
        } else {
          promptParts.push(`${key}: ${JSON.stringify(value, null, 2)}`)
        }
      }

      messages.push({
        role: 'user',
        content: promptParts.join('\n\n'),
      })
    }

    return messages
  }

  /**
   * Get Think configuration
   */
  getThinkConfig(): ThinkConfig {
    return { ...this.thinkConfig }
  }
}
