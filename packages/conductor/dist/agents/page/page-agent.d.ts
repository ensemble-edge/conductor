/**
 * Page Agent
 *
 * JSX/compiled page components with:
 * - Server-side rendering (SSR)
 * - Props passing and data binding
 * - Client-side hydration (htmx, progressive, islands)
 * - SEO optimization
 * - Layout support
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { PageMemberOutput } from './types/index.js';
export declare class PageAgent extends BaseAgent {
    private pageConfig;
    private templateEngine;
    constructor(config: AgentConfig);
    /**
     * Validate agent configuration
     */
    private validateConfig;
    /**
     * Execute page rendering
     */
    protected run(context: AgentExecutionContext): Promise<PageMemberOutput>;
    /**
     * Load page component
     */
    private loadComponent;
    /**
     * Render component with SSR
     */
    private renderSSR;
    /**
     * Render static component
     */
    private renderStatic;
    /**
     * Render hybrid component (SSR + client hydration)
     */
    private renderHybrid;
    /**
     * Add hydration markers to HTML
     */
    private addHydrationMarkers;
    /**
     * Apply layout to page content
     */
    private applyLayout;
    /**
     * Merge head configuration
     */
    private mergeHeadConfig;
    /**
     * Merge hydration configuration
     */
    private mergeHydrationConfig;
    /**
     * Build hydration HTML
     */
    private buildHydrationHtml;
    /**
     * Build full HTML page
     */
    private buildFullPage;
    /**
     * Build response headers
     */
    private buildHeaders;
    /**
     * Build SEO data
     */
    private buildSEOData;
    /**
     * Check cache for existing render
     */
    private checkCache;
    /**
     * Cache rendered output
     */
    private cacheOutput;
    /**
     * Generate cache key
     * Note: This is a different signature than BaseAgent.generateCacheKey
     */
    private generatePageCacheKey;
    /**
     * Render error page
     */
    private renderErrorPage;
}
//# sourceMappingURL=page-agent.d.ts.map