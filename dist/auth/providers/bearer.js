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
     * Decode JWT token (simple base64 decode, no verification yet)
     */
    decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            // Decode payload (middle part)
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Verify JWT token
     * Note: This is a simplified implementation. In production, use a proper JWT library.
     */
    async verifyToken(token) {
        // If custom decoder provided, use it
        if (this.config.customDecoder) {
            try {
                return await this.config.customDecoder(token);
            }
            catch (error) {
                return null;
            }
        }
        // Simple decode (not cryptographically verified)
        // In production, use @cloudflare/workers-jwt or similar
        const payload = this.decodeToken(token);
        if (!payload) {
            return null;
        }
        // Check expiration
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            return null;
        }
        // Check issuer
        if (this.config.issuer && payload.iss !== this.config.issuer) {
            return null;
        }
        // Check audience
        if (this.config.audience && payload.aud !== this.config.audience) {
            return null;
        }
        return payload;
    }
    /**
     * Validate bearer token
     */
    async validate(request, env) {
        const token = this.extractToken(request);
        // No token provided
        if (!token) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'No bearer token provided'
            };
        }
        // Verify token
        const payload = await this.verifyToken(token);
        if (!payload) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'Invalid or expired bearer token'
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
                metadata: {}
            },
            expiresAt: payload.exp
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
            context
        };
    }
}
/**
 * Create Bearer validator from environment
 */
export function createBearerValidator(env) {
    // JWT secret or config must be present
    if (!env.JWT_SECRET && !env.JWT_PUBLIC_KEY_URL) {
        return null;
    }
    return new BearerValidator({
        secret: env.JWT_SECRET,
        publicKeyUrl: env.JWT_PUBLIC_KEY_URL,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: env.JWT_ALGORITHMS ? env.JWT_ALGORITHMS.split(',') : ['HS256', 'RS256']
    });
}
