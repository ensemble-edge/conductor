/**
 * API Key Authentication Provider
 *
 * API key validation using KV storage
 *
 * Features:
 * - Multiple key sources (header, cookie)
 * - KV-based key storage
 * - Key prefix validation
 * - Metadata extraction
 * - Expiration checking
 *
 * SECURITY NOTE: Query parameter API keys are discouraged because they:
 * - Appear in server access logs
 * - Are stored in browser history
 * - Can leak via referer headers
 * - May be cached by proxies
 *
 * @see https://developers.cloudflare.com/kv
 */
import type { AuthValidator, AuthValidationResult } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * API Key configuration
 */
export interface ApiKeyConfig {
    /** KV namespace binding name */
    kvNamespace: string;
    /**
     * Key sources to check (default: ['header'] for security)
     *
     * SECURITY WARNING: 'query' is strongly discouraged because API keys in URLs:
     * - Appear in server access logs
     * - Are stored in browser history
     * - Can leak via Referer headers
     * - May be cached by proxies/CDNs
     *
     * Only use 'query' if you understand the risks and have a specific need.
     */
    sources?: ('header' | 'query' | 'cookie')[];
    /** Header name for API key (default: 'X-API-Key') */
    headerName?: string;
    /**
     * Query parameter name for API key (default: 'api_key')
     * @deprecated Use header-based auth instead for security
     */
    queryName?: string;
    /** Cookie name for API key (default: 'api_key') */
    cookieName?: string;
    /** Expected key prefix (e.g., 'myapp_') */
    prefix?: string;
    /** Enable stealth mode (404 instead of 401) */
    stealthMode?: boolean;
}
/**
 * API Key Validator
 */
export declare class ApiKeyValidator implements AuthValidator {
    private config;
    constructor(config: ApiKeyConfig);
    /**
     * Extract API key from request
     *
     * Checks sources in order of preference: header → cookie → query
     * Query is checked last and only if explicitly enabled (security risk)
     */
    extractToken(request: Request): string | null;
    /**
     * Validate key format
     */
    private isValidFormat;
    /**
     * Validate API key
     */
    validate(request: Request, env: ConductorEnv): Promise<AuthValidationResult>;
}
/**
 * Create API Key validator from environment
 *
 * Environment variables:
 * - API_KEY_KV_NAMESPACE: KV binding name (default: 'API_KEYS')
 * - API_KEY_SOURCES: Comma-separated sources (default: 'header')
 *   WARNING: Including 'query' is a security risk
 * - API_KEY_HEADER_NAME: Custom header name (default: 'X-API-Key')
 * - API_KEY_COOKIE_NAME: Custom cookie name (default: 'api_key')
 * - API_KEY_PREFIX: Required key prefix
 * - API_KEY_STEALTH_MODE: Return 404 instead of 401 (default: false)
 */
export declare function createApiKeyValidator(env: ConductorEnv): ApiKeyValidator | null;
//# sourceMappingURL=apikey.d.ts.map