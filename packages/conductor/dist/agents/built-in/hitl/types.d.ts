/**
 * HITL Agent - Type Definitions
 */
export type HITLAction = 'suspend' | 'resume' | 'approve' | 'reject';
export type HITLStatus = 'suspended' | 'approved' | 'rejected' | 'expired';
export type NotificationChannel = 'slack' | 'email' | 'webhook';
export interface HITLConfig {
    /** Action to perform: suspend, resume, approve, or reject */
    action?: HITLAction;
    /** Timeout in milliseconds (default: 24 hours) */
    timeout?: number;
    /** Notification channel to use */
    notificationChannel?: NotificationChannel;
    /**
     * Notification configuration
     *
     * For Slack:
     * - webhookUrl: Slack webhook URL
     * - baseUrl: Base URL for callback links
     *
     * For Email:
     * - to: Recipient email address
     * - from: Sender email address
     * - subject: (optional) Custom subject line
     * - baseUrl: Base URL for callback links
     *
     * For Webhook:
     * - webhookUrl: Webhook URL to POST to
     * - baseUrl: Base URL for callback links
     */
    notificationConfig?: Record<string, unknown>;
}
export interface HITLSuspendInput {
    /** Data to include in the approval request */
    approvalData: Record<string, unknown>;
}
export interface HITLResumeInput {
    /** The execution ID to resume */
    executionId: string;
    /** Whether to approve (true) or reject (false) */
    approved: boolean;
    /** Optional actor identifier (who approved/rejected) */
    actor?: string;
    /** Optional comments about the approval/rejection */
    comments?: string;
    /** Optional additional data to include with approval */
    approvalData?: Record<string, unknown>;
}
export type HITLInput = HITLSuspendInput | HITLResumeInput;
export interface HITLSuspendResult {
    status: 'suspended';
    /** Unique execution ID for this HITL request */
    executionId: string;
    /** URL for approving this request */
    approvalUrl: string;
    /** Timestamp when this request expires */
    expiresAt: number;
}
export interface HITLResumeResult {
    /** Current status of the HITL request */
    status: HITLStatus;
    /** The execution ID */
    executionId: string;
    /** The suspended state (only on approval) */
    state?: Record<string, unknown>;
    /** Comments from the approver/rejector */
    comments?: string;
}
export type HITLResult = HITLSuspendResult | HITLResumeResult;
//# sourceMappingURL=types.d.ts.map