/**
 * SMTP Email Provider
 *
 * Generic SMTP provider for any SMTP server
 * Works with Cloudflare Workers via fetch-based SMTP client
 */
import { BaseEmailProvider } from './base.js';
/**
 * SMTP Email Provider
 */
export class SmtpProvider extends BaseEmailProvider {
    constructor(config, defaultFrom) {
        super();
        this.config = config;
        this.defaultFrom = defaultFrom;
        this.name = 'smtp';
    }
    /**
     * Send email via SMTP
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
            // Build SMTP envelope
            const from = message.from || this.defaultFrom;
            const to = this.normalizeRecipients(message.to);
            const messageId = `<${Date.now()}.${Math.random().toString(36)}@${from.split('@')[1]}>`;
            // Build email headers
            const headers = [
                `Message-ID: ${messageId}`,
                `From: ${from}`,
                `To: ${to.join(', ')}`,
                `Subject: ${message.subject}`,
                `Date: ${new Date().toUTCString()}`,
                'MIME-Version: 1.0',
            ];
            // Add optional headers
            if (message.cc) {
                headers.push(`Cc: ${this.normalizeRecipients(message.cc).join(', ')}`);
            }
            if (message.bcc) {
                headers.push(`Bcc: ${this.normalizeRecipients(message.bcc).join(', ')}`);
            }
            if (message.replyTo) {
                headers.push(`Reply-To: ${message.replyTo}`);
            }
            // Add custom headers
            if (message.headers) {
                for (const [key, value] of Object.entries(message.headers)) {
                    headers.push(`${key}: ${value}`);
                }
            }
            // Build email body
            let body = '';
            if (message.html && message.text) {
                // Multipart alternative
                const boundary = `boundary_${Date.now()}_${Math.random().toString(36)}`;
                headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
                body = [
                    '',
                    `--${boundary}`,
                    'Content-Type: text/plain; charset=utf-8',
                    'Content-Transfer-Encoding: quoted-printable',
                    '',
                    this.encodeQuotedPrintable(message.text),
                    '',
                    `--${boundary}`,
                    'Content-Type: text/html; charset=utf-8',
                    'Content-Transfer-Encoding: quoted-printable',
                    '',
                    this.encodeQuotedPrintable(message.html),
                    '',
                    `--${boundary}--`,
                ].join('\r\n');
            }
            else if (message.html) {
                headers.push('Content-Type: text/html; charset=utf-8');
                headers.push('Content-Transfer-Encoding: quoted-printable');
                body = '\r\n' + this.encodeQuotedPrintable(message.html);
            }
            else if (message.text) {
                headers.push('Content-Type: text/plain; charset=utf-8');
                headers.push('Content-Transfer-Encoding: quoted-printable');
                body = '\r\n' + this.encodeQuotedPrintable(message.text);
            }
            // Send via SMTP
            const response = await this.sendSmtp(from, to, headers.join('\r\n') + body);
            if (!response.success) {
                return {
                    messageId: '',
                    status: 'failed',
                    provider: this.name,
                    error: response.error || 'SMTP send failed',
                };
            }
            return {
                messageId: messageId.slice(1, -1), // Remove < >
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
        if (!this.config.host) {
            errors.push('SMTP host is required');
        }
        if (!this.config.port || this.config.port < 1 || this.config.port > 65535) {
            errors.push('Valid SMTP port is required (1-65535)');
        }
        if (!this.config.auth?.user) {
            errors.push('SMTP username is required');
        }
        if (!this.config.auth?.pass) {
            errors.push('SMTP password is required');
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
    /**
     * Send email via SMTP protocol
     */
    async sendSmtp(from, to, message) {
        try {
            // In Cloudflare Workers, we need to use a fetch-based SMTP proxy
            // or connect directly via TCP sockets (if available)
            // For now, we'll use a simple SMTP-over-HTTP proxy pattern
            const protocol = this.config.secure ? 'smtps' : 'smtp';
            const url = `${protocol}://${this.config.host}:${this.config.port}`;
            // This is a simplified implementation
            // In production, you'd use a proper SMTP client library
            // or an SMTP-over-HTTP proxy service
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'message/rfc822',
                    'Authorization': `Basic ${btoa(`${this.config.auth.user}:${this.config.auth.pass}`)}`,
                },
                body: `MAIL FROM:<${from}>\r\nRCPT TO:<${to.join('>,<')}>\r\nDATA\r\n${message}\r\n.\r\n`,
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: `SMTP error: ${response.status} ${response.statusText}`,
                };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown SMTP error',
            };
        }
    }
    /**
     * Encode string as quoted-printable
     */
    encodeQuotedPrintable(text) {
        return text
            .replace(/[^\x20-\x7E]/g, (char) => {
            const hex = char.charCodeAt(0).toString(16).toUpperCase();
            return '=' + (hex.length === 1 ? '0' + hex : hex);
        })
            .replace(/=/g, '=3D')
            .replace(/\r\n/g, '\n')
            .split('\n')
            .map((line) => {
            // Split long lines
            if (line.length <= 76)
                return line;
            const result = [];
            for (let i = 0; i < line.length; i += 75) {
                result.push(line.slice(i, i + 75) + '=');
            }
            return result.join('\r\n');
        })
            .join('\r\n');
    }
}
