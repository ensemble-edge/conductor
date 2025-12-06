/**
 * Cookies Operation Types
 *
 * Type definitions for cookie management with consent awareness.
 */
/**
 * Cookie action types
 */
export type CookieAction = 'get' | 'set' | 'delete' | 'getAll';
/**
 * SameSite attribute values
 */
export type SameSite = 'strict' | 'lax' | 'none';
/**
 * Consent purposes that align with location context
 */
export type ConsentPurpose = 'essential' | 'analytics' | 'marketing' | 'personalization' | 'third_party';
/**
 * Cookie operation configuration
 */
export interface CookiesConfig {
    /** Action to perform */
    action: CookieAction;
    /** Cookie name (required for get/set/delete) */
    name?: string;
    /** Cookie value (required for set) */
    value?: string;
    /** Max age in seconds */
    maxAge?: number;
    /** Expiration date (ISO string or timestamp) */
    expires?: string | number;
    /** URL path scope (default: '/') */
    path?: string;
    /** Domain scope */
    domain?: string;
    /** HTTPS only (default: true in production) */
    secure?: boolean;
    /** No JavaScript access (default: true) */
    httpOnly?: boolean;
    /** SameSite attribute (default: 'lax') */
    sameSite?: SameSite;
    /** Consent purpose - checks location context for GDPR/CCPA compliance */
    purpose?: ConsentPurpose;
}
/**
 * Output for 'get' action
 */
export interface CookieGetOutput {
    /** Cookie value or null if not found */
    value: string | null;
    /** True if cookie exists */
    found: boolean;
}
/**
 * Output for 'getAll' action
 */
export interface CookieGetAllOutput {
    /** All cookies as key-value pairs */
    cookies: Record<string, string>;
    /** Number of cookies */
    count: number;
}
/**
 * Output for 'set' action
 */
export interface CookieSetOutput {
    /** True if cookie was set */
    success: boolean;
    /** The Set-Cookie header value */
    header: string;
    /** True if skipped due to no HTTP context or consent */
    skipped?: boolean;
    /** Reason for skipping */
    reason?: 'no_http_context' | 'consent_required';
    /** Purpose that required consent */
    purpose?: string;
}
/**
 * Output for 'delete' action
 */
export interface CookieDeleteOutput {
    /** True if delete header was set */
    success: boolean;
    /** The Set-Cookie header value (with maxAge=0) */
    header: string;
    /** True if skipped due to no HTTP context */
    skipped?: boolean;
    /** Reason for skipping */
    reason?: 'no_http_context';
}
/**
 * Union type for all cookie operation outputs
 */
export type CookiesOutput = CookieGetOutput | CookieGetAllOutput | CookieSetOutput | CookieDeleteOutput;
//# sourceMappingURL=index.d.ts.map