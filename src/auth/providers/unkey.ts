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

import type { AuthValidator, AuthValidationResult, AuthContext } from '../types.js';

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
 * Unkey API response
 */
interface UnkeyVerifyResponse {
	valid: boolean;
	keyId?: string;
	ownerId?: string;
	meta?: Record<string, any>;
	permissions?: string[];
	ratelimit?: {
		remaining: number;
		limit: number;
		reset: number;
	};
	code?: string;
	error?: string;
}

/**
 * Unkey Auth Validator
 */
export class UnkeyValidator implements AuthValidator {
	constructor(private config: UnkeyConfig) {}

	/**
	 * Extract API key from request
	 * Checks multiple locations: X-API-Key header, Authorization header, query param
	 */
	extractToken(request: Request): string | null {
		// Check X-API-Key header (most common)
		const apiKeyHeader = request.headers.get('X-API-Key');
		if (apiKeyHeader) {
			return apiKeyHeader;
		}

		// Check Authorization header (Bearer token style)
		const authHeader = request.headers.get('Authorization');
		if (authHeader?.startsWith('Bearer ')) {
			return authHeader.substring(7);
		}

		// Check query parameter
		const url = new URL(request.url);
		const apiKeyQuery = url.searchParams.get('api_key');
		if (apiKeyQuery) {
			return apiKeyQuery;
		}

		return null;
	}

	/**
	 * Validate API key format
	 */
	private isValidKeyFormat(apiKey: string): boolean {
		if (!apiKey) return false;

		// If prefixes configured, check for match
		if (this.config.keyPrefix && this.config.keyPrefix.length > 0) {
			return this.config.keyPrefix.some(prefix => apiKey.startsWith(prefix));
		}

		// Default: any non-empty string
		return true;
	}

	/**
	 * Check if key is a service account
	 */
	private isServiceAccount(apiKey: string): boolean {
		return Boolean(apiKey && apiKey.includes('_service'));
	}

	/**
	 * Validate with Unkey API
	 */
	async validate(request: Request, env: any): Promise<AuthValidationResult> {
		const apiKey = this.extractToken(request);

		// No API key provided
		if (!apiKey) {
			return {
				valid: false,
				error: 'invalid_token',
				message: 'No API key provided'
			};
		}

		// Invalid format
		if (!this.isValidKeyFormat(apiKey)) {
			return {
				valid: false,
				error: 'invalid_token',
				message: 'Invalid API key format'
			};
		}

		// Call Unkey verification endpoint
		try {
			const response = await fetch('https://api.unkey.dev/v1/keys.verifyKey', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.config.rootKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...(this.config.apiId && { apiId: this.config.apiId }),
					key: apiKey
				})
			});

			if (!response.ok) {
				console.error('Unkey API error:', response.status, response.statusText);
				return {
					valid: false,
					error: 'unknown',
					message: 'Authentication service error'
				};
			}

			const result: UnkeyVerifyResponse = await response.json();

			// Check if key is valid
			if (!result.valid) {
				// Rate limited
				if (result.code === 'RATE_LIMITED' || (result.ratelimit && result.ratelimit.remaining <= 0)) {
					return {
						valid: false,
						error: 'rate_limited',
						message: 'Rate limit exceeded',
						ratelimit: result.ratelimit
					};
				}

				// Invalid key
				return {
					valid: false,
					error: 'invalid_token',
					message: 'Invalid API key'
				};
			}

			// Build auth context
			const context: AuthContext = {
				authenticated: true,
				method: 'unkey',
				token: apiKey,
				user: {
					id: result.ownerId || 'unknown',
					permissions: result.permissions || [],
					metadata: result.meta || {}
				},
				unkey: {
					keyId: result.keyId!,
					ownerId: result.ownerId,
					isServiceAccount: this.isServiceAccount(apiKey),
					ratelimit: result.ratelimit
				}
			};

			return {
				valid: true,
				context,
				ratelimit: result.ratelimit
			};

		} catch (error) {
			console.error('Unkey validation error:', error);
			return {
				valid: false,
				error: 'unknown',
				message: 'Authentication validation failed'
			};
		}
	}
}

/**
 * Create Unkey validator from environment
 */
export function createUnkeyValidator(env: any): UnkeyValidator | null {
	if (!env.UNKEY_ROOT_KEY) {
		return null;
	}

	return new UnkeyValidator({
		rootKey: env.UNKEY_ROOT_KEY,
		apiId: env.UNKEY_API_ID,
		keyPrefix: env.UNKEY_KEY_PREFIX ? env.UNKEY_KEY_PREFIX.split(',') : ['ownerco_', 'oiq_'],
		stealthMode: env.UNKEY_STEALTH_MODE === 'true'
	});
}
