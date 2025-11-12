/**
 * Cache Warming Utility
 *
 * Enables pre-population of edge cache after deployment for improved performance
 * Works with any agent type that has cache configuration
 */
import { isCacheWarmingEnabled } from '../types/cache.js';
/**
 * Warm cache for specified routes
 */
export async function warmCache(config) {
    const { routes, baseUrl, concurrency = 5, timeout = 30000, retry = true, maxRetries = 3 } = config;
    // Sort routes by priority (highest first)
    const sortedRoutes = [...routes].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    // Warm routes with concurrency control
    const results = [];
    for (let i = 0; i < sortedRoutes.length; i += concurrency) {
        const batch = sortedRoutes.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map((route) => warmRoute(baseUrl, route, timeout, retry, maxRetries)));
        results.push(...batchResults);
    }
    return results;
}
/**
 * Warm a single route
 */
async function warmRoute(baseUrl, route, timeout, retry, maxRetries) {
    const url = buildUrl(baseUrl, route);
    const method = route.method || 'GET';
    let lastError = null;
    let attempts = 0;
    while (attempts < maxRetries) {
        attempts++;
        try {
            const startTime = Date.now();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                method,
                headers: {
                    'User-Agent': 'Conductor-Cache-Warmer',
                    ...route.headers,
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            const cacheStatus = response.headers.get('cf-cache-status') || response.headers.get('x-cache') || 'unknown';
            return {
                route: route.path,
                success: response.ok,
                status: response.status,
                responseTime,
                cacheStatus,
            };
        }
        catch (error) {
            lastError = error;
            // Don't retry if not configured
            if (!retry || attempts >= maxRetries) {
                break;
            }
            // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
    }
    return {
        route: route.path,
        success: false,
        error: lastError?.message || 'Unknown error',
    };
}
/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl, route) {
    const url = new URL(route.path, baseUrl);
    if (route.query) {
        Object.entries(route.query).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }
    return url.toString();
}
/**
 * Extract routes from agent configurations for cache warming
 * Works with any agent type (Page, API, Data, etc.) that has:
 * - A route configuration
 * - A cache configuration with warming enabled
 */
export function extractWarmableRoutes(agents) {
    const routes = [];
    for (const agent of agents) {
        // Skip if warming not enabled (works for any agent type)
        if (!isCacheWarmingEnabled(agent)) {
            continue;
        }
        // Extract route path (supports both agent.route and direct path)
        const path = agent.route?.path || agent.path || `/${agent.name}`;
        // Default priority based on common patterns
        let priority = 50;
        if (path === '/' || path === '/index')
            priority = 100; // Homepage highest
        if (path.includes('/api/'))
            priority = 30; // API routes lower
        if (path.includes('/:'))
            priority = 20; // Dynamic routes lowest
        // Extract HTTP methods (default to GET)
        const methods = agent.route?.methods || agent.methods || ['GET'];
        // Create routes for each HTTP method
        for (const method of methods) {
            routes.push({
                path,
                priority,
                method,
            });
        }
    }
    return routes;
}
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
export async function scheduledCacheRefresh(env, config) {
    // Get base URL from environment
    const baseUrl = env.BASE_URL || env.DEPLOYMENT_URL;
    if (!baseUrl) {
        throw new Error('BASE_URL or DEPLOYMENT_URL environment variable required for cache warming');
    }
    // Load agents (pages, API routes, etc.) from KV or environment
    const agents = await loadMembersForWarming(env);
    const routes = extractWarmableRoutes(agents);
    return warmCache({
        baseUrl,
        routes,
        concurrency: config?.concurrency || 10,
        timeout: config?.timeout || 15000,
        retry: config?.retry ?? true,
        maxRetries: config?.maxRetries || 2,
    });
}
/**
 * Load agent configurations for cache warming
 * Supports any agent type with cache configuration
 */
async function loadMembersForWarming(env) {
    // In production, this would load from KV or similar
    // Could load pages, API routes, data agents, etc.
    // For now, return empty array (to be implemented with actual agent discovery)
    return [];
}
