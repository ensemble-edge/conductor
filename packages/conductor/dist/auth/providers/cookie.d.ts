/**
 * Cookie Session Authentication Provider
 *
 * Session-based authentication using cookies and KV storage
 *
 * Features:
 * - Session management with KV
 * - Secure cookie handling
 * - Session expiration
 * - CSRF protection
 * - Remember me support
 *
 * @see https://developers.cloudflare.com/kv
 */
import type { AuthValidator, AuthValidationResult, SessionData } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
/**
 * Cookie session configuration
 */
export interface CookieConfig {
    /** KV namespace binding name for sessions */
    kvNamespace: string;
    /** Cookie name */
    cookieName?: string;
    /** Cookie domain */
    domain?: string;
    /** Cookie path */
    path?: string;
    /** Secure flag (https only) */
    secure?: boolean;
    /** HttpOnly flag */
    httpOnly?: boolean;
    /** SameSite policy */
    sameSite?: 'strict' | 'lax' | 'none';
    /** Session TTL in seconds */
    sessionTTL?: number;
}
/**
 * Cookie Session Validator
 */
export declare class CookieValidator implements AuthValidator {
    private config;
    constructor(config: CookieConfig);
    /**
     * Extract session token from cookie
     */
    extractToken(request: Request): string | null;
    /**
     * Validate session token format
     */
    private isValidFormat;
    /**
     * Validate cookie session
     */
    validate(request: Request, env: ConductorEnv): Promise<AuthValidationResult>;
    /**
     * Create session cookie header
     */
    createCookie(sessionToken: string, options?: {
        maxAge?: number;
        expires?: Date;
    }): string;
    /**
     * Create session in KV
     */
    createSession(kv: KVNamespace, sessionData: Omit<SessionData, 'sessionId' | 'createdAt' | 'expiresAt'> & {
        expiresAt?: number;
    }): Promise<string>;
    /**
     * Delete session from KV
     */
    deleteSession(kv: KVNamespace, sessionToken: string): Promise<void>;
}
/**
 * Create Cookie validator from environment
 */
export declare function createCookieValidator(env: ConductorEnv): CookieValidator | null;
//# sourceMappingURL=cookie.d.ts.map