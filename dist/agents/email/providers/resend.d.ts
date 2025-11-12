/**
 * Resend Email Provider
 *
 * Uses Resend's API for email delivery
 * https://resend.com/docs
 */
import { BaseEmailProvider } from './base.js';
import type { EmailMessage, EmailResult, ValidationResult } from '../types/index.js';
/**
 * Resend Email Provider
 */
export declare class ResendProvider extends BaseEmailProvider {
    private apiKey;
    private defaultFrom;
    name: string;
    private apiUrl;
    constructor(apiKey: string, defaultFrom: string);
    /**
     * Send email via Resend API
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Validate configuration
     */
    validateConfig(): Promise<ValidationResult>;
}
//# sourceMappingURL=resend.d.ts.map