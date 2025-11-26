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
import type { AuthValidator, AuthValidationResult } from '../types.js';
/**
 * Signature validation configuration
 */
export interface SignatureConfig {
    /** Shared secret for HMAC computation */
    secret: string;
    /** Hash algorithm (default: sha256) */
    algorithm?: 'sha256' | 'sha1' | 'sha384' | 'sha512';
    /** Header name for signature (default: x-webhook-signature) */
    signatureHeader?: string;
    /** Header name for timestamp (default: x-webhook-timestamp) */
    timestampHeader?: string;
    /** Timestamp tolerance in seconds for replay protection (default: 300 = 5 minutes) */
    timestampTolerance?: number;
    /** Signature prefix (e.g., "sha256=" for GitHub-style) */
    signaturePrefix?: string;
    /** Payload format: how to construct the payload for signing */
    payloadFormat?: 'timestamp.body' | 'body' | 'custom';
    /** Custom payload builder function */
    customPayloadBuilder?: (timestamp: string, body: string) => string;
}
/**
 * Signature Validator
 *
 * Validates HMAC signatures on incoming requests.
 * Supports various webhook signature formats (GitHub, Stripe, Slack, etc.)
 */
export declare class SignatureValidator implements AuthValidator {
    private readonly config;
    constructor(config: SignatureConfig);
    /**
     * Extract signature from request header
     */
    extractToken(request: Request): string | null;
    /**
     * Validate the webhook signature
     */
    validate(request: Request, _env: any): Promise<AuthValidationResult>;
}
/**
 * Create a signature validator with common presets
 */
export declare function createSignatureValidator(config: SignatureConfig): SignatureValidator;
/**
 * Preset configurations for popular webhook providers
 */
export declare const signaturePresets: {
    /**
     * GitHub webhook signature format
     * Header: X-Hub-Signature-256
     * Format: sha256=<signature>
     */
    github: (secret: string) => SignatureConfig;
    /**
     * Stripe webhook signature format
     * Header: Stripe-Signature
     * Format: t=<timestamp>,v1=<signature>
     */
    stripe: (secret: string) => SignatureConfig;
    /**
     * Slack webhook signature format
     * Headers: X-Slack-Signature, X-Slack-Request-Timestamp
     * Format: v0=<signature>
     */
    slack: (secret: string) => SignatureConfig;
    /**
     * Generic/default webhook signature format
     * Used by Conductor and many custom implementations
     */
    default: (secret: string) => SignatureConfig;
};
//# sourceMappingURL=signature.d.ts.map