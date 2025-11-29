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
export async function timingSafeEqual(a, b) {
    const encoder = new TextEncoder();
    // Use a fixed key - we're not protecting a secret here, just doing constant-time comparison
    const key = await crypto.subtle.importKey('raw', encoder.encode('timing-safe-comparison-key'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    // Compute HMAC of both strings
    const [macA, macB] = await Promise.all([
        crypto.subtle.sign('HMAC', key, encoder.encode(a)),
        crypto.subtle.sign('HMAC', key, encoder.encode(b)),
    ]);
    // Compare the MACs byte-by-byte in constant time
    // This is safe because MACs are always the same length (32 bytes for SHA-256)
    const viewA = new Uint8Array(macA);
    const viewB = new Uint8Array(macB);
    let result = 0;
    for (let i = 0; i < viewA.length; i++) {
        result |= viewA[i] ^ viewB[i];
    }
    return result === 0;
}
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
export function timingSafeEqualSync(a, b) {
    // Pad the shorter string to prevent length-based timing leak
    const maxLen = Math.max(a.length, b.length);
    const paddedA = a.padEnd(maxLen, '\0');
    const paddedB = b.padEnd(maxLen, '\0');
    // XOR all characters
    let result = 0;
    for (let i = 0; i < maxLen; i++) {
        result |= paddedA.charCodeAt(i) ^ paddedB.charCodeAt(i);
    }
    // Also include length comparison in constant time
    // (Different lengths should return false even if padded comparison matches)
    result |= a.length ^ b.length;
    return result === 0;
}
/**
 * Compute HMAC signature using Web Crypto API
 *
 * @param message - The message to sign
 * @param secret - The secret key
 * @param algorithm - Hash algorithm (sha256, sha1, sha384, sha512)
 * @returns Promise<string> - Hex-encoded signature
 */
export async function computeHMAC(message, secret, algorithm = 'sha256') {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    // Map algorithm names to Web Crypto format
    const algoMap = {
        sha256: 'SHA-256',
        sha1: 'SHA-1',
        sha384: 'SHA-384',
        sha512: 'SHA-512',
    };
    const cryptoAlgorithm = algoMap[algorithm.toLowerCase()] || 'SHA-256';
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: cryptoAlgorithm }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    // Convert to hex string
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
