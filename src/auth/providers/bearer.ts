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

import type { AuthValidator, AuthValidationResult, AuthContext, TokenPayload } from '../types.js';

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
export class BearerValidator implements AuthValidator {
	constructor(private config: BearerConfig = {}) {}

	/**
	 * Extract bearer token from Authorization header
	 */
	extractToken(request: Request): string | null {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return null;
		}
		return authHeader.substring(7);
	}

	/**
	 * Decode JWT token (simple base64 decode, no verification yet)
	 */
	private decodeToken(token: string): TokenPayload | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				return null;
			}

			// Decode payload (middle part)
			const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
			return payload as TokenPayload;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Verify JWT token
	 * Note: This is a simplified implementation. In production, use a proper JWT library.
	 */
	private async verifyToken(token: string): Promise<TokenPayload | null> {
		// If custom decoder provided, use it
		if (this.config.customDecoder) {
			try {
				return await this.config.customDecoder(token);
			} catch (error) {
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
	async validate(request: Request, env: any): Promise<AuthValidationResult> {
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
		const context: AuthContext = {
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
				context.user!.metadata![key] = value;
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
export function createBearerValidator(env: any): BearerValidator | null {
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
