/**
 * SMS Agent
 *
 * Sends SMS messages using configured SMS providers (Twilio, etc.)
 * Supports batch sending and template rendering
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { SmsProviderConfig, SmsMemberOutput, BatchSmsOutput } from './types/index.js';
import { type TemplateEngine } from '../../utils/templates/index.js';
/**
 * SMS Agent configuration
 */
export interface SmsAgentConfig {
    /** Provider configuration */
    provider: SmsProviderConfig;
    /** Rate limiting (SMS per second) */
    rateLimit?: number;
    /** Template engine to use (default: 'simple') */
    templateEngine?: TemplateEngine;
}
/**
 * SMS Agent
 */
export declare class SmsAgent extends BaseAgent {
    private provider;
    private templateEngine;
    private rateLimit;
    constructor(config: any);
    /**
     * Execute SMS sending
     */
    protected run(context: AgentExecutionContext): Promise<SmsMemberOutput | BatchSmsOutput>;
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
 * Create SMS agent instance
 */
export declare function createSmsAgent(config: any): SmsAgent;
export declare const SmsMember: typeof SmsAgent;
export type SmsMemberConfig = SmsAgentConfig;
//# sourceMappingURL=sms-agent.d.ts.map