/**
 * Webhook Notifier
 *
 * Sends outbound webhook notifications with retry logic and signature verification
 */
import type { NotificationEventData, NotificationDeliveryResult } from './types.js';
export interface WebhookNotificationConfig {
    /** Webhook URL */
    url: string;
    /** Secret for HMAC signature */
    secret?: string;
    /** Max retry attempts */
    retries?: number;
    /** Request timeout in ms */
    timeout?: number;
}
export declare class WebhookNotifier {
    private config;
    constructor(config: WebhookNotificationConfig);
    /**
     * Send webhook notification with retry logic
     */
    send(eventData: NotificationEventData): Promise<NotificationDeliveryResult>;
    /**
     * Send webhook HTTP request
     */
    private sendRequest;
    /**
     * Generate HMAC signature for webhook verification
     */
    private generateSignature;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoff;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
}
//# sourceMappingURL=webhook-notifier.d.ts.map