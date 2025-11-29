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
  allowInternalRequests?: boolean
}

/**
 * Check if a hostname resolves to a private/internal IP address
 *
 * Blocked ranges:
 * - 127.0.0.0/8 (localhost)
 * - 10.0.0.0/8 (private class A)
 * - 172.16.0.0/12 (private class B)
 * - 192.168.0.0/16 (private class C)
 * - 169.254.0.0/16 (link-local, including AWS/GCP/Azure metadata)
 * - 0.0.0.0/8 (current network)
 * - ::1 (IPv6 localhost)
 * - fc00::/7 (IPv6 unique local)
 * - fe80::/10 (IPv6 link-local)
 */
function isPrivateOrInternalIP(hostname: string): boolean {
  // Handle IPv6 in brackets
  const cleanHostname = hostname.replace(/^\[|\]$/g, '')

  // Check for obvious internal hostnames
  if (
    cleanHostname === 'localhost' ||
    cleanHostname.endsWith('.local') ||
    cleanHostname.endsWith('.internal') ||
    cleanHostname.endsWith('.localhost')
  ) {
    return true
  }

  // Parse as IP address
  const ipv4Parts = cleanHostname.split('.').map(Number)

  if (ipv4Parts.length === 4 && ipv4Parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
    const [a, b, c] = ipv4Parts

    // 127.0.0.0/8 - Loopback
    if (a === 127) return true

    // 10.0.0.0/8 - Private Class A
    if (a === 10) return true

    // 172.16.0.0/12 - Private Class B
    if (a === 172 && b >= 16 && b <= 31) return true

    // 192.168.0.0/16 - Private Class C
    if (a === 192 && b === 168) return true

    // 169.254.0.0/16 - Link-local (AWS/GCP/Azure metadata service)
    if (a === 169 && b === 254) return true

    // 0.0.0.0/8 - Current network
    if (a === 0) return true

    // 100.64.0.0/10 - Carrier-grade NAT
    if (a === 100 && b >= 64 && b <= 127) return true

    // 192.0.0.0/24 - IETF protocol assignments
    if (a === 192 && b === 0 && c === 0) return true

    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 - Documentation
    if (
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    )
      return true

    // 224.0.0.0/4 - Multicast
    if (a >= 224 && a <= 239) return true

    // 240.0.0.0/4 - Reserved for future use
    if (a >= 240) return true
  }

  // IPv6 checks
  const lowerHostname = cleanHostname.toLowerCase()

  // ::1 - Loopback
  if (lowerHostname === '::1' || lowerHostname === '0:0:0:0:0:0:0:1') return true

  // fc00::/7 - Unique local address
  if (lowerHostname.startsWith('fc') || lowerHostname.startsWith('fd')) return true

  // fe80::/10 - Link-local
  if (
    lowerHostname.startsWith('fe8') ||
    lowerHostname.startsWith('fe9') ||
    lowerHostname.startsWith('fea') ||
    lowerHostname.startsWith('feb')
  )
    return true

  // :: - Unspecified address
  if (lowerHostname === '::' || lowerHostname === '0:0:0:0:0:0:0:0') return true

  return false
}

/**
 * Validate a URL for SSRF attacks
 *
 * @throws Error if URL is invalid or targets a private/internal address
 */
export function validateURL(urlString: string, allowInternal: boolean = false): URL {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error(`Invalid URL: ${urlString}`)
  }

  // Only allow http/https protocols
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported protocol: ${url.protocol}. Only HTTP(S) is allowed.`)
  }

  // Check for private IPs unless explicitly allowed
  if (!allowInternal && isPrivateOrInternalIP(url.hostname)) {
    throw new Error(
      `SSRF protection: Blocked request to private/internal address: ${url.hostname}. ` +
        `Use { allowInternalRequests: true } to bypass (not recommended).`
    )
  }

  return url
}

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
export async function safeFetch(
  input: string | URL | Request,
  init?: SafeFetchOptions
): Promise<Response> {
  const { allowInternalRequests = false, ...fetchInit } = init ?? {}

  // Extract URL string from input
  let urlString: string
  if (typeof input === 'string') {
    urlString = input
  } else if (input instanceof URL) {
    urlString = input.href
  } else if (input instanceof Request) {
    urlString = input.url
  } else {
    throw new Error('Invalid fetch input: expected string, URL, or Request')
  }

  // Validate URL for SSRF
  const validatedUrl = validateURL(urlString, allowInternalRequests)

  // Make the request with validated URL
  return fetch(validatedUrl.href, fetchInit)
}

/**
 * Check if a URL is safe (would not be blocked by SSRF protection)
 *
 * Useful for pre-validation or user feedback.
 *
 * @param urlString - URL to check
 * @returns true if URL is safe, false otherwise
 */
export function isURLSafe(urlString: string): boolean {
  try {
    validateURL(urlString, false)
    return true
  } catch {
    return false
  }
}
