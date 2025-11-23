/**
 * SMS Provider Registry
 *
 * Factory for creating SMS providers based on configuration
 */
import { TwilioProvider } from './twilio.js';
/**
 * Create SMS provider from configuration
 */
export function createSmsProvider(config) {
    const from = config.from || '';
    switch (config.provider) {
        case 'twilio':
            if (!config.twilio) {
                throw new Error('Twilio configuration is required');
            }
            if (!config.twilio.accountSid) {
                throw new Error('Twilio Account SID is required');
            }
            if (!config.twilio.authToken) {
                throw new Error('Twilio Auth Token is required');
            }
            return new TwilioProvider(config.twilio.accountSid, config.twilio.authToken, from, config.twilio.messagingServiceSid);
        default:
            throw new Error(`Unknown SMS provider: ${config.provider}`);
    }
}
/**
 * Export providers
 */
export { BaseSmsProvider } from './base.js';
export { TwilioProvider } from './twilio.js';
