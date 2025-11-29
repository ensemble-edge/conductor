/**
 * Unkey Authentication Provider
 *
 * Integration with Unkey.dev for API key management
 * Similar to Twilio integration for SMS
 *
 * Features:
 * - API key validation
 * - Rate limiting
 * - Service account detection
 * - Permission management
 * - Owner/tenant isolation
 *
 * @see https://unkey.dev
 */
import type { AuthValidator, AuthValidationResult } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * Unkey configuration
 */
export interface UnkeyConfig {
    /** Unkey root key (from env.UNKEY_ROOT_KEY) */
    rootKey: string;
    /** Unkey API ID (from env.UNKEY_API_ID) */
    apiId?: string;
    /** API key prefix (e.g., 'ownerco_', 'oiq_') */
    keyPrefix?: string[];
    /** Enable stealth mode (404 instead of 401) */
    stealthMode?: boolean;
}
/**
 * Unkey Auth Validator
 */
export declare class UnkeyValidator implements AuthValidator {
    private config;
    constructor(config: UnkeyConfig);
    /**
     * Extract API key from request
     * Checks multiple locations: X-API-Key header, Authorization header, query param
     */
    extractToken(request: Request): string | null;
    /**
     * Validate API key format
     */
    private isValidKeyFormat;
    /**
     * Check if key is a service account
     */
    private isServiceAccount;
    /**
     * Validate with Unkey API
     */
    validate(request: Request, env: ConductorEnv): Promise<AuthValidationResult>;
}
/**
 * Create Unkey validator from environment
 */
export declare function createUnkeyValidator(env: ConductorEnv): UnkeyValidator | null;
//# sourceMappingURL=unkey.d.ts.map