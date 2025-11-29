/**
 * Email Notifier
 *
 * Sends email notifications using Cloudflare Email Routing / MailChannels
 */

import type {
  NotificationEventData,
  NotificationDeliveryResult,
  EmailNotificationData,
} from './types.js'
import { createLogger } from '../../observability/index.js'
import type { ConductorEnv } from '../../types/env.js'

const logger = createLogger({ serviceName: 'email-notifier' })

export interface EmailNotificationConfig {
  /** Recipient email addresses */
  to: string[]
  /** Sender email address */
  from?: string
  /** Email subject (supports template variables) */
  subject?: string
  /** Events that trigger this email */
  events: string[]
}

export class EmailNotifier {
  private config: EmailNotificationConfig

  constructor(config: EmailNotificationConfig) {
    this.config = config
  }

  /**
   * Send email notification
   */
  async send(
    eventData: NotificationEventData,
    env: ConductorEnv
  ): Promise<NotificationDeliveryResult> {
    const startTime = Date.now()

    try {
      // Build email content
      const emailData = this.buildEmailData(eventData)

      // Send email using MailChannels
      await this.sendEmail(emailData, env)

      logger.info('Email notification sent', {
        to: emailData.to,
        event: eventData.event,
      })

      return {
        success: true,
        type: 'email',
        target: emailData.to.join(', '),
        event: eventData.event,
        duration: Date.now() - startTime,
      }
    } catch (error) {
      logger.error('Email notification failed', error instanceof Error ? error : undefined, {
        to: this.config.to,
        event: eventData.event,
      })

      return {
        success: false,
        type: 'email',
        target: this.config.to.join(', '),
        event: eventData.event,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Build email data from event
   */
  private buildEmailData(eventData: NotificationEventData): EmailNotificationData {
    const subject = this.interpolateSubject(eventData)
    const text = this.buildTextBody(eventData)
    const html = this.buildHtmlBody(eventData)

    return {
      to: this.config.to,
      from: this.config.from || 'notifications@conductor.dev',
      subject,
      text,
      html,
      event: eventData.event,
      eventData: eventData.data,
    }
  }

  /**
   * Interpolate subject template with event data
   */
  private interpolateSubject(eventData: NotificationEventData): string {
    if (!this.config.subject) {
      // Default subject
      return `Conductor: ${eventData.event}`
    }

    // Simple template interpolation
    let subject = this.config.subject
    subject = subject.replace(/\${event}/g, eventData.event)
    subject = subject.replace(
      /\${ensemble\.name}/g,
      (eventData.data.ensemble as string) || 'Unknown'
    )
    subject = subject.replace(/\${timestamp}/g, eventData.timestamp)

    return subject
  }

  /**
   * Build plain text email body
   */
  private buildTextBody(eventData: NotificationEventData): string {
    const lines = [
      `Event: ${eventData.event}`,
      `Timestamp: ${eventData.timestamp}`,
      '',
      'Details:',
      JSON.stringify(eventData.data, null, 2),
      '',
      '---',
      'This is an automated notification from Conductor.',
    ]

    return lines.join('\n')
  }

  /**
   * Build HTML email body
   */
  private buildHtmlBody(eventData: NotificationEventData): string {
    const eventType = eventData.event.split('.')[0]
    const eventAction = eventData.event.split('.')[1] || ''

    // Color based on event type
    let color = '#2563eb' // blue
    if (eventAction === 'failed' || eventAction === 'timeout') {
      color = '#dc2626' // red
    } else if (eventAction === 'completed') {
      color = '#16a34a' // green
    }

    return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.header {
			background-color: ${color};
			color: white;
			padding: 20px;
			border-radius: 8px 8px 0 0;
		}
		.header h1 {
			margin: 0;
			font-size: 24px;
		}
		.content {
			background-color: #f9fafb;
			padding: 20px;
			border: 1px solid #e5e7eb;
			border-top: none;
			border-radius: 0 0 8px 8px;
		}
		.detail {
			margin: 10px 0;
		}
		.label {
			font-weight: 600;
			color: #6b7280;
		}
		.value {
			color: #111827;
		}
		.data {
			background-color: white;
			border: 1px solid #e5e7eb;
			border-radius: 4px;
			padding: 15px;
			margin-top: 15px;
			overflow-x: auto;
		}
		pre {
			margin: 0;
			font-size: 12px;
		}
		.footer {
			margin-top: 20px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
			text-align: center;
			color: #6b7280;
			font-size: 14px;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>${eventData.event}</h1>
	</div>
	<div class="content">
		<div class="detail">
			<span class="label">Timestamp:</span>
			<span class="value">${eventData.timestamp}</span>
		</div>
		<div class="data">
			<pre>${JSON.stringify(eventData.data, null, 2)}</pre>
		</div>
	</div>
	<div class="footer">
		This is an automated notification from Conductor.
	</div>
</body>
</html>
		`.trim()
  }

  /**
   * Send email using MailChannels API
   */
  private async sendEmail(emailData: EmailNotificationData, _env: ConductorEnv): Promise<void> {
    // Use MailChannels API (free for Cloudflare Workers)
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: emailData.to.map((email) => ({ email })),
          },
        ],
        from: {
          email: emailData.from,
          name: 'Conductor Notifications',
        },
        subject: emailData.subject,
        content: [
          {
            type: 'text/plain',
            value: emailData.text,
          },
          {
            type: 'text/html',
            value: emailData.html || emailData.text,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`MailChannels API error: ${response.status} - ${errorText}`)
    }
  }
}
