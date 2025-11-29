/**
 * Cryptographic Utilities
 *
 * Shared crypto functions for authentication providers.
 * All implementations are designed for Cloudflare Workers (Web Crypto API).
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
 */
/**
 * Timing-safe string comparison using HMAC
 *
 * This implementation prevents timing attacks by:
 * 1. Using HMAC to compare strings (constant-time crypto operation)
 * 2. NOT short-circuiting on length mismatch (which would leak length info)
 *
 * The naive XOR approach with early length-check is vulnerable because:
 * - Different string lengths return at different times
 * - Attackers can probe to discover the expected length
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Promise<boolean> - true if strings are equal
 */
export declare function timingSafeEqual(a: string, b: string): Promise<boolean>;
/**
 * Synchronous timing-safe comparison (legacy compatibility)
 *
 * WARNING: This version has a small timing leak on length mismatch.
 * Prefer the async version (timingSafeEqual) for security-critical comparisons.
 *
 * This is provided for backwards compatibility where async is difficult.
 * It pads shorter strings to match the longer one's length to reduce
 * (but not eliminate) the timing leak.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns boolean - true if strings are equal
 */
export declare function timingSafeEqualSync(a: string, b: string): boolean;
/**
 * Compute HMAC signature using Web Crypto API
 *
 * @param message - The message to sign
 * @param secret - The secret key
 * @param algorithm - Hash algorithm (sha256, sha1, sha384, sha512)
 * @returns Promise<string> - Hex-encoded signature
 */
export declare function computeHMAC(message: string, secret: string, algorithm?: 'sha256' | 'sha1' | 'sha384' | 'sha512'): Promise<string>;
//# sourceMappingURL=crypto.d.ts.map