/**
 * Email Member Types
 *
 * Type definitions for the Email member system including
 * messages, providers, and responses.
 */

/**
 * Email message structure
 */
export interface EmailMessage {
	/** Recipient email address(es) */
	to: string | string[];
	/** CC recipients */
	cc?: string | string[];
	/** BCC recipients */
	bcc?: string | string[];
	/** Sender email address */
	from?: string;
	/** Reply-to address */
	replyTo?: string;
	/** Email subject line */
	subject: string;
	/** HTML content */
	html?: string;
	/** Plain text content */
	text?: string;
	/** Email attachments */
	attachments?: EmailAttachment[];
	/** Custom headers */
	headers?: Record<string, string>;
	/** Email tags for tracking */
	tags?: string[];
	/** Custom metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
	/** Filename */
	filename: string;
	/** Content (base64 or buffer) */
	content: string | Buffer;
	/** Content type */
	contentType?: string;
	/** Encoding (default: base64) */
	encoding?: string;
}

/**
 * Email send result
 */
export interface EmailResult {
	/** Message ID from provider */
	messageId: string;
	/** Send status */
	status: 'sent' | 'queued' | 'failed';
	/** Provider name */
	provider: string;
	/** Error message if failed */
	error?: string;
}

/**
 * Email status response
 */
export interface EmailStatus {
	/** Message ID */
	messageId: string;
	/** Current status */
	status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
	/** Timestamp of status */
	timestamp: string;
	/** Additional details */
	details?: Record<string, unknown>;
}

/**
 * Email provider interface
 */
export interface EmailProvider {
	/** Provider name */
	name: string;

	/** Send an email */
	send(message: EmailMessage): Promise<EmailResult>;

	/** Verify email address (optional) */
	verify?(email: string): Promise<boolean>;

	/** Get email status (optional) */
	getStatus?(messageId: string): Promise<EmailStatus>;

	/** Validate provider configuration */
	validateConfig(): Promise<ValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors?: string[];
}

/**
 * Email provider configuration
 */
export interface EmailProviderConfig {
	/** Provider type */
	provider: 'cloudflare' | 'resend' | 'sendgrid' | 'smtp' | string;

	/** Cloudflare Email config */
	cloudflare?: {
		/** Email binding name */
		binding?: string;
		/** Enable DKIM */
		dkim?: boolean;
	};

	/** Resend config */
	resend?: {
		/** API key */
		apiKey: string;
		/** Domain */
		domain?: string;
	};

	/** SendGrid config */
	sendgrid?: {
		/** API key */
		apiKey: string;
	};

	/** SMTP config */
	smtp?: {
		/** SMTP host */
		host: string;
		/** SMTP port */
		port: number;
		/** Use TLS */
		secure: boolean;
		/** Authentication */
		auth: {
			user: string;
			pass: string;
		};
	};

	/** Default sender */
	from?: string;
	/** Default sender name */
	fromName?: string;
}

/**
 * Email member input
 */
export interface EmailMemberInput {
	/** Email message */
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	from?: string;
	replyTo?: string;
	subject: string;
	html?: string;
	text?: string;
	attachments?: EmailAttachment[];
	headers?: Record<string, string>;
	tags?: string[];
	metadata?: Record<string, unknown>;

	/** Template to use */
	template?: string;
	/** Template data */
	data?: Record<string, unknown>;
}

/**
 * Email member output
 */
export interface EmailMemberOutput {
	messageId: string;
	status: string;
	provider: string;
	timestamp: string;
}

/**
 * Batch email input
 */
export interface BatchEmailInput {
	/** Recipients with personalized data */
	recipients: Array<{
		email: string;
		data?: Record<string, unknown>;
	}>;
	/** Template to use */
	template: string;
	/** Subject (can include variables) */
	subject: string;
	/** Common data for all recipients */
	commonData?: Record<string, unknown>;
}

/**
 * Batch email output
 */
export interface BatchEmailOutput {
	sent: number;
	failed: number;
	messageIds: string[];
	errors?: Array<{
		email: string;
		error: string;
	}>;
}
