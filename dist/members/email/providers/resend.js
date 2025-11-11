/**
 * Resend Email Provider
 *
 * Uses Resend's API for email delivery
 * https://resend.com/docs
 */
import { BaseEmailProvider } from './base.js';
/**
 * Resend Email Provider
 */
export class ResendProvider extends BaseEmailProvider {
    constructor(apiKey, defaultFrom) {
        super();
        this.apiKey = apiKey;
        this.defaultFrom = defaultFrom;
        this.name = 'resend';
        this.apiUrl = 'https://api.resend.com/emails';
    }
    /**
     * Send email via Resend API
     */
    async send(message) {
        // Validate message
        const validation = this.validateMessage(message);
        if (!validation.valid) {
            return {
                messageId: '',
                status: 'failed',
                provider: this.name,
                error: validation.errors?.join(', '),
            };
        }
        try {
            // Build Resend request
            const request = {
                from: message.from || this.defaultFrom,
                to: message.to,
                subject: message.subject,
                html: message.html,
                text: message.text,
            };
            // Optional fields
            if (message.cc)
                request.cc = message.cc;
            if (message.bcc)
                request.bcc = message.bcc;
            if (message.replyTo)
                request.reply_to = message.replyTo;
            if (message.headers)
                request.headers = message.headers;
            // Convert attachments
            if (message.attachments) {
                request.attachments = message.attachments.map((att) => ({
                    filename: att.filename,
                    content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
                }));
            }
            // Convert tags
            if (message.tags) {
                request.tags = message.tags.map((tag) => ({
                    name: tag,
                    value: 'true',
                }));
            }
            // Send via API
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            const data = (await response.json());
            if (!response.ok || data.error) {
                return {
                    messageId: '',
                    status: 'failed',
                    provider: this.name,
                    error: data.error?.message || `HTTP ${response.status}`,
                };
            }
            return {
                messageId: data.id,
                status: 'sent',
                provider: this.name,
            };
        }
        catch (error) {
            return {
                messageId: '',
                status: 'failed',
                provider: this.name,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Validate configuration
     */
    async validateConfig() {
        const errors = [];
        if (!this.apiKey) {
            errors.push('Resend API key is required');
        }
        if (!this.defaultFrom) {
            errors.push('Default from address is required');
        }
        else if (!this.validateEmail(this.defaultFrom)) {
            errors.push('Default from address is invalid');
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
}
