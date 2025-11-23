/**
 * Bearer Token Authentication Provider
 *
 * JWT token validation for APIs and authenticated services
 *
 * Features:
 * - JWT token validation
 * - Issuer/audience verification
 * - Expiration checking
 * - Custom claims extraction
 * - Multiple algorithm support
 *
 * @see https://jwt.io
 */
import type { AuthValidator, AuthValidationResult, TokenPayload } from '../types.js';
/**
 * Bearer token configuration
 */
export interface BearerConfig {
    /** JWT secret or public key */
    secret?: string;
    /** JWT public key URL (for RS256, etc.) */
    publicKeyUrl?: string;
    /** Expected issuer */
    issuer?: string;
    /** Expected audience */
    audience?: string;
    /** Allowed algorithms */
    algorithms?: string[];
    /** Custom token decoder (if not using standard JWT) */
    customDecoder?: (token: string) => Promise<TokenPayload>;
}
/**
 * Bearer Token Validator
 */
export declare class BearerValidator implements AuthValidator {
    private config;
    constructor(config?: BearerConfig);
    /**
     * Extract bearer token from Authorization header
     */
    extractToken(request: Request): string | null;
    /**
     * Decode JWT token (simple base64 decode, no verification yet)
     */
    private decodeToken;
    /**
     * Verify JWT token
     * Note: This is a simplified implementation. In production, use a proper JWT library.
     */
    private verifyToken;
    /**
     * Validate bearer token
     */
    validate(request: Request, env: any): Promise<AuthValidationResult>;
}
/**
 * Create Bearer validator from environment
 */
export declare function createBearerValidator(env: any): BearerValidator | null;
//# sourceMappingURL=bearer.d.ts.map