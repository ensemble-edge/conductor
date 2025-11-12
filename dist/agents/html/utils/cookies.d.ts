/**
 * Cookie Utilities
 *
 * Handles cookie parsing, serialization, and signing.
 */
import type { Cookie, CookieOptions, ParsedCookie } from '../types/index.js';
/**
 * Parse cookies from Cookie header string
 */
export declare function parseCookies(cookieHeader: string): Record<string, string>;
/**
 * Serialize a cookie to Set-Cookie header format
 */
export declare function serializeCookie(name: string, value: string, options?: CookieOptions): string;
/**
 * Sign a cookie value using HMAC-SHA256
 */
export declare function signCookie(value: string, secret: string): Promise<string>;
/**
 * Verify and unsign a cookie value
 */
export declare function unsignCookie(signedValue: string, secret: string): Promise<ParsedCookie | null>;
/**
 * Create a Set-Cookie header for a cookie
 */
export declare function createSetCookieHeader(cookie: Cookie, secret?: string): Promise<string>;
/**
 * Create a deletion cookie (expires in the past)
 */
export declare function createDeleteCookie(name: string, options?: Partial<CookieOptions>): string;
/**
 * Parse and verify signed cookies
 */
export declare function parseSignedCookies(cookies: Record<string, string>, secret: string): Promise<Record<string, ParsedCookie>>;
/**
 * Validate cookie name (RFC 6265)
 */
export declare function isValidCookieName(name: string): boolean;
/**
 * Validate cookie value
 */
export declare function isValidCookieValue(value: string): boolean;
/**
 * Merge cookie options with defaults
 */
export declare function mergeCookieOptions(options: CookieOptions | undefined, defaults: CookieOptions | undefined): CookieOptions;
//# sourceMappingURL=cookies.d.ts.map