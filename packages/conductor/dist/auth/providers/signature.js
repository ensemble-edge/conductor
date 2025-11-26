/**
 * HMAC Signature Authentication Provider
 *
 * Validates webhook signatures using HMAC-SHA256 (or other algorithms).
 * Commonly used for webhook integrations (GitHub, Stripe, Slack, etc.).
 *
 * Features:
 * - HMAC signature validation
 * - Timestamp-based replay protection
 * - Multiple signature header formats
 * - Configurable algorithms (sha256, sha1, etc.)
 *
 * @see https://docs.ensemble.ai/conductor/building/security-authentication
 */
/**
 * Compute HMAC signature using Web Crypto API (Cloudflare Workers compatible)
 */
async function computeHMAC(message, secret, algorithm = 'sha256') {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    // Map algorithm names to Web Crypto format
    const algoMap = {
        sha256: 'SHA-256',
        sha1: 'SHA-1',
        sha384: 'SHA-384',
        sha512: 'SHA-512',
    };
    const cryptoAlgorithm = algoMap[algorithm.toLowerCase()] || 'SHA-256';
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: cryptoAlgorithm }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    // Convert to hex string
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Signature Validator
 *
 * Validates HMAC signatures on incoming requests.
 * Supports various webhook signature formats (GitHub, Stripe, Slack, etc.)
 */
export class SignatureValidator {
    constructor(config) {
        this.config = {
            secret: config.secret,
            algorithm: config.algorithm || 'sha256',
            signatureHeader: config.signatureHeader || 'x-webhook-signature',
            timestampHeader: config.timestampHeader || 'x-webhook-timestamp',
            timestampTolerance: config.timestampTolerance ?? 300,
            signaturePrefix: config.signaturePrefix || '',
            payloadFormat: config.payloadFormat || 'timestamp.body',
            customPayloadBuilder: config.customPayloadBuilder,
        };
    }
    /**
     * Extract signature from request header
     */
    extractToken(request) {
        const signature = request.headers.get(this.config.signatureHeader);
        if (!signature) {
            return null;
        }
        // Remove prefix if present (e.g., "sha256=" → actual signature)
        if (this.config.signaturePrefix && signature.startsWith(this.config.signaturePrefix)) {
            return signature.substring(this.config.signaturePrefix.length);
        }
        return signature;
    }
    /**
     * Validate the webhook signature
     */
    async validate(request, _env) {
        const signature = this.extractToken(request);
        const timestamp = request.headers.get(this.config.timestampHeader);
        // Check for required headers
        if (!signature) {
            return {
                valid: false,
                error: 'invalid_token',
                message: `Missing signature header: ${this.config.signatureHeader}`,
            };
        }
        // Timestamp validation (replay protection)
        if (this.config.timestampTolerance > 0) {
            if (!timestamp) {
                return {
                    valid: false,
                    error: 'invalid_token',
                    message: `Missing timestamp header: ${this.config.timestampHeader}`,
                };
            }
            const now = Math.floor(Date.now() / 1000);
            const requestTime = parseInt(timestamp, 10);
            if (isNaN(requestTime)) {
                return {
                    valid: false,
                    error: 'invalid_token',
                    message: 'Invalid timestamp format',
                };
            }
            if (Math.abs(now - requestTime) > this.config.timestampTolerance) {
                return {
                    valid: false,
                    error: 'expired',
                    message: `Timestamp outside tolerance window (${this.config.timestampTolerance}s)`,
                };
            }
        }
        // Get request body
        const body = await request.clone().text();
        // Build payload for signature verification
        let payload;
        switch (this.config.payloadFormat) {
            case 'timestamp.body':
                payload = `${timestamp || ''}.${body}`;
                break;
            case 'body':
                payload = body;
                break;
            case 'custom':
                if (this.config.customPayloadBuilder) {
                    payload = this.config.customPayloadBuilder(timestamp || '', body);
                }
                else {
                    payload = body;
                }
                break;
            default:
                payload = body;
        }
        // Compute expected signature
        const expectedSignature = await computeHMAC(payload, this.config.secret, this.config.algorithm);
        // Compare signatures (timing-safe)
        if (!timingSafeEqual(signature.toLowerCase(), expectedSignature.toLowerCase())) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'Invalid webhook signature',
            };
        }
        // Build auth context
        const context = {
            authenticated: true,
            method: 'bearer', // Use 'bearer' as the generic authenticated method
            custom: {
                signatureVerified: true,
                algorithm: this.config.algorithm,
                timestamp: timestamp ? parseInt(timestamp, 10) : undefined,
            },
        };
        return {
            valid: true,
            context,
        };
    }
}
/**
 * Create a signature validator with common presets
 */
export function createSignatureValidator(config) {
    return new SignatureValidator(config);
}
/**
 * Preset configurations for popular webhook providers
 */
export const signaturePresets = {
    /**
     * GitHub webhook signature format
     * Header: X-Hub-Signature-256
     * Format: sha256=<signature>
     */
    github: (secret) => ({
        secret,
        algorithm: 'sha256',
        signatureHeader: 'x-hub-signature-256',
        signaturePrefix: 'sha256=',
        payloadFormat: 'body',
        timestampTolerance: 0, // GitHub doesn't use timestamps
    }),
    /**
     * Stripe webhook signature format
     * Header: Stripe-Signature
     * Format: t=<timestamp>,v1=<signature>
     */
    stripe: (secret) => ({
        secret,
        algorithm: 'sha256',
        signatureHeader: 'stripe-signature',
        timestampHeader: 'stripe-signature', // Timestamp is in the signature header
        payloadFormat: 'custom',
        customPayloadBuilder: (timestamp, body) => `${timestamp}.${body}`,
        // Note: Stripe parsing requires extracting timestamp from header
        // This is a simplified version - full Stripe support would need custom parsing
    }),
    /**
     * Slack webhook signature format
     * Headers: X-Slack-Signature, X-Slack-Request-Timestamp
     * Format: v0=<signature>
     */
    slack: (secret) => ({
        secret,
        algorithm: 'sha256',
        signatureHeader: 'x-slack-signature',
        timestampHeader: 'x-slack-request-timestamp',
        signaturePrefix: 'v0=',
        payloadFormat: 'custom',
        customPayloadBuilder: (timestamp, body) => `v0:${timestamp}:${body}`,
        timestampTolerance: 300,
    }),
    /**
     * Generic/default webhook signature format
     * Used by Conductor and many custom implementations
     */
    default: (secret) => ({
        secret,
        algorithm: 'sha256',
        signatureHeader: 'x-webhook-signature',
        timestampHeader: 'x-webhook-timestamp',
        signaturePrefix: 'sha256=',
        payloadFormat: 'timestamp.body',
        timestampTolerance: 300,
    }),
};
