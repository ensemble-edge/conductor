/**
 * API Key Authentication Provider
 *
 * API key validation using KV storage
 *
 * Features:
 * - Multiple key sources (header, query, cookie)
 * - KV-based key storage
 * - Key prefix validation
 * - Metadata extraction
 * - Expiration checking
 *
 * @see https://developers.cloudflare.com/kv
 */
/**
 * API Key Validator
 */
export class ApiKeyValidator {
    constructor(config) {
        this.config = config;
    }
    /**
     * Extract API key from request
     */
    extractToken(request) {
        const sources = this.config.sources || ['header', 'query'];
        const headerName = this.config.headerName || 'X-API-Key';
        const queryName = this.config.queryName || 'api_key';
        const cookieName = this.config.cookieName || 'api_key';
        // Try header
        if (sources.includes('header')) {
            const headerValue = request.headers.get(headerName);
            if (headerValue)
                return headerValue;
        }
        // Try query
        if (sources.includes('query')) {
            const url = new URL(request.url);
            const queryValue = url.searchParams.get(queryName);
            if (queryValue)
                return queryValue;
        }
        // Try cookie
        if (sources.includes('cookie')) {
            const cookieHeader = request.headers.get('Cookie');
            if (cookieHeader) {
                const cookies = cookieHeader.split(';').map((c) => c.trim());
                for (const cookie of cookies) {
                    const [name, value] = cookie.split('=');
                    if (name === cookieName && value) {
                        return decodeURIComponent(value);
                    }
                }
            }
        }
        return null;
    }
    /**
     * Validate key format
     */
    isValidFormat(apiKey) {
        if (!apiKey)
            return false;
        // Check prefix if configured
        if (this.config.prefix && !apiKey.startsWith(this.config.prefix)) {
            return false;
        }
        // Basic format validation (non-empty, reasonable length)
        return apiKey.length >= 8 && apiKey.length <= 256;
    }
    /**
     * Validate API key
     */
    async validate(request, env) {
        const apiKey = this.extractToken(request);
        // No API key provided
        if (!apiKey) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'No API key provided',
            };
        }
        // Invalid format
        if (!this.isValidFormat(apiKey)) {
            return {
                valid: false,
                error: 'invalid_token',
                message: 'Invalid API key format',
            };
        }
        // Get KV namespace
        const kv = env[this.config.kvNamespace];
        if (!kv) {
            console.error(`KV namespace "${this.config.kvNamespace}" not found in env`);
            return {
                valid: false,
                error: 'unknown',
                message: 'Authentication service error',
            };
        }
        // Look up key in KV
        try {
            const metadataJson = await kv.get(apiKey);
            if (!metadataJson) {
                return {
                    valid: false,
                    error: 'invalid_token',
                    message: 'Invalid API key',
                };
            }
            const metadata = JSON.parse(metadataJson);
            // Check expiration
            if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
                return {
                    valid: false,
                    error: 'expired',
                    message: 'API key has expired',
                };
            }
            // Build auth context
            const context = {
                authenticated: true,
                method: 'apiKey',
                token: apiKey,
                user: {
                    id: metadata.userId || metadata.keyId,
                    permissions: metadata.permissions || [],
                    roles: [],
                    metadata: {
                        ...metadata.metadata,
                        keyId: metadata.keyId,
                        keyName: metadata.name,
                    },
                },
                expiresAt: metadata.expiresAt,
            };
            return {
                valid: true,
                context,
                ratelimit: metadata.rateLimit
                    ? {
                        limit: metadata.rateLimit.requests,
                        remaining: metadata.rateLimit.requests, // TODO: Implement actual rate limiting
                        reset: Math.floor(Date.now() / 1000) + metadata.rateLimit.window,
                    }
                    : undefined,
            };
        }
        catch (error) {
            console.error('API key validation error:', error);
            return {
                valid: false,
                error: 'unknown',
                message: 'Authentication validation failed',
            };
        }
    }
}
/**
 * Create API Key validator from environment
 */
export function createApiKeyValidator(env) {
    // KV namespace must be configured
    const kvNamespace = env.API_KEY_KV_NAMESPACE || 'API_KEYS';
    // Check if KV namespace exists
    if (!env[kvNamespace]) {
        return null;
    }
    return new ApiKeyValidator({
        kvNamespace,
        sources: env.API_KEY_SOURCES
            ? env.API_KEY_SOURCES.split(',')
            : ['header', 'query'],
        headerName: env.API_KEY_HEADER_NAME || 'X-API-Key',
        queryName: env.API_KEY_QUERY_NAME || 'api_key',
        cookieName: env.API_KEY_COOKIE_NAME || 'api_key',
        prefix: env.API_KEY_PREFIX,
        stealthMode: env.API_KEY_STEALTH_MODE === 'true',
    });
}
