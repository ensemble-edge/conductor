/**
 * Trigger Authentication Bridge
 *
 * Bridges trigger auth configuration (from YAML) to the unified auth provider system.
 * This allows triggers to use the same auth mechanisms as API routes.
 *
 * Features:
 * - Unified auth handling for HTTP, Webhook, and MCP triggers
 * - Support for bearer, signature, basic, and apiKey auth
 * - Automatic provider selection based on config
 * - Consistent auth context for all routes
 *
 * @see https://docs.ensemble.ai/conductor/building/security-authentication
 */
import type { AuthValidator, AuthValidationResult, AuthContext } from './types.js';
/**
 * Trigger auth configuration (from YAML)
 */
export interface TriggerAuthConfig {
    /** Auth type */
    type: 'bearer' | 'signature' | 'basic' | 'apiKey' | 'unkey';
    /** Shared secret (for bearer, signature, basic) */
    secret?: string;
    /** Hash algorithm for signature auth (default: sha256) */
    algorithm?: 'sha256' | 'sha1' | 'sha384' | 'sha512';
    /** Custom signature header name */
    signatureHeader?: string;
    /** Custom timestamp header name */
    timestampHeader?: string;
    /** Timestamp tolerance in seconds (default: 300) */
    timestampTolerance?: number;
    /** Preset signature format (github, stripe, slack, default) */
    preset?: 'github' | 'stripe' | 'slack' | 'default';
    /** Basic auth realm */
    realm?: string;
}
/**
 * Get the appropriate auth validator based on trigger config
 */
export declare function getValidatorForTrigger(config: TriggerAuthConfig, env: any): AuthValidator;
/**
 * Create auth middleware for triggers using the unified provider system
 *
 * This is the main entry point for trigger auth. It creates a Hono middleware
 * that validates authentication using the appropriate provider.
 *
 * @param authConfig - Auth configuration from trigger YAML
 * @param env - Environment bindings (for KV, secrets, etc.)
 * @returns Hono middleware function
 */
export declare function createTriggerAuthMiddleware(authConfig: TriggerAuthConfig, env: any): (c: any, next: () => Promise<void>) => Promise<Response | void>;
/**
 * Validate trigger auth config
 *
 * Used during build/startup to catch configuration errors early.
 */
export declare function validateTriggerAuthConfig(config: TriggerAuthConfig): string[];
/**
 * Re-export types for convenience
 */
export type { AuthValidator, AuthValidationResult, AuthContext };
//# sourceMappingURL=trigger-auth.d.ts.map