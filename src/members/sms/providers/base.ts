/**
 * Base SMS Provider
 *
 * Abstract base class for all SMS providers
 */

import type {
	SmsProvider,
	SmsMessage,
	SmsResult,
	ValidationResult,
	SmsStatus,
} from '../types/index.js';

/**
 * Abstract base SMS provider
 */
export abstract class BaseSmsProvider implements SmsProvider {
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
	async getStatus?(messageId: string): Promise<SmsStatus>;

	/**
	 * Normalize recipients to array
	 */
	protected normalizeRecipients(recipients: string | string[]): string[] {
		return Array.isArray(recipients) ? recipients : [recipients];
	}

	/**
	 * Validate phone number format (basic E.164 validation)
	 */
	protected validatePhoneNumber(phone: string): boolean {
		// E.164 format: +[country code][number]
		const e164Regex = /^\+[1-9]\d{1,14}$/;
		return e164Regex.test(phone);
	}

	/**
	 * Validate required fields
	 */
	protected validateMessage(message: SmsMessage): ValidationResult {
		const errors: string[] = [];

		if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
			errors.push('Recipient (to) is required');
		}

		if (!message.body || message.body.trim() === '') {
			errors.push('Message body is required');
		}

		// Validate phone numbers
		const recipients = this.normalizeRecipients(message.to);
		for (const phone of recipients) {
			if (!this.validatePhoneNumber(phone)) {
				errors.push(`Invalid phone number format: ${phone} (must be E.164 format, e.g., +1234567890)`);
			}
		}

		// Check message length (160 chars for SMS, 1600 for concatenated)
		if (message.body.length > 1600) {
			errors.push('Message body exceeds maximum length of 1600 characters');
		}

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined,
		};
	}
}
