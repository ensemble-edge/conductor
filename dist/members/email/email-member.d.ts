/**
 * Email Member
 *
 * Sends emails using configured email providers (Cloudflare, Resend, SMTP)
 * Supports templates, batch sending, and email tracking
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { EmailProviderConfig, EmailMemberOutput, BatchEmailOutput } from './types/index.js';
/**
 * Email Member configuration
 */
export interface EmailMemberConfig {
    /** Provider configuration */
    provider: EmailProviderConfig;
    /** Rate limiting (emails per second) */
    rateLimit?: number;
    /** Enable email tracking */
    tracking?: boolean;
    /** KV namespace for templates */
    templatesKv?: string;
}
/**
 * Email Member
 */
export declare class EmailMember extends BaseMember {
    private provider;
    private templateLoader;
    private rateLimit;
    private tracking;
    constructor(config: any);
    /**
     * Execute email sending
     */
    protected run(context: MemberExecutionContext): Promise<EmailMemberOutput | BatchEmailOutput>;
    /**
     * Send single email
     */
    private sendSingle;
    /**
     * Send batch emails
     */
    private sendBatch;
    /**
     * Build email message from input
     */
    private buildMessage;
    /**
     * Strip HTML tags for plain text version
     */
    private stripHtml;
    /**
     * Delay execution
     */
    private delay;
}
/**
 * Create email member instance
 */
export declare function createEmailMember(config: any): EmailMember;
//# sourceMappingURL=email-member.d.ts.map