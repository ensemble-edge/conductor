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
 */
import { BaseAgent } from '../../base-agent.js';
import { detectBotProtection, isContentSuccessful } from './bot-detection.js';
import { extractTextFromHTML, extractTitleFromHTML, convertHTMLToMarkdown } from './html-parser.js';
import { createLogger } from '../../../observability/index.js';
const logger = createLogger({ serviceName: 'scrape-agent' });
export class ScrapeMember extends BaseAgent {
    constructor(config, env) {
        super(config);
        this.env = env;
        const cfg = config.config;
        this.scrapeConfig = {
            strategy: cfg?.strategy || 'balanced',
            returnFormat: cfg?.returnFormat || 'markdown',
            blockResources: cfg?.blockResources !== false,
            userAgent: cfg?.userAgent,
            timeout: cfg?.timeout || 30000,
        };
    }
    async run(context) {
        const input = context.input;
        if (!input.url) {
            throw new Error('Scrape agent requires "url" in input');
        }
        const startTime = Date.now();
        const strategy = this.scrapeConfig.strategy;
        // Tier 1: Fast browser rendering (domcontentloaded)
        try {
            const result = await this.tier1Fast(input.url);
            if (isContentSuccessful(result.html)) {
                return this.formatResult(result, 1, Date.now() - startTime);
            }
        }
        catch (error) {
            logger.debug('Tier 1 fast scrape failed, trying Tier 2', {
                url: input.url,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        // If strategy is 'fast', return fallback
        if (strategy === 'fast') {
            return this.fallbackResult(input.url, Date.now() - startTime);
        }
        // Tier 2: Slow browser rendering (networkidle2)
        try {
            const result = await this.tier2Slow(input.url);
            if (isContentSuccessful(result.html)) {
                return this.formatResult(result, 2, Date.now() - startTime);
            }
        }
        catch (error) {
            logger.debug('Tier 2 slow scrape failed, trying Tier 3', {
                url: input.url,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        // If strategy is 'balanced', return fallback
        if (strategy === 'balanced') {
            return this.fallbackResult(input.url, Date.now() - startTime);
        }
        // Tier 3: HTML parsing fallback
        const result = await this.tier3HTMLParsing(input.url);
        return this.formatResult(result, 3, Date.now() - startTime);
    }
    /**
     * Tier 1: Fast browser rendering with domcontentloaded
     */
    async tier1Fast(url) {
        // TODO: Integrate with Cloudflare Browser Rendering API
        // For now, use standard fetch as placeholder
        const response = await fetch(url, {
            headers: {
                'User-Agent': this.scrapeConfig.userAgent || 'Mozilla/5.0 (compatible; Conductor/1.0)',
            },
            signal: AbortSignal.timeout(this.scrapeConfig.timeout),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const title = extractTitleFromHTML(html);
        return { html, title };
    }
    /**
     * Tier 2: Slow browser rendering with networkidle2
     */
    async tier2Slow(url) {
        // TODO: Integrate with Cloudflare Browser Rendering API with networkidle2
        // For now, fallback to tier1
        return await this.tier1Fast(url);
    }
    /**
     * Tier 3: HTML parsing fallback
     */
    async tier3HTMLParsing(url) {
        const response = await fetch(url, {
            headers: {
                'User-Agent': this.scrapeConfig.userAgent || 'Mozilla/5.0 (compatible; Conductor/1.0)',
            },
            signal: AbortSignal.timeout(this.scrapeConfig.timeout),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        const title = extractTitleFromHTML(html);
        return { html, title };
    }
    /**
     * Format the result based on configured return format
     */
    formatResult(data, tier, duration) {
        const botProtection = detectBotProtection(data.html);
        const format = this.scrapeConfig.returnFormat;
        const result = {
            url: '',
            tier,
            duration,
            botProtectionDetected: botProtection.detected,
            contentLength: data.html.length,
            title: data.title,
        };
        // Add requested format
        if (format === 'html' || format === 'markdown') {
            result.html = data.html;
        }
        if (format === 'markdown') {
            result.markdown = convertHTMLToMarkdown(data.html);
        }
        if (format === 'text') {
            result.text = extractTextFromHTML(data.html);
        }
        return result;
    }
    /**
     * Return a fallback result when all tiers fail
     */
    fallbackResult(url, duration) {
        return {
            url,
            tier: 3,
            duration,
            botProtectionDetected: true,
            contentLength: 0,
            markdown: '',
            html: '',
            text: '',
        };
    }
}
