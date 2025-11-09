/**
 * Email Member
 *
 * Sends emails using configured email providers (Cloudflare, Resend, SMTP)
 * Supports templates, batch sending, and email tracking
 */

import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type {
	EmailMessage,
	EmailResult,
	EmailProvider,
	EmailProviderConfig,
	EmailMemberInput,
	EmailMemberOutput,
	BatchEmailInput,
	BatchEmailOutput,
} from './types/index.js';
import { createEmailProvider } from './providers/index.js';
import { TemplateLoader } from './template-loader.js';

/**
 * Email Member configuration
 */
export interface EmailMemberConfig {
	/** Provider configuration */
	provider: EmailProviderConfig;
	/** Rate limiting (emails per second) */
	rateLimit?: number;
	/** Enable email tracking */
	tracking?: boolean;
	/** KV namespace for templates */
	templatesKv?: string;
}

/**
 * Email Member
 */
export class EmailMember extends BaseMember {
	private provider: EmailProvider;
	private templateLoader: TemplateLoader;
	private rateLimit: number;
	private tracking: boolean;

	constructor(config: any) {
		super(config);

		// Parse email config
		const emailConfig = config.config as EmailMemberConfig;
		if (!emailConfig?.provider) {
			throw new Error('Email member requires provider configuration');
		}

		// Initialize provider
		this.provider = createEmailProvider(emailConfig.provider);

		// Initialize template loader
		this.templateLoader = new TemplateLoader({
			kv: emailConfig.templatesKv as any,
		});

		// Configuration
		this.rateLimit = emailConfig.rateLimit || 10; // emails per second
		this.tracking = emailConfig.tracking ?? false;
	}

	/**
	 * Execute email sending
	 */
	protected async run(context: MemberExecutionContext): Promise<EmailMemberOutput | BatchEmailOutput> {
		const input = context.input as EmailMemberInput | BatchEmailInput;

		// Check if this is a batch email operation
		if ('recipients' in input && Array.isArray(input.recipients)) {
			return this.sendBatch(input as BatchEmailInput, context);
		}

		// Single email
		return this.sendSingle(input as EmailMemberInput, context);
	}

	/**
	 * Send single email
	 */
	private async sendSingle(
		input: EmailMemberInput,
		context: MemberExecutionContext
	): Promise<EmailMemberOutput> {
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
	private async sendBatch(
		input: BatchEmailInput,
		context: MemberExecutionContext
	): Promise<BatchEmailOutput> {
		const results: EmailResult[] = [];
		const errors: Array<{ email: string; error: string }> = [];
		const messageIds: string[] = [];

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
				const emailInput: EmailMemberInput = {
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
				} else {
					errors.push({
						email: recipient.email,
						error: result.error || 'Unknown error',
					});
				}
			} catch (error) {
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
	private async buildMessage(
		input: EmailMemberInput,
		context: MemberExecutionContext
	): Promise<EmailMessage> {
		let html = input.html;
		let text = input.text;

		// Render template if provided
		if (input.template) {
			const data = input.data || {};
			html = await this.templateLoader.render(input.template, data);

			// If no text version provided, strip HTML for plain text
			if (!text) {
				text = this.stripHtml(html);
			}
		}

		// Build message
		const message: EmailMessage = {
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
	private stripHtml(html: string): string {
		return (
			html
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
				.replace(/<[^>]+>/g, '')
				.replace(/&nbsp;/g, ' ')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&')
				.replace(/\s+/g, ' ')
				.trim()
		);
	}

	/**
	 * Delay execution
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Create email member instance
 */
export function createEmailMember(config: any): EmailMember {
	return new EmailMember(config);
}
