/**
 * Custom Authentication Validators
 *
 * Custom validators for webhook signature verification and other use cases
 *
 * Includes:
 * - Stripe webhook signature validation
 * - GitHub webhook signature validation
 * - Twilio webhook signature validation
 * - Custom validator interface
 */
import type { AuthValidator, AuthValidationResult } from '../types.js';
/**
 * Stripe Webhook Signature Validator
 */
export declare class StripeSignatureValidator implements AuthValidator {
    private webhookSecret;
    constructor(webhookSecret: string);
    extractToken(request: Request): string | null;
    validate(request: Request, env: any): Promise<AuthValidationResult>;
    private verifyStripeSignature;
    private computeHMAC;
    private secureCompare;
}
/**
 * GitHub Webhook Signature Validator
 */
export declare class GitHubSignatureValidator implements AuthValidator {
    private webhookSecret;
    constructor(webhookSecret: string);
    extractToken(request: Request): string | null;
    validate(request: Request, env: any): Promise<AuthValidationResult>;
    private verifyGitHubSignature;
    private computeHMAC;
    private secureCompare;
}
/**
 * Twilio Webhook Signature Validator
 */
export declare class TwilioSignatureValidator implements AuthValidator {
    private authToken;
    constructor(authToken: string);
    extractToken(request: Request): string | null;
    validate(request: Request, env: any): Promise<AuthValidationResult>;
    private verifyTwilioSignature;
    private computeHMAC;
    private secureCompare;
}
/**
 * Custom Validator Registry
 */
export declare class CustomValidatorRegistry {
    private validators;
    /**
     * Register a custom validator
     */
    register(name: string, validator: AuthValidator): void;
    /**
     * Get a validator by name
     */
    get(name: string): AuthValidator | undefined;
    /**
     * Check if validator exists
     */
    has(name: string): boolean;
    /**
     * Register built-in validators from environment
     */
    registerBuiltIn(env: any): void;
}
/**
 * Create custom validator registry
 */
export declare function createCustomValidatorRegistry(env: any): CustomValidatorRegistry;
//# sourceMappingURL=custom.d.ts.map