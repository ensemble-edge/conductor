/**
 * Email Member
 *
 * Sends emails using configured email providers (Cloudflare, Resend, SMTP)
 * Supports templates, batch sending, and email tracking
 */
import { BaseMember } from '../base-member.js';
import { createEmailProvider } from './providers/index.js';
import { createTemplateEngine } from '../../utils/templates/index.js';
import { TemplateLoader } from './template-loader.js';
/**
 * Email Member
 */
export class EmailMember extends BaseMember {
    constructor(config) {
        super(config);
        // Parse email config
        const emailConfig = config.config;
        if (!emailConfig?.provider) {
            throw new Error('Email member requires provider configuration');
        }
        // Initialize provider
        this.provider = createEmailProvider(emailConfig.provider);
        // Initialize template engine (default to 'simple')
        const engine = emailConfig.templateEngine || 'simple';
        this.templateEngine = createTemplateEngine(engine);
        // Initialize template loader for KV/file loading
        this.templateLoader = new TemplateLoader({
            engine: this.templateEngine,
            kv: emailConfig.templatesKv ? (config.env?.[emailConfig.templatesKv] || undefined) : undefined,
            defaultVersion: 'latest'
        });
        // Configuration
        this.rateLimit = emailConfig.rateLimit || 10; // emails per second
        this.tracking = emailConfig.tracking ?? false;
    }
    /**
     * Execute email sending
     */
    async run(context) {
        const input = context.input;
        // Check if this is a batch email operation
        if ('recipients' in input && Array.isArray(input.recipients)) {
            return this.sendBatch(input, context);
        }
        // Single email
        return this.sendSingle(input, context);
    }
    /**
     * Send single email
     */
    async sendSingle(input, context) {
        // Build email message
        const message = await this.buildMessage(input, context);
        // Validate provider configuration
        const validation = await this.provider.validateConfig();
        if (!validation.valid) {
            throw new Error(`Provider validation failed: ${validation.errors?.join(', ')}`);
        }
        // Send email
        const result = await this.provider.send(message);
        if (result.status === 'failed') {
            throw new Error(`Email send failed: ${result.error}`);
        }
        return {
            messageId: result.messageId,
            status: result.status,
            provider: result.provider,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Send batch emails
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
                // Build email for this recipient
                const emailInput = {
                    to: recipient.email,
                    subject: input.subject,
                    template: input.template,
                    data: {
                        ...input.commonData,
                        ...recipient.data,
                    },
                };
                const message = await this.buildMessage(emailInput, context);
                const result = await this.provider.send(message);
                results.push(result);
                if (result.status === 'sent') {
                    messageIds.push(result.messageId);
                }
                else {
                    errors.push({
                        email: recipient.email,
                        error: result.error || 'Unknown error',
                    });
                }
            }
            catch (error) {
                errors.push({
                    email: recipient.email,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const sent = results.filter((r) => r.status === 'sent').length;
        const failed = results.length - sent;
        return {
            sent,
            failed,
            messageIds,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    /**
     * Build email message from input
     */
    async buildMessage(input, context) {
        let html = input.html;
        let text = input.text;
        // Render template if provided
        if (input.template) {
            const data = input.data || {};
            // Use template loader to load and render template (handles KV, files, inline)
            html = await this.templateLoader.render(input.template, data);
            // If no text version provided, strip HTML for plain text
            if (!text) {
                text = this.stripHtml(html);
            }
        }
        // Build message
        const message = {
            to: input.to,
            cc: input.cc,
            bcc: input.bcc,
            from: input.from,
            replyTo: input.replyTo,
            subject: input.subject,
            html,
            text,
            attachments: input.attachments,
            headers: input.headers,
            tags: input.tags,
            metadata: input.metadata,
        };
        // Add tracking headers if enabled
        if (this.tracking) {
            message.headers = {
                ...message.headers,
                'X-Conductor-Tracking': 'enabled',
                'X-Conductor-Ensemble': context.state?.ensembleName || 'unknown',
            };
        }
        return message;
    }
    /**
     * Strip HTML tags for plain text version
     */
    stripHtml(html) {
        return (html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim());
    }
    /**
     * Delay execution
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Create email member instance
 */
export function createEmailMember(config) {
    return new EmailMember(config);
}
