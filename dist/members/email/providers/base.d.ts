/**
 * Base Email Provider
 *
 * Abstract base class for all email providers
 */
import type { EmailProvider, EmailMessage, EmailResult, ValidationResult, EmailStatus } from '../types/index.js';
/**
 * Abstract base email provider
 */
export declare abstract class BaseEmailProvider implements EmailProvider {
    abstract name: string;
    /**
     * Send an email
     */
    abstract send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Validate provider configuration
     */
    abstract validateConfig(): Promise<ValidationResult>;
    /**
     * Verify email address (optional)
     */
    verify?(email: string): Promise<boolean>;
    /**
     * Get email status (optional)
     */
    getStatus?(messageId: string): Promise<EmailStatus>;
    /**
     * Normalize recipients to array
     */
    protected normalizeRecipients(recipients: string | string[]): string[];
    /**
     * Validate email address format
     */
    protected validateEmail(email: string): boolean;
    /**
     * Validate required fields
     */
    protected validateMessage(message: EmailMessage): ValidationResult;
}
//# sourceMappingURL=base.d.ts.map