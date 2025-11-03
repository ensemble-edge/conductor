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
import { BaseMember, type MemberExecutionContext } from '../../base-member';
import type { MemberConfig } from '../../../runtime/parser';
import type { HITLResult } from './types';
export declare class HITLMember extends BaseMember {
    private readonly env;
    private hitlConfig;
    constructor(config: MemberConfig, env: Env);
    protected run(context: MemberExecutionContext): Promise<HITLResult>;
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
//# sourceMappingURL=hitl-member.d.ts.map