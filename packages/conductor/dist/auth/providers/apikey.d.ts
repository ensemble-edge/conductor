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
import type { AuthValidator, AuthValidationResult } from '../types.js';
/**
 * API Key configuration
 */
export interface ApiKeyConfig {
    /** KV namespace binding name */
    kvNamespace: string;
    /** Key sources to check */
    sources?: ('header' | 'query' | 'cookie')[];
    /** Header name for API key */
    headerName?: string;
    /** Query parameter name for API key */
    queryName?: string;
    /** Cookie name for API key */
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
     */
    extractToken(request: Request): string | null;
    /**
     * Validate key format
     */
    private isValidFormat;
    /**
     * Validate API key
     */
    validate(request: Request, env: any): Promise<AuthValidationResult>;
}
/**
 * Create API Key validator from environment
 */
export declare function createApiKeyValidator(env: any): ApiKeyValidator | null;
//# sourceMappingURL=apikey.d.ts.map