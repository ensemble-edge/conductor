/**
 * URL Resolver
 *
 * Resolves URLs with automatic www fallback for reliability.
 * Used by Scrape member and other HTTP-based operations.
 *
 * Features:
 * - Automatic www prefix fallback
 * - Protocol normalization (http → https)
 * - Timeout handling
 * - Custom headers support
 */
export class URLResolver {
    constructor(options = {}) {
        this.options = options;
        this.defaultOptions = {
            timeout: 10000,
            followRedirects: true,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ConductorBot/1.0; +https://conductor.dev)',
            },
            tryWwwFallback: true,
            preferHttps: true,
        };
        this.options = { ...this.defaultOptions, ...options };
    }
    /**
     * Resolve a URL with automatic www fallback
     */
    async resolve(url, options) {
        const opts = {
            ...this.defaultOptions,
            ...this.options,
            ...options,
        };
        const startTime = Date.now();
        // Normalize URL
        const normalizedUrl = this.normalizeURL(url, opts.preferHttps);
        // Try primary URL
        try {
            const result = await this.fetchURL(normalizedUrl, opts);
            return {
                ...result,
                url: normalizedUrl,
                responseTime: Date.now() - startTime,
                wwwFallbackUsed: false,
            };
        }
        catch (primaryError) {
            // If www fallback is enabled, try with/without www
            if (opts.tryWwwFallback) {
                const fallbackUrl = this.getWwwFallback(normalizedUrl);
                if (fallbackUrl !== normalizedUrl) {
                    try {
                        const result = await this.fetchURL(fallbackUrl, opts);
                        return {
                            ...result,
                            url: normalizedUrl,
                            responseTime: Date.now() - startTime,
                            wwwFallbackUsed: true,
                        };
                    }
                    catch (fallbackError) {
                        // Both failed, throw original error
                        throw primaryError;
                    }
                }
            }
            throw primaryError;
        }
    }
    /**
     * Fetch a URL with redirect tracking
     */
    async fetchURL(url, options) {
        const redirectChain = [url];
        let currentUrl = url;
        let redirectCount = 0;
        while (redirectCount <= options.maxRedirects) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout);
            try {
                const response = await fetch(currentUrl, {
                    method: 'HEAD',
                    headers: options.headers,
                    redirect: 'manual',
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                // Handle redirects manually
                if (response.status >= 300 && response.status < 400) {
                    const location = response.headers.get('location');
                    if (!location) {
                        throw new Error('Redirect without Location header');
                    }
                    // Resolve relative URLs
                    const nextUrl = new URL(location, currentUrl).toString();
                    redirectChain.push(nextUrl);
                    currentUrl = nextUrl;
                    redirectCount++;
                    if (!options.followRedirects) {
                        break;
                    }
                    continue;
                }
                // Success or error response
                const headers = {};
                response.headers.forEach((value, key) => {
                    headers[key] = value;
                });
                return {
                    finalUrl: currentUrl,
                    statusCode: response.status,
                    redirectChain,
                    headers,
                };
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error(`URL resolution timeout after ${options.timeout}ms: ${currentUrl}`);
                }
                throw error;
            }
        }
        throw new Error(`Too many redirects (max: ${options.maxRedirects})`);
    }
    /**
     * Normalize URL (add protocol, prefer https)
     */
    normalizeURL(url, preferHttps) {
        let normalized = url.trim();
        // Add protocol if missing
        if (!normalized.match(/^https?:\/\//i)) {
            normalized = (preferHttps ? 'https://' : 'http://') + normalized;
        }
        // Upgrade to https if preferred
        if (preferHttps && normalized.startsWith('http://')) {
            normalized = 'https://' + normalized.substring(7);
        }
        return normalized;
    }
    /**
     * Get www fallback URL
     */
    getWwwFallback(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname.startsWith('www.')) {
                // Remove www
                parsed.hostname = parsed.hostname.substring(4);
            }
            else {
                // Add www
                parsed.hostname = 'www.' + parsed.hostname;
            }
            return parsed.toString();
        }
        catch (error) {
            return url;
        }
    }
    /**
     * Check if a URL is reachable
     */
    async isReachable(url, options) {
        try {
            const result = await this.resolve(url, options);
            return result.statusCode >= 200 && result.statusCode < 400;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Batch resolve multiple URLs
     */
    async resolveMany(urls, options) {
        const promises = urls.map((url) => this.resolve(url, options));
        return Promise.all(promises);
    }
}
/**
 * Convenience function to resolve a single URL
 */
export async function resolveURL(url, options) {
    const resolver = new URLResolver(options);
    return resolver.resolve(url);
}
/**
 * Convenience function to check if a URL is reachable
 */
export async function isURLReachable(url, options) {
    const resolver = new URLResolver(options);
    return resolver.isReachable(url);
}
