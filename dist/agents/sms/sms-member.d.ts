/**
 * SMS Member
 *
 * Sends SMS messages using configured SMS providers (Twilio, etc.)
 * Supports batch sending and template rendering
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { SmsProviderConfig, SmsMemberOutput, BatchSmsOutput } from './types/index.js';
import { type TemplateEngine } from '../../utils/templates/index.js';
/**
 * SMS Member configuration
 */
export interface SmsMemberConfig {
    /** Provider configuration */
    provider: SmsProviderConfig;
    /** Rate limiting (SMS per second) */
    rateLimit?: number;
    /** Template engine to use (default: 'simple') */
    templateEngine?: TemplateEngine;
}
/**
 * SMS Member
 */
export declare class SmsMember extends BaseMember {
    private provider;
    private templateEngine;
    private rateLimit;
    constructor(config: any);
    /**
     * Execute SMS sending
     */
    protected run(context: MemberExecutionContext): Promise<SmsMemberOutput | BatchSmsOutput>;
    /**
     * Send single SMS
     */
    private sendSingle;
    /**
     * Send batch SMS
     */
    private sendBatch;
    /**
     * Build SMS message from input
     */
    private buildMessage;
    /**
     * Render template with variables using template engine
     */
    private renderTemplate;
    /**
     * Delay execution
     */
    private delay;
}
/**
 * Create SMS member instance
 */
export declare function createSmsMember(config: any): SmsMember;
//# sourceMappingURL=sms-member.d.ts.map