/**
 * Email Provider Registry
 *
 * Factory for creating email providers based on configuration
 */
import { CloudflareEmailProvider } from './cloudflare.js';
import { ResendProvider } from './resend.js';
import { SmtpProvider } from './smtp.js';
/**
 * Create email provider from configuration
 */
export function createEmailProvider(config) {
    const from = config.from || 'noreply@example.com';
    switch (config.provider) {
        case 'cloudflare':
            if (!config.cloudflare?.binding) {
                throw new Error('Cloudflare Email binding is required');
            }
            return new CloudflareEmailProvider(config.cloudflare.binding, from, config.cloudflare.dkim ?? true);
        case 'resend':
            if (!config.resend?.apiKey) {
                throw new Error('Resend API key is required');
            }
            return new ResendProvider(config.resend.apiKey, from);
        case 'smtp':
            if (!config.smtp) {
                throw new Error('SMTP configuration is required');
            }
            return new SmtpProvider(config.smtp, from);
        default:
            throw new Error(`Unknown email provider: ${config.provider}`);
    }
}
/**
 * Export providers
 */
export { BaseEmailProvider } from './base.js';
export { CloudflareEmailProvider } from './cloudflare.js';
export { ResendProvider } from './resend.js';
export { SmtpProvider } from './smtp.js';
