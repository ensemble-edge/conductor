/**
 * HITL Agent - Human-in-the-Loop Workflows
 *
 * Features:
 * - Suspend workflow execution for manual approval
 * - Resume execution after approval/rejection
 * - Notification system (Slack, email, webhook)
 * - Timeout handling with auto-expiry
 * - State persistence via Durable Objects
 */

import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import { createLogger } from '../../../observability/index.js'
import type {
  HITLConfig,
  HITLSuspendInput,
  HITLResumeInput,
  HITLResult,
  HITLSuspendResult,
  HITLResumeResult,
} from './types.js'
import type { ConductorEnv } from '../../../types/env.js'

const logger = createLogger({ serviceName: 'hitl-agent' })

export class HITLMember extends BaseAgent {
  private hitlConfig: HITLConfig

  constructor(
    config: AgentConfig,
    private readonly env: ConductorEnv
  ) {
    super(config)

    const cfg = config.config as HITLConfig | undefined

    this.hitlConfig = {
      action: cfg?.action || 'suspend',
      timeout: cfg?.timeout || 86400000, // 24 hours
      notificationChannel: cfg?.notificationChannel,
      notificationConfig: cfg?.notificationConfig,
    }
  }

  protected async run(context: AgentExecutionContext): Promise<HITLResult> {
    const action = this.hitlConfig.action!

    switch (action) {
      case 'suspend':
        return await this.suspendForApproval(context)
      case 'resume':
        return await this.resumeExecution(context)
      case 'approve':
        return await this.approveExecution(context)
      case 'reject':
        return await this.rejectExecution(context)
      default:
        throw new Error(`Unknown HITL action: ${action}`)
    }
  }

  /**
   * Suspend execution and wait for approval
   */
  private async suspendForApproval(context: AgentExecutionContext): Promise<HITLSuspendResult> {
    const input = context.input as HITLSuspendInput

    if (!input.approvalData) {
      throw new Error('Suspend action requires "approvalData" in input')
    }

    // Check for HITL_STATE Durable Object binding
    if (!this.env.HITL_STATE) {
      throw new Error(
        'HITL agent requires HITL_STATE binding. Add [[durable_objects]] binding = "HITL_STATE" to wrangler.toml'
      )
    }

    // Generate execution ID/token
    const token = this.generateExecutionId()
    const ttlSeconds = Math.floor(this.hitlConfig.timeout! / 1000)
    const expiresAt = Date.now() + this.hitlConfig.timeout!

    // Build simplified state for storage
    // Note: Full SuspendedExecutionState is managed by the caller
    // executionId is a branded type, need to unwrap it for storage
    const execId = context.executionId
      ? typeof context.executionId === 'string'
        ? context.executionId
        : (context.executionId as { value: string }).value
      : token

    const suspendedState = {
      executionId: execId,
      input: context.input,
      suspendedAt: Date.now(),
      resumeToken: token,
    }

    // Get Durable Object and suspend execution
    const doId = this.env.HITL_STATE.idFromName(token)
    const stub = this.env.HITL_STATE.get(doId)

    const response = await stub.fetch(
      new Request('https://hitl/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          suspendedState,
          ttl: ttlSeconds,
        }),
      })
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to suspend execution: ${error}`)
    }

    logger.info('Execution suspended for approval', {
      token,
      expiresAt,
      ttlSeconds,
    })

    // Send notification
    if (this.hitlConfig.notificationChannel) {
      await this.sendNotification(token, input.approvalData)
    }

    // Build callback URL - user should configure their base URL via notificationConfig.baseUrl
    const baseUrl =
      (this.hitlConfig.notificationConfig?.baseUrl as string) || 'https://your-worker.workers.dev'
    const approvalUrl = `${baseUrl}/callback/${token}`

    return {
      status: 'suspended',
      executionId: token,
      approvalUrl,
      expiresAt,
    }
  }

  /**
   * Resume execution after approval/rejection
   */
  private async resumeExecution(context: AgentExecutionContext): Promise<HITLResumeResult> {
    const input = context.input as HITLResumeInput

    if (!input.executionId) {
      throw new Error('Resume action requires "executionId" in input')
    }

    // Check for HITL_STATE Durable Object binding
    if (!this.env.HITL_STATE) {
      throw new Error(
        'HITL agent requires HITL_STATE binding. Add [[durable_objects]] binding = "HITL_STATE" to wrangler.toml'
      )
    }

    // Get Durable Object
    const doId = this.env.HITL_STATE.idFromName(input.executionId)
    const stub = this.env.HITL_STATE.get(doId)

    // First, get current status
    const statusResponse = await stub.fetch(
      new Request('https://hitl/status', {
        method: 'GET',
      })
    )

    if (!statusResponse.ok) {
      if (statusResponse.status === 404) {
        return {
          status: 'expired',
          executionId: input.executionId,
          comments: 'Execution not found or expired',
        }
      }
      const error = await statusResponse.text()
      throw new Error(`Failed to get HITL status: ${error}`)
    }

    const currentState = (await statusResponse.json()) as {
      status: string
      expiresAt: number
      approvalData?: unknown
      rejectionReason?: string
    }

    // Check if already processed
    if (currentState.status !== 'pending') {
      return {
        status: currentState.status as HITLResumeResult['status'],
        executionId: input.executionId,
        comments: currentState.rejectionReason,
      }
    }

    // Check if expired
    if (Date.now() > currentState.expiresAt) {
      return {
        status: 'expired',
        executionId: input.executionId,
        comments: 'Approval request expired',
      }
    }

    // Process approval or rejection
    if (input.approved) {
      const approveResponse = await stub.fetch(
        new Request('https://hitl/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor: input.actor || 'system',
            approvalData: input.approvalData,
          }),
        })
      )

      if (!approveResponse.ok) {
        const error = await approveResponse.text()
        throw new Error(`Failed to approve: ${error}`)
      }

      const result = (await approveResponse.json()) as {
        suspendedState: Record<string, unknown>
        approvalData?: unknown
      }

      logger.info('Execution approved', { executionId: input.executionId })

      return {
        status: 'approved',
        executionId: input.executionId,
        state: result.suspendedState,
        comments: input.comments,
      }
    } else {
      const rejectResponse = await stub.fetch(
        new Request('https://hitl/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actor: input.actor || 'system',
            reason: input.comments,
          }),
        })
      )

      if (!rejectResponse.ok) {
        const error = await rejectResponse.text()
        throw new Error(`Failed to reject: ${error}`)
      }

      logger.info('Execution rejected', { executionId: input.executionId })

      return {
        status: 'rejected',
        executionId: input.executionId,
        comments: input.comments,
      }
    }
  }

  /**
   * Approve execution (shorthand for resume with approved=true)
   */
  private async approveExecution(context: AgentExecutionContext): Promise<HITLResumeResult> {
    const input = context.input as HITLResumeInput
    return await this.resumeExecution({
      ...context,
      input: { ...input, approved: true },
    })
  }

  /**
   * Reject execution (shorthand for resume with approved=false)
   */
  private async rejectExecution(context: AgentExecutionContext): Promise<HITLResumeResult> {
    const input = context.input as HITLResumeInput
    return await this.resumeExecution({
      ...context,
      input: { ...input, approved: false },
    })
  }

  /**
   * Send notification to configured channel
   */
  private async sendNotification(
    executionId: string,
    approvalData: Record<string, unknown>
  ): Promise<void> {
    const channel = this.hitlConfig.notificationChannel
    const config = this.hitlConfig.notificationConfig || {}

    switch (channel) {
      case 'slack':
        await this.sendSlackNotification(executionId, approvalData, config)
        break
      case 'email':
        await this.sendEmailNotification(executionId, approvalData, config)
        break
      case 'webhook':
        await this.sendWebhookNotification(executionId, approvalData, config)
        break
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    executionId: string,
    approvalData: Record<string, unknown>,
    config: Record<string, unknown>
  ): Promise<void> {
    const webhookUrl = config.webhookUrl

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      throw new Error('Slack notification requires webhookUrl in notificationConfig')
    }

    const baseUrl = (config.baseUrl as string) || 'https://your-worker.workers.dev'
    const approveUrl = `${baseUrl}/callback/${executionId}?action=approve`
    const rejectUrl = `${baseUrl}/callback/${executionId}?action=reject`

    const message = {
      text: `🔔 Approval Required`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Approval Required',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Execution ID:* \`${executionId}\`\n*Data:*\n\`\`\`${JSON.stringify(approvalData, null, 2)}\`\`\``,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✓ Approve',
              },
              style: 'primary',
              url: approveUrl,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '✗ Reject',
              },
              style: 'danger',
              url: rejectUrl,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `⏱️ Expires in ${Math.round(this.hitlConfig.timeout! / 3600000)} hours`,
            },
          ],
        },
      ],
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    logger.info('Slack notification sent', { executionId })
  }

  /**
   * Send email notification
   *
   * Requires notificationConfig to include:
   * - to: Recipient email address
   * - from: Sender email address (must be verified in Cloudflare)
   * - subject: (optional) Custom subject line
   * - baseUrl: Base URL for callback links
   */
  private async sendEmailNotification(
    executionId: string,
    approvalData: Record<string, unknown>,
    config: Record<string, unknown>
  ): Promise<void> {
    const to = config.to as string
    const from = config.from as string
    const baseUrl = (config.baseUrl as string) || 'https://your-worker.workers.dev'
    const subject = (config.subject as string) || '🔔 Approval Required'

    if (!to || !from) {
      logger.warn('Email notification skipped: missing to or from in notificationConfig', {
        executionId,
      })
      return
    }

    // Build approval/rejection URLs
    const approveUrl = `${baseUrl}/callback/${executionId}?action=approve`
    const rejectUrl = `${baseUrl}/callback/${executionId}?action=reject`

    // Build email body
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; border: 1px solid #e0e0e0; border-top: none; }
    .data { background: #fafafa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    .buttons { margin-top: 20px; }
    .btn { display: inline-block; padding: 12px 24px; margin-right: 10px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .btn-approve { background: #22c55e; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${subject}</h2>
    </div>
    <div class="content">
      <p><strong>Execution ID:</strong> ${executionId}</p>
      <p><strong>Approval Data:</strong></p>
      <div class="data">
        <pre>${JSON.stringify(approvalData, null, 2)}</pre>
      </div>
      <div class="buttons">
        <a href="${approveUrl}" class="btn btn-approve">✓ Approve</a>
        <a href="${rejectUrl}" class="btn btn-reject">✗ Reject</a>
      </div>
      <div class="footer">
        <p>This request will expire in ${Math.round(this.hitlConfig.timeout! / 3600000)} hours.</p>
      </div>
    </div>
  </div>
</body>
</html>
`

    const textBody = `
Approval Required
=================

Execution ID: ${executionId}

Approval Data:
${JSON.stringify(approvalData, null, 2)}

Actions:
- Approve: ${approveUrl}
- Reject: ${rejectUrl}

This request will expire in ${Math.round(this.hitlConfig.timeout! / 3600000)} hours.
`

    // Use MailChannels API (free for Cloudflare Workers)
    // Or the configured email service
    try {
      const emailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody },
          ],
        }),
      })

      if (!emailResponse.ok) {
        const error = await emailResponse.text()
        logger.error('Failed to send email notification', new Error(error), { executionId })
      } else {
        logger.info('Email notification sent', { executionId, to })
      }
    } catch (error) {
      logger.error('Email notification failed', error instanceof Error ? error : undefined, {
        executionId,
      })
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    executionId: string,
    approvalData: Record<string, unknown>,
    config: Record<string, unknown>
  ): Promise<void> {
    const webhookUrl = config.webhookUrl

    if (!webhookUrl || typeof webhookUrl !== 'string') {
      throw new Error('Webhook notification requires webhookUrl in notificationConfig')
    }

    const baseUrl = (config.baseUrl as string) || 'https://your-worker.workers.dev'

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executionId,
        approvalData,
        callbackUrl: `${baseUrl}/callback/${executionId}`,
        approveUrl: `${baseUrl}/callback/${executionId}?action=approve`,
        rejectUrl: `${baseUrl}/callback/${executionId}?action=reject`,
        expiresAt: Date.now() + this.hitlConfig.timeout!,
      }),
    })

    logger.info('Webhook notification sent', { executionId, webhookUrl })
  }

  /**
   * Generate a cryptographically secure unique execution ID
   */
  private generateExecutionId(): string {
    return `hitl_${crypto.randomUUID()}`
  }
}
