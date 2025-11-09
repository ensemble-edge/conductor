/**
 * Base Email Provider
 *
 * Abstract base class for all email providers
 */

import type {
	EmailProvider,
	EmailMessage,
	EmailResult,
	ValidationResult,
	EmailStatus,
} from '../types/index.js';

/**
 * Abstract base email provider
 */
export abstract class BaseEmailProvider implements EmailProvider {
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
	async verify?(email: string): Promise<boolean>;

	/**
	 * Get email status (optional)
	 */
	async getStatus?(messageId: string): Promise<EmailStatus>;

	/**
	 * Normalize recipients to array
	 */
	protected normalizeRecipients(recipients: string | string[]): string[] {
		return Array.isArray(recipients) ? recipients : [recipients];
	}

	/**
	 * Validate email address format
	 */
	protected validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Validate required fields
	 */
	protected validateMessage(message: EmailMessage): ValidationResult {
		const errors: string[] = [];

		if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
			errors.push('Recipient (to) is required');
		}

		if (!message.subject || message.subject.trim() === '') {
			errors.push('Subject is required');
		}

		if (!message.html && !message.text) {
			errors.push('Either html or text content is required');
		}

		// Validate email addresses
		const recipients = this.normalizeRecipients(message.to);
		for (const email of recipients) {
			if (!this.validateEmail(email)) {
				errors.push(`Invalid email address: ${email}`);
			}
		}

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined,
		};
	}
}
