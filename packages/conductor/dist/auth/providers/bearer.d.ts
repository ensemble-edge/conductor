/**
 * Bearer Token Authentication Provider
 *
 * JWT token validation for APIs and authenticated services
 *
 * Features:
 * - Cryptographic JWT signature verification using jose
 * - Support for HMAC (HS256/384/512) and RSA (RS256/384/512) algorithms
 * - Issuer/audience verification
 * - Expiration checking
 * - Custom claims extraction
 * - JWKS (JSON Web Key Set) support for key rotation
 *
 * @see https://jwt.io
 * @see https://github.com/panva/jose
 */
import * as jose from 'jose';
import type { AuthValidator, AuthValidationResult, TokenPayload } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * Bearer token configuration
 */
export interface BearerConfig {
    /** JWT secret for HMAC algorithms (HS256, HS384, HS512) */
    secret?: string;
    /** JWKS URL for RSA/EC algorithms - enables automatic key rotation */
    jwksUrl?: string;
    /** Expected issuer (validates 'iss' claim) */
    issuer?: string;
    /** Expected audience (validates 'aud' claim) */
    audience?: string;
    /** Allowed algorithms (defaults to ['HS256', 'RS256']) */
    algorithms?: jose.JWTVerifyOptions['algorithms'];
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
     * Get JWKS key resolver for RSA/EC algorithms
     */
    private getJWKS;
    /**
     * Get HMAC secret key for HS256/384/512 algorithms
     */
    private getSecretKey;
    /**
     * Verify JWT token with cryptographic signature verification
     *
     * Uses the jose library to properly verify:
     * 1. Signature integrity (HMAC or RSA/EC)
     * 2. Expiration time (exp claim)
     * 3. Not-before time (nbf claim)
     * 4. Issuer (iss claim) if configured
     * 5. Audience (aud claim) if configured
     */
    private verifyToken;
    /**
     * Validate bearer token
     */
    validate(request: Request, _env: ConductorEnv): Promise<AuthValidationResult>;
}
/**
 * Create Bearer validator from environment
 *
 * Environment variables:
 * - JWT_SECRET: HMAC secret for HS256/384/512 algorithms
 * - JWT_JWKS_URL: URL to JWKS endpoint for RSA/EC algorithms (supports key rotation)
 * - JWT_ISSUER: Expected issuer claim
 * - JWT_AUDIENCE: Expected audience claim
 * - JWT_ALGORITHMS: Comma-separated list of allowed algorithms
 */
export declare function createBearerValidator(env: ConductorEnv): BearerValidator | null;
//# sourceMappingURL=bearer.d.ts.map