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
import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js';
import type { AgentConfig } from '../../../runtime/parser.js';
import type { HITLResult } from './types.js';
import type { ConductorEnv } from '../../../types/env.js';
export declare class HITLMember extends BaseAgent {
    private readonly env;
    private hitlConfig;
    constructor(config: AgentConfig, env: ConductorEnv);
    protected run(context: AgentExecutionContext): Promise<HITLResult>;
    /**
     * Suspend execution and wait for approval
     */
    private suspendForApproval;
    /**
     * Resume execution after approval/rejection
     */
    private resumeExecution;
    /**
     * Approve execution (shorthand for resume with approved=true)
     */
    private approveExecution;
    /**
     * Reject execution (shorthand for resume with approved=false)
     */
    private rejectExecution;
    /**
     * Send notification to configured channel
     */
    private sendNotification;
    /**
     * Send Slack notification
     */
    private sendSlackNotification;
    /**
     * Send email notification
     */
    private sendEmailNotification;
    /**
     * Send webhook notification
     */
    private sendWebhookNotification;
    /**
     * Generate a cryptographically secure unique execution ID
     */
    private generateExecutionId;
    /**
     * Get Durable Object for approval state
     */
    private getApprovalDO;
}
//# sourceMappingURL=hitl-agent.d.ts.map