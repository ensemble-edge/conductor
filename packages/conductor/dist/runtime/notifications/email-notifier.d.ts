/**
 * Email Notifier
 *
 * Sends email notifications using Cloudflare Email Routing / MailChannels
 */
import type { NotificationEventData, NotificationDeliveryResult } from './types.js';
import type { ConductorEnv } from '../../types/env.js';
export interface EmailNotificationConfig {
    /** Recipient email addresses */
    to: string[];
    /** Sender email address */
    from?: string;
    /** Email subject (supports template variables) */
    subject?: string;
    /** Events that trigger this email */
    events: string[];
}
export declare class EmailNotifier {
    private config;
    constructor(config: EmailNotificationConfig);
    /**
     * Send email notification
     */
    send(eventData: NotificationEventData, env: ConductorEnv): Promise<NotificationDeliveryResult>;
    /**
     * Build email data from event
     */
    private buildEmailData;
    /**
     * Interpolate subject template with event data
     */
    private interpolateSubject;
    /**
     * Build plain text email body
     */
    private buildTextBody;
    /**
     * Build HTML email body
     */
    private buildHtmlBody;
    /**
     * Send email using MailChannels API
     */
    private sendEmail;
}
//# sourceMappingURL=email-notifier.d.ts.map