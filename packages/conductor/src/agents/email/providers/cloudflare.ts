/**
 * Cloudflare Email Provider
 *
 * Uses Cloudflare's native Email Workers binding
 * https://developers.cloudflare.com/email-routing/email-workers/
 */

import { BaseEmailProvider } from './base.js'
import type {
  EmailMessage,
  EmailResult,
  ValidationResult,
  CloudflareEmailBinding,
  CloudflareEmailRequest,
} from '../types/index.js'

/**
 * Cloudflare Email Provider
 */
export class CloudflareEmailProvider extends BaseEmailProvider {
  name = 'cloudflare'

  constructor(
    private binding: CloudflareEmailBinding,
    private defaultFrom: string,
    private enableDkim: boolean = true
  ) {
    super()
  }

  /**
   * Send email via Cloudflare Email Workers
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
      // Build Cloudflare email request
      const request: CloudflareEmailRequest = {
        from: message.from || this.defaultFrom,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: message.headers,
      }

      // Add DKIM headers if enabled
      if (this.enableDkim && request.headers) {
        request.headers['X-Cloudflare-DKIM'] = 'enabled'
      }

      // Send via binding
      const response = await this.binding.send(request)

      if (!response.success) {
        return {
          messageId: '',
          status: 'failed',
          provider: this.name,
          error: response.error || 'Unknown error',
        }
      }

      return {
        messageId: response.messageId || `cf-${Date.now()}`,
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

    if (!this.binding) {
      errors.push('Cloudflare Email binding is not configured')
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
