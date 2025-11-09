/**
 * Page Router
 *
 * Automatic routing system for Page members:
 * - Auto-discovery of pages from /pages directory
 * - Convention-based routing (directory structure = routes)
 * - Explicit route configuration in YAML
 * - Dynamic route parameters (:id, :slug, etc.)
 * - Index page support
 * - 404 handling
 */
import type { ConductorEnv } from '../types/env.js';
import { PageMember } from '../members/page/page-member.js';
import type { MemberConfig } from '../runtime/parser.js';
export interface PageRoute {
    path: string;
    methods: string[];
    page: PageMember;
    params?: string[];
    aliases?: string[];
    auth?: 'none' | 'required' | 'optional';
    rateLimit?: {
        requests: number;
        window: number;
    };
}
export interface PageRouterConfig {
    pagesDir?: string;
    autoRoute?: boolean;
    basePath?: string;
    indexFiles?: string[];
    notFoundPage?: string;
    beforeRender?: (page: PageMember, request: Request, env: ConductorEnv) => Promise<Record<string, any>>;
}
export declare class PageRouter {
    private routes;
    private pages;
    private config;
    constructor(config?: PageRouterConfig);
    /**
     * Register a page with explicit route configuration
     */
    registerPage(pageConfig: MemberConfig, pageMember: PageMember): void;
    /**
     * Auto-discover pages from directory structure
     *
     * Examples:
     * - pages/index.yaml → /
     * - pages/about.yaml → /about
     * - pages/blog/index.yaml → /blog
     * - pages/blog/[slug].yaml → /blog/:slug
     */
    discoverPages(pagesMap: Map<string, {
        config: MemberConfig;
        member: PageMember;
    }>): Promise<void>;
    /**
     * Handle incoming request
     */
    handle(request: Request, env: ConductorEnv, ctx: ExecutionContext): Promise<Response | null>;
    /**
     * Find matching route for path and method
     */
    private findRoute;
    /**
     * Match pathname against route pattern
     * Returns params if match, null if no match
     */
    private matchPath;
    /**
     * Extract parameter names from path pattern
     * Example: /blog/:slug/comments/:id → ['slug', 'id']
     */
    private extractParams;
    /**
     * Convert page name to route path using conventions
     *
     * Examples:
     * - index → /
     * - about → /about
     * - blog-post → /blog-post
     * - blog/index → /blog
     * - blog/[slug] → /blog/:slug
     * - users/[id]/posts → /users/:id/posts
     */
    private pageNameToPath;
    /**
     * Normalize path (ensure leading slash, remove trailing slash)
     */
    private normalizePath;
    /**
     * Check authentication
     */
    private checkAuth;
    /**
     * Check rate limit
     */
    private checkRateLimit;
    /**
     * Render 404 page
     */
    private render404;
    /**
     * Get all registered routes (for debugging/inspection)
     */
    getRoutes(): PageRoute[];
}
//# sourceMappingURL=page-router.d.ts.map