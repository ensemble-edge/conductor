/**
 * Email Agent
 *
 * Sends emails using configured email providers (Cloudflare, Resend, SMTP)
 * Supports templates, batch sending, and email tracking
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type {
  EmailMessage,
  EmailResult,
  EmailProvider,
  EmailProviderConfig,
  EmailMemberInput,
  EmailMemberOutput,
  BatchEmailInput,
  BatchEmailOutput,
} from './types/index.js'
import { createEmailProvider } from './providers/index.js'
import {
  createTemplateEngine,
  type TemplateEngine,
  type BaseTemplateEngine,
} from '../../utils/templates/index.js'
import { TemplateLoader } from './template-loader.js'

/**
 * Email Agent configuration
 */
export interface EmailAgentConfig {
  /** Provider configuration */
  provider: EmailProviderConfig
  /** Rate limiting (emails per second) */
  rateLimit?: number
  /** Enable email tracking */
  tracking?: boolean
  /** KV namespace for templates */
  templatesKv?: string
  /** Template engine to use (default: 'simple') */
  templateEngine?: TemplateEngine
}

/**
 * Email Agent
 */
export class EmailAgent extends BaseAgent {
  private provider: EmailProvider
  private templateEngine: BaseTemplateEngine
  private templateLoader: TemplateLoader
  private rateLimit: number
  private tracking: boolean

  constructor(config: any) {
    super(config)

    // Parse email config
    const emailConfig = config.config as EmailAgentConfig
    if (!emailConfig?.provider) {
      throw new Error('Email agent requires provider configuration')
    }

    // Initialize provider
    this.provider = createEmailProvider(emailConfig.provider)

    // Initialize template engine (default to 'simple')
    const engine = emailConfig.templateEngine || 'simple'
    this.templateEngine = createTemplateEngine(engine)

    // Initialize template loader for KV/file loading
    this.templateLoader = new TemplateLoader({
      engine: this.templateEngine,
      kv: emailConfig.templatesKv ? config.env?.[emailConfig.templatesKv] || undefined : undefined,
      defaultVersion: 'latest',
    })

    // Configuration
    this.rateLimit = emailConfig.rateLimit || 10 // emails per second
    this.tracking = emailConfig.tracking ?? false
  }

  /**
   * Execute email sending
   */
  protected async run(
    context: AgentExecutionContext
  ): Promise<EmailMemberOutput | BatchEmailOutput> {
    const input = context.input as EmailMemberInput | BatchEmailInput

    // Check if this is a batch email operation
    if ('recipients' in input && Array.isArray(input.recipients)) {
      return this.sendBatch(input as BatchEmailInput, context)
    }

    // Single email
    return this.sendSingle(input as EmailMemberInput, context)
  }

  /**
   * Send single email
   */
  private async sendSingle(
    input: EmailMemberInput,
    context: AgentExecutionContext
  ): Promise<EmailMemberOutput> {
    // Build email message
    const message = await this.buildMessage(input, context)

    // Validate provider configuration
    const validation = await this.provider.validateConfig()
    if (!validation.valid) {
      throw new Error(`Provider validation failed: ${validation.errors?.join(', ')}`)
    }

    // Send email
    const result = await this.provider.send(message)

    if (result.status === 'failed') {
      throw new Error(`Email send failed: ${result.error}`)
    }

    return {
      messageId: result.messageId,
      status: result.status,
      provider: result.provider,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Send batch emails
   */
  private async sendBatch(
    input: BatchEmailInput,
    context: AgentExecutionContext
  ): Promise<BatchEmailOutput> {
    const results: EmailResult[] = []
    const errors: Array<{ email: string; error: string }> = []
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

        // Build email for this recipient
        const emailInput: EmailMemberInput = {
          to: recipient.email,
          subject: input.subject,
          template: input.template,
          data: {
            ...input.commonData,
            ...recipient.data,
          },
        }

        const message = await this.buildMessage(emailInput, context)
        const result = await this.provider.send(message)

        results.push(result)

        if (result.status === 'sent') {
          messageIds.push(result.messageId)
        } else {
          errors.push({
            email: recipient.email,
            error: result.error || 'Unknown error',
          })
        }
      } catch (error) {
        errors.push({
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const failed = results.length - sent

    return {
      sent,
      failed,
      messageIds,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Build email message from input
   */
  private async buildMessage(
    input: EmailMemberInput,
    context: AgentExecutionContext
  ): Promise<EmailMessage> {
    let html = input.html
    let text = input.text

    // Render template if provided
    if (input.template) {
      // Support both { data: { ... } } and flat input patterns
      const data = input.data ? input.data : this.extractTemplateData(input)
      // Use template loader to load and render template (handles KV, files, inline, and component references)
      html = await this.templateLoader.render(input.template, data, context.env)

      // If no text version provided, strip HTML for plain text
      if (!text) {
        text = this.stripHtml(html)
      }
    }

    // Build message
    const message: EmailMessage = {
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      from: input.from,
      replyTo: input.replyTo,
      subject: input.subject,
      html,
      text,
      attachments: input.attachments,
      headers: input.headers,
      tags: input.tags,
      metadata: input.metadata,
    }

    // Add tracking headers if enabled
    if (this.tracking) {
      message.headers = {
        ...message.headers,
        'X-Conductor-Tracking': 'enabled',
        'X-Conductor-Ensemble': context.state?.ensembleName || 'unknown',
      }
    }

    return message
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Extract template data from flat input, filtering out EmailMemberInput-specific fields
   *
   * When input is passed as { name: "...", activationUrl: "..." } instead of { data: { name: "..." } },
   * this method extracts only the template data fields by filtering out known EmailMemberInput properties.
   */
  private extractTemplateData(input: EmailMemberInput): Record<string, unknown> {
    const reservedKeys: Set<keyof EmailMemberInput> = new Set([
      'to',
      'cc',
      'bcc',
      'from',
      'replyTo',
      'subject',
      'html',
      'text',
      'attachments',
      'headers',
      'tags',
      'metadata',
      'template',
      'data',
    ])

    const templateData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(input)) {
      if (!reservedKeys.has(key as keyof EmailMemberInput)) {
        templateData[key] = value
      }
    }

    return templateData
  }
}

/**
 * Create email agent instance
 */
export function createEmailMember(config: any): EmailAgent {
  return new EmailAgent(config)
}
