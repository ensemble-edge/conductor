/**
 * Resend Email Provider
 *
 * Uses Resend's API for email delivery
 * https://resend.com/docs
 */

import { BaseEmailProvider } from './base.js'
import type {
  EmailMessage,
  EmailResult,
  ValidationResult,
  EmailAttachment,
} from '../types/index.js'

interface ResendEmailRequest {
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  reply_to?: string
  attachments?: ResendAttachment[]
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
}

interface ResendAttachment {
  filename: string
  content: string
}

interface ResendEmailResponse {
  id: string
  error?: {
    message: string
    name: string
  }
}

/**
 * Resend Email Provider
 */
export class ResendProvider extends BaseEmailProvider {
  name = 'resend'
  private apiUrl = 'https://api.resend.com/emails'

  constructor(
    private apiKey: string,
    private defaultFrom: string
  ) {
    super()
  }

  /**
   * Send email via Resend API
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    // Validate message
    const validation = this.validateMessage(message)
    if (!validation.valid) {
      return {
        messageId: '',
        status: 'failed',
        provider: this.name,
        error: validation.errors?.join(', '),
      }
    }

    try {
      // Build Resend request
      const request: ResendEmailRequest = {
        from: message.from || this.defaultFrom,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }

      // Optional fields
      if (message.cc) request.cc = message.cc
      if (message.bcc) request.bcc = message.bcc
      if (message.replyTo) request.reply_to = message.replyTo
      if (message.headers) request.headers = message.headers

      // Convert attachments
      if (message.attachments) {
        request.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        }))
      }

      // Convert tags
      if (message.tags) {
        request.tags = message.tags.map((tag) => ({
          name: tag,
          value: 'true',
        }))
      }

      // Send via API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = (await response.json()) as ResendEmailResponse

      if (!response.ok || data.error) {
        return {
          messageId: '',
          status: 'failed',
          provider: this.name,
          error: data.error?.message || `HTTP ${response.status}`,
        }
      }

      return {
        messageId: data.id,
        status: 'sent',
        provider: this.name,
      }
    } catch (error) {
      return {
        messageId: '',
        status: 'failed',
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<ValidationResult> {
    const errors: string[] = []

    if (!this.apiKey) {
      errors.push('Resend API key is required')
    }

    if (!this.defaultFrom) {
      errors.push('Default from address is required')
    } else if (!this.validateEmail(this.defaultFrom)) {
      errors.push('Default from address is invalid')
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}
