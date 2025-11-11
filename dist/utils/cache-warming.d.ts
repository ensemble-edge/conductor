/**
 * Cache Warming Utility
 *
 * Enables pre-population of edge cache after deployment for improved performance
 * Works with any member type that has cache configuration
 */
export interface CacheWarmingConfig {
    /** Routes to warm (with optional priority) */
    routes: RouteToWarm[];
    /** Base URL of the deployed application */
    baseUrl: string;
    /** Maximum concurrent requests */
    concurrency?: number;
    /** Timeout per request (ms) */
    timeout?: number;
    /** Retry failed requests */
    retry?: boolean;
    /** Maximum retries */
    maxRetries?: number;
}
export interface RouteToWarm {
    /** Route path */
    path: string;
    /** Priority (higher = warmed first) */
    priority?: number;
    /** HTTP method */
    method?: string;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Query parameters */
    query?: Record<string, string>;
}
export interface WarmingResult {
    /** Route that was warmed */
    route: string;
    /** Success status */
    success: boolean;
    /** Response status code */
    status?: number;
    /** Response time (ms) */
    responseTime?: number;
    /** Error message if failed */
    error?: string;
    /** Cache status from response */
    cacheStatus?: string;
}
/**
 * Warm cache for specified routes
 */
export declare function warmCache(config: CacheWarmingConfig): Promise<WarmingResult[]>;
/**
 * Extract routes from member configurations for cache warming
 * Works with any member type (Page, API, Data, etc.) that has:
 * - A route configuration
 * - A cache configuration with warming enabled
 */
export declare function extractWarmableRoutes(members: any[]): RouteToWarm[];
/**
 * Schedule cache refresh via Cloudflare Cron
 *
 * Example usage in wrangler.toml:
 *
 * [triggers]
 * crons = ["0 * * * *"]  # Every hour
 *
 * Then in your worker:
 *
 * export default {
 *   async scheduled(event, env, ctx) {
 *     ctx.waitUntil(refreshCache(env));
 *   }
 * }
 */
export declare function scheduledCacheRefresh(env: any, config?: Partial<CacheWarmingConfig>): Promise<WarmingResult[]>;
//# sourceMappingURL=cache-warming.d.ts.map