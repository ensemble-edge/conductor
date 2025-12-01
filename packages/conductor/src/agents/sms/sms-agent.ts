/**
 * SMS Agent
 *
 * Sends SMS messages using configured SMS providers (Twilio, etc.)
 * Supports batch sending and template rendering
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type {
  SmsMessage,
  SmsResult,
  SmsProvider,
  SmsProviderConfig,
  SmsMemberInput,
  SmsMemberOutput,
  BatchSmsInput,
  BatchSmsOutput,
} from './types/index.js'
import { createSmsProvider } from './providers/index.js'
import {
  createTemplateEngine,
  type TemplateEngine,
  type BaseTemplateEngine,
} from '../../utils/templates/index.js'

/**
 * SMS Agent configuration
 */
export interface SmsAgentConfig {
  /** Provider configuration */
  provider: SmsProviderConfig
  /** Rate limiting (SMS per second) */
  rateLimit?: number
  /** Template engine to use (default: 'simple') */
  templateEngine?: TemplateEngine
}

/**
 * SMS Agent
 */
export class SmsAgent extends BaseAgent {
  private provider: SmsProvider
  private templateEngine: BaseTemplateEngine
  private rateLimit: number

  constructor(config: any) {
    super(config)

    // Parse SMS config
    const smsConfig = config.config as SmsAgentConfig
    if (!smsConfig?.provider) {
      throw new Error('SMS agent requires provider configuration')
    }

    // Initialize provider
    this.provider = createSmsProvider(smsConfig.provider)

    // Initialize template engine (default to 'simple' for SMS)
    const engine = smsConfig.templateEngine || 'simple'
    this.templateEngine = createTemplateEngine(engine)

    // Configuration
    this.rateLimit = smsConfig.rateLimit || 10 // SMS per second
  }

  /**
   * Execute SMS sending
   */
  protected async run(context: AgentExecutionContext): Promise<SmsMemberOutput | BatchSmsOutput> {
    const input = context.input as SmsMemberInput | BatchSmsInput

    // Check if this is a batch SMS operation
    if ('recipients' in input && Array.isArray(input.recipients)) {
      return this.sendBatch(input as BatchSmsInput, context)
    }

    // Single SMS
    return this.sendSingle(input as SmsMemberInput, context)
  }

  /**
   * Send single SMS
   */
  private async sendSingle(
    input: SmsMemberInput,
    context: AgentExecutionContext
  ): Promise<SmsMemberOutput> {
    // Build SMS message
    const message = this.buildMessage(input)

    // Validate provider configuration
    const validation = await this.provider.validateConfig()
    if (!validation.valid) {
      throw new Error(`Provider validation failed: ${validation.errors?.join(', ')}`)
    }

    // Send SMS
    const result = await this.provider.send(message)

    if (result.status === 'failed') {
      throw new Error(`SMS send failed: ${result.error}`)
    }

    return {
      messageId: result.messageId,
      status: result.status,
      provider: result.provider,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Send batch SMS
   */
  private async sendBatch(
    input: BatchSmsInput,
    context: AgentExecutionContext
  ): Promise<BatchSmsOutput> {
    const results: SmsResult[] = []
    const errors: Array<{ phone: string; error: string }> = []
    const messageIds: string[] = []

    // Rate limiting setup
    const delayMs = 1000 / this.rateLimit
    let lastSendTime = 0

    for (const recipient of input.recipients) {
      try {
        // Rate limiting
        const now = Date.now()
        const timeSinceLastSend = now - lastSendTime
        if (timeSinceLastSend < delayMs) {
          await this.delay(delayMs - timeSinceLastSend)
        }
        lastSendTime = Date.now()

        // Render message body with recipient data
        const body = await this.renderTemplate(input.body, {
          ...input.commonData,
          ...recipient.data,
        })

        // Build SMS for this recipient
        const smsInput: SmsMemberInput = {
          to: recipient.phone,
          body,
          mediaUrl: input.mediaUrl,
        }

        const message = this.buildMessage(smsInput)
        const result = await this.provider.send(message)

        results.push(result)

        if (result.status === 'sent' || result.status === 'queued') {
          messageIds.push(result.messageId)
        } else {
          errors.push({
            phone: recipient.phone,
            error: result.error || 'Unknown error',
          })
        }
      } catch (error) {
        errors.push({
          phone: recipient.phone,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const sent = results.filter((r) => r.status === 'sent' || r.status === 'queued').length
    const failed = results.length - sent

    return {
      sent,
      failed,
      messageIds,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Build SMS message from input
   */
  private buildMessage(input: SmsMemberInput): SmsMessage {
    return {
      to: input.to,
      from: input.from,
      body: input.body,
      mediaUrl: input.mediaUrl,
      metadata: input.metadata,
    }
  }

  /**
   * Render template with variables using template engine
   */
  private async renderTemplate(template: string, data: Record<string, any>): Promise<string> {
    return await this.templateEngine.render(template, data)
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Create SMS agent instance
 */
export function createSmsAgent(config: any): SmsAgent {
  return new SmsAgent(config)
}

// Backward compatibility aliases
export const SmsMember = SmsAgent
export type SmsMemberConfig = SmsAgentConfig
