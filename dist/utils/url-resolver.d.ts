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
export interface URLResolverOptions {
    timeout?: number;
    followRedirects?: boolean;
    maxRedirects?: number;
    headers?: Record<string, string>;
    tryWwwFallback?: boolean;
    preferHttps?: boolean;
}
export interface URLResolution {
    url: string;
    finalUrl: string;
    statusCode: number;
    redirectChain: string[];
    headers: Record<string, string>;
    responseTime: number;
    wwwFallbackUsed: boolean;
}
export declare class URLResolver {
    private options;
    private defaultOptions;
    constructor(options?: URLResolverOptions);
    /**
     * Resolve a URL with automatic www fallback
     */
    resolve(url: string, options?: URLResolverOptions): Promise<URLResolution>;
    /**
     * Fetch a URL with redirect tracking
     */
    private fetchURL;
    /**
     * Normalize URL (add protocol, prefer https)
     */
    private normalizeURL;
    /**
     * Get www fallback URL
     */
    private getWwwFallback;
    /**
     * Check if a URL is reachable
     */
    isReachable(url: string, options?: URLResolverOptions): Promise<boolean>;
    /**
     * Batch resolve multiple URLs
     */
    resolveMany(urls: string[], options?: URLResolverOptions): Promise<URLResolution[]>;
}
/**
 * Convenience function to resolve a single URL
 */
export declare function resolveURL(url: string, options?: URLResolverOptions): Promise<URLResolution>;
/**
 * Convenience function to check if a URL is reachable
 */
export declare function isURLReachable(url: string, options?: URLResolverOptions): Promise<boolean>;
//# sourceMappingURL=url-resolver.d.ts.map