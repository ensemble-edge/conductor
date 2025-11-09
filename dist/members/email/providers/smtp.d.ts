/**
 * SMTP Email Provider
 *
 * Generic SMTP provider for any SMTP server
 * Works with Cloudflare Workers via fetch-based SMTP client
 */
import { BaseEmailProvider } from './base.js';
import type { EmailMessage, EmailResult, ValidationResult } from '../types/index.js';
/**
 * SMTP Configuration
 */
export interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}
/**
 * SMTP Email Provider
 */
export declare class SmtpProvider extends BaseEmailProvider {
    private config;
    private defaultFrom;
    name: string;
    constructor(config: SmtpConfig, defaultFrom: string);
    /**
     * Send email via SMTP
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Validate configuration
     */
    validateConfig(): Promise<ValidationResult>;
    /**
     * Send email via SMTP protocol
     */
    private sendSmtp;
    /**
     * Encode string as quoted-printable
     */
    private encodeQuotedPrintable;
}
//# sourceMappingURL=smtp.d.ts.map