/**
 * Email Agent
 *
 * Sends emails using configured email providers (Cloudflare, Resend, SMTP)
 * Supports templates, batch sending, and email tracking
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { EmailProviderConfig, EmailMemberOutput, BatchEmailOutput } from './types/index.js';
import { type TemplateEngine } from '../../utils/templates/index.js';
/**
 * Email Agent configuration
 */
export interface EmailAgentConfig {
    /** Provider configuration */
    provider: EmailProviderConfig;
    /** Rate limiting (emails per second) */
    rateLimit?: number;
    /** Enable email tracking */
    tracking?: boolean;
    /** KV namespace for templates */
    templatesKv?: string;
    /** Template engine to use (default: 'simple') */
    templateEngine?: TemplateEngine;
}
/**
 * Email Agent
 */
export declare class EmailAgent extends BaseAgent {
    private provider;
    private templateEngine;
    private templateLoader;
    private rateLimit;
    private tracking;
    constructor(config: any);
    /**
     * Execute email sending
     */
    protected run(context: AgentExecutionContext): Promise<EmailMemberOutput | BatchEmailOutput>;
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
 * Create email agent instance
 */
export declare function createEmailMember(config: any): EmailAgent;
//# sourceMappingURL=email-agent.d.ts.map