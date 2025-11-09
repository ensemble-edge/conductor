/**
 * SMS Provider Registry
 *
 * Factory for creating SMS providers based on configuration
 */
import type { SmsProvider, SmsProviderConfig } from '../types/index.js';
/**
 * Create SMS provider from configuration
 */
export declare function createSmsProvider(config: SmsProviderConfig): SmsProvider;
/**
 * Export providers
 */
export { BaseSmsProvider } from './base.js';
export { TwilioProvider } from './twilio.js';
//# sourceMappingURL=index.d.ts.map