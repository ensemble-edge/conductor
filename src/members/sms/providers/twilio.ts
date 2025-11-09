/**
 * Twilio SMS Provider
 *
 * Uses Twilio's API for SMS delivery
 * https://www.twilio.com/docs/sms/api
 */

import { BaseSmsProvider } from './base.js';
import type { SmsMessage, SmsResult, ValidationResult } from '../types/index.js';

/**
 * Twilio SMS Provider
 */
export class TwilioProvider extends BaseSmsProvider {
	name = 'twilio';
	private apiUrl = 'https://api.twilio.com/2010-04-01';

	constructor(
		private accountSid: string,
		private authToken: string,
		private defaultFrom: string,
		private messagingServiceSid?: string
	) {
		super();
	}

	/**
	 * Send SMS via Twilio API
	 */
	async send(message: SmsMessage): Promise<SmsResult> {
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
			const recipients = this.normalizeRecipients(message.to);

			// For single recipient, send directly
			if (recipients.length === 1) {
				return await this.sendSingle(message, recipients[0]);
			}

			// For multiple recipients, send individually
			// Twilio doesn't support batch sending in a single API call
			const results: SmsResult[] = [];
			for (const recipient of recipients) {
				const result = await this.sendSingle(
					{ ...message, to: recipient },
					recipient
				);
				results.push(result);
			}

			// Return first result (or aggregate if needed)
			return results[0];
		} catch (error) {
			return {
				messageId: '',
				status: 'failed',
				provider: this.name,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Send SMS to single recipient
	 */
	private async sendSingle(message: SmsMessage, recipient: string): Promise<SmsResult> {
		// Build request body
		const body = new URLSearchParams();
		body.append('To', recipient);
		body.append('Body', message.body);

		// Use messaging service SID or from number
		if (this.messagingServiceSid) {
			body.append('MessagingServiceSid', this.messagingServiceSid);
		} else {
			body.append('From', message.from || this.defaultFrom);
		}

		// Add media URLs for MMS
		if (message.mediaUrl && message.mediaUrl.length > 0) {
			message.mediaUrl.forEach((url) => {
				body.append('MediaUrl', url);
			});
		}

		// Add status callback if metadata includes callback URL
		if (message.metadata?.statusCallback) {
			body.append('StatusCallback', message.metadata.statusCallback as string);
		}

		// Send via Twilio API
		const url = `${this.apiUrl}/Accounts/${this.accountSid}/Messages.json`;
		const auth = btoa(`${this.accountSid}:${this.authToken}`);

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${auth}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				messageId: '',
				status: 'failed',
				provider: this.name,
				error: data.message || `HTTP ${response.status}`,
			};
		}

		return {
			messageId: data.sid,
			status: this.mapTwilioStatus(data.status),
			provider: this.name,
		};
	}

	/**
	 * Map Twilio status to our status
	 */
	private mapTwilioStatus(twilioStatus: string): 'sent' | 'queued' | 'failed' {
		switch (twilioStatus) {
			case 'sent':
			case 'delivered':
				return 'sent';
			case 'queued':
			case 'accepted':
			case 'sending':
				return 'queued';
			case 'failed':
			case 'undelivered':
			default:
				return 'failed';
		}
	}

	/**
	 * Validate configuration
	 */
	async validateConfig(): Promise<ValidationResult> {
		const errors: string[] = [];

		if (!this.accountSid) {
			errors.push('Twilio Account SID is required');
		}

		if (!this.authToken) {
			errors.push('Twilio Auth Token is required');
		}

		if (!this.messagingServiceSid && !this.defaultFrom) {
			errors.push('Either Twilio Messaging Service SID or default from number is required');
		}

		if (this.defaultFrom && !this.validatePhoneNumber(this.defaultFrom)) {
			errors.push('Default from number must be in E.164 format (e.g., +1234567890)');
		}

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined,
		};
	}
}
