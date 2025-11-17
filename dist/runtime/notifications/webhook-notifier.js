/**
 * Webhook Notifier
 *
 * Sends outbound webhook notifications with retry logic and signature verification
 */
import { createLogger } from '../../observability/index.js';
const logger = createLogger({ serviceName: 'webhook-notifier' });
export class WebhookNotifier {
    constructor(config) {
        this.config = {
            retries: config.retries || 3,
            timeout: config.timeout || 5000,
            ...config,
        };
    }
    /**
     * Send webhook notification with retry logic
     */
    async send(eventData) {
        const startTime = Date.now();
        const maxRetries = this.config.retries || 0;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.sendRequest(eventData, attempt);
                return {
                    success: true,
                    type: 'webhook',
                    target: this.config.url,
                    event: eventData.event,
                    duration: Date.now() - startTime,
                    statusCode: result.status,
                    attempts: attempt + 1,
                };
            }
            catch (error) {
                // Log the error
                logger.error('Webhook notification failed', error instanceof Error ? error : undefined, {
                    url: this.config.url,
                    attempt: attempt + 1,
                    maxRetries: maxRetries + 1,
                });
                // If this is the last attempt, return failure
                if (attempt === maxRetries) {
                    return {
                        success: false,
                        type: 'webhook',
                        target: this.config.url,
                        event: eventData.event,
                        duration: Date.now() - startTime,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        attempts: attempt + 1,
                    };
                }
                // Otherwise, wait and retry with exponential backoff
                const delay = this.calculateBackoff(attempt);
                await this.sleep(delay);
            }
        }
        // Fallback return (shouldn't reach here)
        return {
            success: false,
            type: 'webhook',
            target: this.config.url,
            event: eventData.event,
            duration: Date.now() - startTime,
            error: 'Maximum retries exceeded',
            attempts: maxRetries + 1,
        };
    }
    /**
     * Send webhook HTTP request
     */
    async sendRequest(eventData, attempt) {
        const timestamp = Math.floor(Date.now() / 1000);
        // Build payload
        const payload = {
            event: eventData.event,
            timestamp: eventData.timestamp,
            data: eventData.data,
        };
        const body = JSON.stringify(payload);
        // Generate signature if secret is provided
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Conductor-Webhook/1.0',
            'X-Conductor-Event': eventData.event,
            'X-Conductor-Timestamp': timestamp.toString(),
            'X-Conductor-Delivery-Attempt': (attempt + 1).toString(),
        };
        if (this.config.secret) {
            const signature = await this.generateSignature(body, timestamp, this.config.secret);
            headers['X-Conductor-Signature'] = signature;
        }
        // Send request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal,
            });
            // Check for success status codes (2xx or 3xx)
            if (!response.ok && response.status >= 400) {
                throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
            }
            return { status: response.status };
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Generate HMAC signature for webhook verification
     */
    async generateSignature(body, timestamp, secret) {
        const payload = `${timestamp}.${body}`;
        // Use Web Crypto API (available in Cloudflare Workers)
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        return `sha256=${hashHex}`;
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(attempt) {
        // Exponential backoff: 1s, 5s, 30s, 2m, 5m
        const delays = [1000, 5000, 30000, 120000, 300000];
        return delays[Math.min(attempt, delays.length - 1)];
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
