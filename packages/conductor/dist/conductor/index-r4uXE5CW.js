import { b as BaseAgent, c as createLogger } from "./worker-entry-BozxL034.js";
const logger = createLogger({ serviceName: "hitl-agent" });
class HITLMember extends BaseAgent {
  constructor(config, env) {
    super(config);
    this.env = env;
    const cfg = config.config;
    this.hitlConfig = {
      action: cfg?.action || "suspend",
      timeout: cfg?.timeout || 864e5,
      // 24 hours
      notificationChannel: cfg?.notificationChannel,
      notificationConfig: cfg?.notificationConfig
    };
  }
  async run(context) {
    const action = this.hitlConfig.action;
    switch (action) {
      case "suspend":
        return await this.suspendForApproval(context);
      case "resume":
        return await this.resumeExecution(context);
      case "approve":
        return await this.approveExecution(context);
      case "reject":
        return await this.rejectExecution(context);
      default:
        throw new Error(`Unknown HITL action: ${action}`);
    }
  }
  /**
   * Suspend execution and wait for approval
   */
  async suspendForApproval(context) {
    const input = context.input;
    if (!input.approvalData) {
      throw new Error('Suspend action requires "approvalData" in input');
    }
    const executionId = this.generateExecutionId();
    const expiresAt = Date.now() + this.hitlConfig.timeout;
    ({
      state: context.state || {},
      approvalData: input.approvalData
    });
    if (this.hitlConfig.notificationChannel) {
      await this.sendNotification(executionId, input.approvalData);
    }
    const approvalUrl = `https://your-app.com/approve/${executionId}`;
    return {
      status: "suspended",
      executionId,
      approvalUrl,
      expiresAt
    };
  }
  /**
   * Resume execution after approval/rejection
   */
  async resumeExecution(context) {
    const input = context.input;
    if (!input.executionId) {
      throw new Error('Resume action requires "executionId" in input');
    }
    const approvalState = {
      executionId: input.executionId,
      state: {},
      expiresAt: Date.now() + 864e5,
      status: input.approved ? "approved" : "rejected",
      comments: input.comments
    };
    if (Date.now() > approvalState.expiresAt) {
      return {
        status: "expired",
        executionId: input.executionId,
        comments: "Approval request expired"
      };
    }
    return {
      status: approvalState.status,
      executionId: input.executionId,
      state: approvalState.state,
      comments: input.comments
    };
  }
  /**
   * Approve execution (shorthand for resume with approved=true)
   */
  async approveExecution(context) {
    const input = context.input;
    return await this.resumeExecution({
      ...context,
      input: { ...input, approved: true }
    });
  }
  /**
   * Reject execution (shorthand for resume with approved=false)
   */
  async rejectExecution(context) {
    const input = context.input;
    return await this.resumeExecution({
      ...context,
      input: { ...input, approved: false }
    });
  }
  /**
   * Send notification to configured channel
   */
  async sendNotification(executionId, approvalData) {
    const channel = this.hitlConfig.notificationChannel;
    const config = this.hitlConfig.notificationConfig || {};
    switch (channel) {
      case "slack":
        await this.sendSlackNotification(executionId, approvalData, config);
        break;
      case "email":
        await this.sendEmailNotification(executionId, approvalData, config);
        break;
      case "webhook":
        await this.sendWebhookNotification(executionId, approvalData, config);
        break;
    }
  }
  /**
   * Send Slack notification
   */
  async sendSlackNotification(executionId, approvalData, config) {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl || typeof webhookUrl !== "string") {
      throw new Error("Slack notification requires webhookUrl in notificationConfig");
    }
    const message = {
      text: `🔔 Approval Required`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🔔 Approval Required"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Execution ID:* ${executionId}
*Data:* ${JSON.stringify(approvalData, null, 2)}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Approve"
              },
              style: "primary",
              url: `https://your-app.com/approve/${executionId}?action=approve`
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Reject"
              },
              style: "danger",
              url: `https://your-app.com/approve/${executionId}?action=reject`
            }
          ]
        }
      ]
    };
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    });
  }
  /**
   * Send email notification
   */
  async sendEmailNotification(executionId, approvalData, config) {
    logger.debug("Email notification not yet implemented", {
      executionId
    });
  }
  /**
   * Send webhook notification
   */
  async sendWebhookNotification(executionId, approvalData, config) {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl || typeof webhookUrl !== "string") {
      throw new Error("Webhook notification requires webhookUrl in notificationConfig");
    }
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionId,
        approvalData,
        approvalUrl: `https://your-app.com/approve/${executionId}`,
        expiresAt: Date.now() + this.hitlConfig.timeout
      })
    });
  }
  /**
   * Generate a cryptographically secure unique execution ID
   */
  generateExecutionId() {
    return `exec_${crypto.randomUUID()}`;
  }
  /**
   * Get Durable Object for approval state
   */
  getApprovalDO(executionId) {
    return null;
  }
}
export {
  HITLMember
};
//# sourceMappingURL=index-r4uXE5CW.js.map
