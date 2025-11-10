/**
 * SMS Member
 *
 * Sends SMS messages using configured SMS providers (Twilio, etc.)
 * Supports batch sending and template rendering
 */
import { BaseMember } from '../base-member.js';
import { createSmsProvider } from './providers/index.js';
import { createTemplateEngine } from '../../utils/templates/index.js';
/**
 * SMS Member
 */
export class SmsMember extends BaseMember {
    constructor(config) {
        super(config);
        // Parse SMS config
        const smsConfig = config.config;
        if (!smsConfig?.provider) {
            throw new Error('SMS member requires provider configuration');
        }
        // Initialize provider
        this.provider = createSmsProvider(smsConfig.provider);
        // Initialize template engine (default to 'simple' for SMS)
        const engine = smsConfig.templateEngine || 'simple';
        this.templateEngine = createTemplateEngine(engine);
        // Configuration
        this.rateLimit = smsConfig.rateLimit || 10; // SMS per second
    }
    /**
     * Execute SMS sending
     */
    async run(context) {
        const input = context.input;
        // Check if this is a batch SMS operation
        if ('recipients' in input && Array.isArray(input.recipients)) {
            return this.sendBatch(input, context);
        }
        // Single SMS
        return this.sendSingle(input, context);
    }
    /**
     * Send single SMS
     */
    async sendSingle(input, context) {
        // Build SMS message
        const message = this.buildMessage(input);
        // Validate provider configuration
        const validation = await this.provider.validateConfig();
        if (!validation.valid) {
            throw new Error(`Provider validation failed: ${validation.errors?.join(', ')}`);
        }
        // Send SMS
        const result = await this.provider.send(message);
        if (result.status === 'failed') {
            throw new Error(`SMS send failed: ${result.error}`);
        }
        return {
            messageId: result.messageId,
            status: result.status,
            provider: result.provider,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Send batch SMS
     */
    async sendBatch(input, context) {
        const results = [];
        const errors = [];
        const messageIds = [];
        // Rate limiting setup
        const delayMs = 1000 / this.rateLimit;
        let lastSendTime = 0;
        for (const recipient of input.recipients) {
            try {
                // Rate limiting
                const now = Date.now();
                const timeSinceLastSend = now - lastSendTime;
                if (timeSinceLastSend < delayMs) {
                    await this.delay(delayMs - timeSinceLastSend);
                }
                lastSendTime = Date.now();
                // Render message body with recipient data
                const body = await this.renderTemplate(input.body, {
                    ...input.commonData,
                    ...recipient.data,
                });
                // Build SMS for this recipient
                const smsInput = {
                    to: recipient.phone,
                    body,
                    mediaUrl: input.mediaUrl,
                };
                const message = this.buildMessage(smsInput);
                const result = await this.provider.send(message);
                results.push(result);
                if (result.status === 'sent' || result.status === 'queued') {
                    messageIds.push(result.messageId);
                }
                else {
                    errors.push({
                        phone: recipient.phone,
                        error: result.error || 'Unknown error',
                    });
                }
            }
            catch (error) {
                errors.push({
                    phone: recipient.phone,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const sent = results.filter((r) => r.status === 'sent' || r.status === 'queued').length;
        const failed = results.length - sent;
        return {
            sent,
            failed,
            messageIds,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    /**
     * Build SMS message from input
     */
    buildMessage(input) {
        return {
            to: input.to,
            from: input.from,
            body: input.body,
            mediaUrl: input.mediaUrl,
            metadata: input.metadata,
        };
    }
    /**
     * Render template with variables using template engine
     */
    async renderTemplate(template, data) {
        return await this.templateEngine.render(template, data);
    }
    /**
     * Delay execution
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Create SMS member instance
 */
export function createSmsMember(config) {
    return new SmsMember(config);
}
