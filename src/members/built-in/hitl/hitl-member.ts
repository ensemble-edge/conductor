/**
 * HITL Member - Human-in-the-Loop Workflows
 *
 * Features:
 * - Suspend workflow execution for manual approval
 * - Resume execution after approval/rejection
 * - Notification system (Slack, email, webhook)
 * - Timeout handling with auto-expiry
 * - State persistence via Durable Objects
 */

import { BaseMember, type MemberExecutionContext } from '../../base-member'
import type { MemberConfig } from '../../../runtime/parser'
import { createLogger } from '../../../observability'
import type {
  HITLConfig,
  HITLInput,
  HITLSuspendInput,
  HITLResumeInput,
  HITLResult,
  HITLSuspendResult,
  HITLResumeResult,
  ApprovalState,
} from './types'

const logger = createLogger({ serviceName: 'hitl-member' })

export class HITLMember extends BaseMember {
  private hitlConfig: HITLConfig

  constructor(
    config: MemberConfig,
    private readonly env: Env
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

  protected async run(context: MemberExecutionContext): Promise<HITLResult> {
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
  private async suspendForApproval(context: MemberExecutionContext): Promise<HITLSuspendResult> {
    const input = context.input as HITLSuspendInput

    if (!input.approvalData) {
      throw new Error('Suspend action requires "approvalData" in input')
    }

    // Generate execution ID
    const executionId = this.generateExecutionId()
    const expiresAt = Date.now() + this.hitlConfig.timeout!

    // Store approval state (placeholder - TODO: integrate with Durable Objects)
    const approvalState: ApprovalState = {
      executionId,
      state: context.state || {},
      suspendedAt: Date.now(),
      expiresAt,
      approvalData: input.approvalData,
      status: 'suspended',
    }

    // TODO: Store in Durable Object
    // const approvalDO = this.getApprovalDO(executionId);
    // await approvalDO.suspend(approvalState);

    // Send notification
    if (this.hitlConfig.notificationChannel) {
      await this.sendNotification(executionId, input.approvalData)
    }

    // Generate approval URL (placeholder)
    const approvalUrl = `https://your-app.com/approve/${executionId}`

    return {
      status: 'suspended',
      executionId,
      approvalUrl,
      expiresAt,
    }
  }

  /**
   * Resume execution after approval/rejection
   */
  private async resumeExecution(context: MemberExecutionContext): Promise<HITLResumeResult> {
    const input = context.input as HITLResumeInput

    if (!input.executionId) {
      throw new Error('Resume action requires "executionId" in input')
    }

    // Get approval state (placeholder - TODO: integrate with Durable Objects)
    // const approvalDO = this.getApprovalDO(input.executionId);
    // const approvalState = await approvalDO.getState();

    // Placeholder
    const approvalState: ApprovalState = {
      executionId: input.executionId,
      state: {},
      suspendedAt: Date.now() - 1000,
      expiresAt: Date.now() + 86400000,
      approvalData: {},
      status: input.approved ? 'approved' : 'rejected',
      comments: input.comments,
    }

    // Check if expired
    if (Date.now() > approvalState.expiresAt) {
      return {
        status: 'expired',
        executionId: input.executionId,
        comments: 'Approval request expired',
      }
    }

    // Update state
    // await approvalDO.resume(input.approved, input.comments);

    return {
      status: approvalState.status,
      executionId: input.executionId,
      state: approvalState.state,
      comments: input.comments,
    }
  }

  /**
   * Approve execution (shorthand for resume with approved=true)
   */
  private async approveExecution(context: MemberExecutionContext): Promise<HITLResumeResult> {
    const input = context.input as HITLResumeInput
    return await this.resumeExecution({
      ...context,
      input: { ...input, approved: true },
    })
  }

  /**
   * Reject execution (shorthand for resume with approved=false)
   */
  private async rejectExecution(context: MemberExecutionContext): Promise<HITLResumeResult> {
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
            text: `*Execution ID:* ${executionId}\n*Data:* ${JSON.stringify(approvalData, null, 2)}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Approve',
              },
              style: 'primary',
              url: `https://your-app.com/approve/${executionId}?action=approve`,
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Reject',
              },
              style: 'danger',
              url: `https://your-app.com/approve/${executionId}?action=reject`,
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
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    executionId: string,
    approvalData: Record<string, unknown>,
    config: Record<string, unknown>
  ): Promise<void> {
    // TODO: Implement email notification via Cloudflare Email Workers
    logger.debug('Email notification not yet implemented', {
      executionId,
    })
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

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        executionId,
        approvalData,
        approvalUrl: `https://your-app.com/approve/${executionId}`,
        expiresAt: Date.now() + this.hitlConfig.timeout!,
      }),
    })
  }

  /**
   * Generate a cryptographically secure unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${crypto.randomUUID()}`
  }

  /**
   * Get Durable Object for approval state
   */
  private getApprovalDO(executionId: string): unknown {
    // TODO: Integrate with Durable Objects
    // const doId = this.env.APPROVAL_MANAGER.idFromName(executionId);
    // return this.env.APPROVAL_MANAGER.get(doId);
    return null
  }
}
