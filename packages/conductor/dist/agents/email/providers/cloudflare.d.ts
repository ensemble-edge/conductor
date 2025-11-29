/**
 * Cloudflare Email Provider
 *
 * Uses Cloudflare's native Email Workers binding
 * https://developers.cloudflare.com/email-routing/email-workers/
 */
import { BaseEmailProvider } from './base.js';
import type { EmailMessage, EmailResult, ValidationResult, CloudflareEmailBinding } from '../types/index.js';
/**
 * Cloudflare Email Provider
 */
export declare class CloudflareEmailProvider extends BaseEmailProvider {
    private binding;
    private defaultFrom;
    private enableDkim;
    name: string;
    constructor(binding: CloudflareEmailBinding, defaultFrom: string, enableDkim?: boolean);
    /**
     * Send email via Cloudflare Email Workers
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Validate configuration
     */
    validateConfig(): Promise<ValidationResult>;
}
//# sourceMappingURL=cloudflare.d.ts.map