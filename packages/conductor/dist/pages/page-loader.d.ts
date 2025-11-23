/**
 * PageLoader
 *
 * Auto-discovers pages and registers them with Hono via HonoConductorBridge
 */
import type { Hono } from 'hono';
import type { PageAgent } from '../agents/page/page-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
export interface PageLoaderConfig {
    pagesDir?: string;
    indexFiles?: string[];
    notFoundPage?: string;
    errorPage?: string;
}
export declare class PageLoader {
    private bridge;
    private config;
    private operationRegistry;
    constructor(app: Hono, config?: PageLoaderConfig);
    /**
     * Auto-discover pages and register with Hono
     */
    discoverPages(pagesMap: Map<string, {
        config: AgentConfig;
        agent: PageAgent;
    }>): Promise<void>;
    /**
     * Register layout
     */
    registerLayout(name: string, agent: PageAgent): void;
    /**
     * Convert page name to route path using conventions
     */
    private pageNameToPath;
}
//# sourceMappingURL=page-loader.d.ts.map