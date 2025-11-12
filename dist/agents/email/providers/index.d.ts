/**
 * Email Provider Registry
 *
 * Factory for creating email providers based on configuration
 */
import type { EmailProvider, EmailProviderConfig } from '../types/index.js';
/**
 * Create email provider from configuration
 */
export declare function createEmailProvider(config: EmailProviderConfig): EmailProvider;
/**
 * Export providers
 */
export { BaseEmailProvider } from './base.js';
export { CloudflareEmailProvider } from './cloudflare.js';
export { ResendProvider } from './resend.js';
export { SmtpProvider } from './smtp.js';
//# sourceMappingURL=index.d.ts.map