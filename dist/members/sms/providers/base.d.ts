/**
 * Base SMS Provider
 *
 * Abstract base class for all SMS providers
 */
import type { SmsProvider, SmsMessage, SmsResult, ValidationResult, SmsStatus } from '../types/index.js';
/**
 * Abstract base SMS provider
 */
export declare abstract class BaseSmsProvider implements SmsProvider {
    abstract name: string;
    /**
     * Send an SMS
     */
    abstract send(message: SmsMessage): Promise<SmsResult>;
    /**
     * Validate provider configuration
     */
    abstract validateConfig(): Promise<ValidationResult>;
    /**
     * Get SMS status (optional)
     */
    getStatus?(messageId: string): Promise<SmsStatus>;
    /**
     * Normalize recipients to array
     */
    protected normalizeRecipients(recipients: string | string[]): string[];
    /**
     * Validate phone number format (basic E.164 validation)
     */
    protected validatePhoneNumber(phone: string): boolean;
    /**
     * Validate required fields
     */
    protected validateMessage(message: SmsMessage): ValidationResult;
}
//# sourceMappingURL=base.d.ts.map