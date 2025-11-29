/**
 * Safe Fetch - SSRF-Protected HTTP Client
 *
 * A wrapper around the native `fetch()` that provides protection against
 * Server-Side Request Forgery (SSRF) attacks.
 *
 * Use this for any fetch where the URL comes from user input or external sources.
 * For hardcoded API endpoints (like Twilio, Resend, etc.), regular fetch() is fine.
 *
 * @example
 * ```ts
 * // User-provided URL - use safeFetch
 * const response = await safeFetch(userInput.url)
 *
 * // Hardcoded API - regular fetch is fine
 * const response = await fetch('https://api.twilio.com/...')
 * ```
 */
export interface SafeFetchOptions extends RequestInit {
    /**
     * Allow requests to private/internal IP addresses
     *
     * WARNING: Enabling this bypasses SSRF protection and allows requests to
     * internal network resources, cloud metadata services, and localhost.
     * Only enable if you trust the input URLs completely.
     *
     * @default false
     */
    allowInternalRequests?: boolean;
}
/**
 * Validate a URL for SSRF attacks
 *
 * @throws Error if URL is invalid or targets a private/internal address
 */
export declare function validateURL(urlString: string, allowInternal?: boolean): URL;
/**
 * SSRF-protected fetch wrapper
 *
 * Use this instead of `fetch()` when the URL comes from user input or external sources.
 *
 * @param input - URL string or Request object
 * @param init - Fetch options with optional `allowInternalRequests` flag
 * @returns Promise<Response>
 * @throws Error if URL is invalid or targets a private/internal address
 *
 * @example
 * ```ts
 * // Basic usage
 * const response = await safeFetch('https://api.example.com/data')
 *
 * // With options
 * const response = await safeFetch(url, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * })
 *
 * // Bypass SSRF protection (use with caution!)
 * const response = await safeFetch(internalUrl, {
 *   allowInternalRequests: true,
 * })
 * ```
 */
export declare function safeFetch(input: string | URL | Request, init?: SafeFetchOptions): Promise<Response>;
/**
 * Check if a URL is safe (would not be blocked by SSRF protection)
 *
 * Useful for pre-validation or user feedback.
 *
 * @param urlString - URL to check
 * @returns true if URL is safe, false otherwise
 */
export declare function isURLSafe(urlString: string): boolean;
//# sourceMappingURL=safe-fetch.d.ts.map