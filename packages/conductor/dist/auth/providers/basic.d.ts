/**
 * Basic Authentication Provider
 *
 * Implements HTTP Basic Authentication (RFC 7617).
 * Validates username:password credentials sent in the Authorization header.
 *
 * Features:
 * - Standard HTTP Basic auth validation
 * - Multiple credential support
 * - Optional realm specification
 * - Secure comparison to prevent timing attacks
 *
 * @see https://docs.ensemble.ai/conductor/building/security-authentication
 */
import type { AuthValidator, AuthValidationResult } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * Basic auth configuration
 */
export interface BasicAuthConfig {
    /**
     * Credentials in "username:password" format.
     * Can be a single string or array of valid credentials.
     */
    credentials: string | string[];
    /**
     * Authentication realm (displayed in browser prompt)
     * @default "Conductor API"
     */
    realm?: string;
}
/**
 * Basic Auth Validator
 *
 * Validates HTTP Basic Authentication credentials.
 */
export declare class BasicAuthValidator implements AuthValidator {
    private readonly credentials;
    private readonly realm;
    constructor(config: BasicAuthConfig);
    /**
     * Extract base64-encoded credentials from Authorization header
     */
    extractToken(request: Request): string | null;
    /**
     * Validate basic auth credentials
     */
    validate(request: Request, _env: ConductorEnv): Promise<AuthValidationResult>;
    /**
     * Get WWW-Authenticate header value for 401 responses
     */
    getWWWAuthenticateHeader(): string;
}
/**
 * Create a basic auth validator
 */
export declare function createBasicValidator(config: BasicAuthConfig): BasicAuthValidator;
export declare function createBasicValidator(credentials: string | string[]): BasicAuthValidator;
/**
 * Create a basic auth validator from environment variable
 *
 * Looks for BASIC_AUTH_CREDENTIALS in the environment.
 * Can be a single credential or comma-separated list.
 */
export declare function createBasicValidatorFromEnv(env: Record<string, string>): BasicAuthValidator | null;
//# sourceMappingURL=basic.d.ts.map