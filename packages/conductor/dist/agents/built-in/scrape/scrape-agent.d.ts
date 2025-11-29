/**
 * Scrape Agent - 3-Tier Web Scraping
 *
 * Tier 1: CF Browser Rendering (domcontentloaded) - Fast, ~350ms
 * Tier 2: CF Browser Rendering (networkidle2) - JS wait, ~2s
 * Tier 3: HTML parsing fallback - ~1.5s
 *
 * Features:
 * - Automatic fallback on bot protection detection
 * - Multiple return formats (markdown, html, text)
 * - Configurable strategy (fast, balanced, aggressive)
 * - SSRF protection (blocks private/internal IPs by default)
 */
import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js';
import type { AgentConfig } from '../../../runtime/parser.js';
import type { ScrapeResult } from './types.js';
export declare class ScrapeMember extends BaseAgent {
    private readonly env;
    private scrapeConfig;
    constructor(config: AgentConfig, env: Env);
    protected run(context: AgentExecutionContext): Promise<ScrapeResult>;
    /**
     * Tier 1: Fast browser rendering with domcontentloaded
     */
    private tier1Fast;
    /**
     * Tier 2: Slow browser rendering with networkidle2
     */
    private tier2Slow;
    /**
     * Tier 3: HTML parsing fallback
     */
    private tier3HTMLParsing;
    /**
     * Format the result based on configured return format
     */
    private formatResult;
    /**
     * Return a fallback result when all tiers fail
     */
    private fallbackResult;
}
//# sourceMappingURL=scrape-agent.d.ts.map