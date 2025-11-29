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
// Cache JWKS for performance (refreshed automatically by jose)
const jwksCache = new Map();
/**
 * Bearer Token Validator
 */
export class BearerValidator {
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Extract bearer token from Authorization header
     */
    extractToken(request) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    /**
     * Get JWKS key resolver for RSA/EC algorithms
     */
    getJWKS() {
        if (!this.config.jwksUrl) {
            return null;
        }
        // Use cached JWKS or create new one
        let jwks = jwksCache.get(this.config.jwksUrl);
        if (!jwks) {
            jwks = jose.createRemoteJWKSet(new URL(this.config.jwksUrl));
            jwksCache.set(this.config.jwksUrl, jwks);
        }
        return jwks;
    }
    /**
     * Get HMAC secret key for HS256/384/512 algorithms
     */
    getSecretKey() {
        if (!this.config.secret) {
            return null;
        }
        return new TextEncoder().encode(this.config.secret);
    }
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
    async verifyToken(token) {
        // If custom decoder provided, use it
        if (this.config.customDecoder) {
            try {
                return await this.config.customDecoder(token);
            }
            catch {
                return null;
            }
        }
        try {
            // Build verification options
            const options = {};
            if (this.config.issuer) {
                options.issuer = this.config.issuer;
            }
            if (this.config.audience) {
                options.audience = this.config.audience;
            }
            if (this.config.algorithms) {
                options.algorithms = this.config.algorithms;
            }
            // Try JWKS first (for RSA/EC), then fall back to secret (for HMAC)
            const jwks = this.getJWKS();
            if (jwks) {
                const { payload } = await jose.jwtVerify(token, jwks, options);
                return payload;
            }
            const secretKey = this.getSecretKey();
            if (secretKey) {
                const { payload } = await jose.jwtVerify(token, secretKey, options);
                return payload;
            }
            throw new Error('No JWT secret or JWKS URL configured');
        }
        catch (error) {
            // Log verification failures for debugging (but don't expose details to caller)
            if (error instanceof jose.errors.JWTExpired) {
                // Token expired - expected failure, no need to log
            }
            else if (error instanceof jose.errors.JWTClaimValidationFailed) {
                // Claim validation failed (issuer, audience, etc.)
            }
            else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
                // Signature invalid - potential attack, could log this
            }
            return null;
        }
    }
    /**
     * Validate bearer token
     */
    async validate(request, _env) {
        const token = this.extractToken(request);
        // No token provided
        if (!token) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'No bearer token provided',
            };
        }
        // Verify token
        const payload = await this.verifyToken(token);
        if (!payload) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'Invalid or expired bearer token',
            };
        }
        // Build auth context
        const context = {
            authenticated: true,
            method: 'bearer',
            token,
            user: {
                id: payload.sub,
                email: payload.email,
                roles: payload.roles || [],
                permissions: payload.permissions || [],
                metadata: {},
            },
            expiresAt: payload.exp,
        };
        // Add custom claims to metadata
        const standardClaims = ['sub', 'email', 'roles', 'permissions', 'exp', 'iat', 'iss', 'aud'];
        for (const [key, value] of Object.entries(payload)) {
            if (!standardClaims.includes(key)) {
                context.user.metadata[key] = value;
            }
        }
        return {
            valid: true,
            context,
        };
    }
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
export function createBearerValidator(env) {
    // JWT secret or JWKS URL must be present
    if (!env.JWT_SECRET && !env.JWT_JWKS_URL) {
        return null;
    }
    return new BearerValidator({
        secret: env.JWT_SECRET,
        jwksUrl: env.JWT_JWKS_URL,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: env.JWT_ALGORITHMS
            ? env.JWT_ALGORITHMS.split(',')
            : undefined,
    });
}
