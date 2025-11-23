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
export declare class TwilioProvider extends BaseSmsProvider {
    private accountSid;
    private authToken;
    private defaultFrom;
    private messagingServiceSid?;
    name: string;
    private apiUrl;
    constructor(accountSid: string, authToken: string, defaultFrom: string, messagingServiceSid?: string | undefined);
    /**
     * Send SMS via Twilio API
     */
    send(message: SmsMessage): Promise<SmsResult>;
    /**
     * Send SMS to single recipient
     */
    private sendSingle;
    /**
     * Map Twilio status to our status
     */
    private mapTwilioStatus;
    /**
     * Validate configuration
     */
    validateConfig(): Promise<ValidationResult>;
}
//# sourceMappingURL=twilio.d.ts.map