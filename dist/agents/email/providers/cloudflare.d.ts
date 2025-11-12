/**
 * Cloudflare Email Provider
 *
 * Uses Cloudflare's native Email Workers binding
 * https://developers.cloudflare.com/email-routing/email-workers/
 */
import { BaseEmailProvider } from './base.js';
import type { EmailMessage, EmailResult, ValidationResult } from '../types/index.js';
/**
 * Cloudflare Email binding interface
 */
interface CloudflareEmailBinding {
    send(message: EmailSendRequest): Promise<EmailSendResponse>;
}
interface EmailSendRequest {
    from: string | {
        name?: string;
        email: string;
    };
    to: string | string[] | {
        name?: string;
        email: string;
    } | {
        name?: string;
        email: string;
    }[];
    subject: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
}
interface EmailSendResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}
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
export {};
//# sourceMappingURL=cloudflare.d.ts.map