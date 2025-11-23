/**
 * HTML Agent
 *
 * Renders HTML templates with support for:
 * - Multiple template engines (Simple, Handlebars, Liquid, MJML)
 * - Template loading from KV, R2, or inline
 * - Cookie management (set, read, delete, signed cookies)
 * - CSS inlining for email compatibility
 * - HTML minification
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { HtmlMemberOutput } from './types/index.js';
export declare class HtmlMember extends BaseAgent {
    private htmlConfig;
    constructor(config: AgentConfig);
    /**
     * Validate agent configuration
     */
    private validateConfig;
    /**
     * Execute HTML rendering
     */
    protected run(context: AgentExecutionContext): Promise<HtmlMemberOutput>;
    /**
     * Load layout content from ComponentLoader or registered partial
     */
    private loadLayoutContent;
    /**
     * Get default template helpers
     */
    private getDefaultHelpers;
    /**
     * Inline CSS for email compatibility
     * Simple implementation - for production use a library like juice
     */
    private inlineCss;
    /**
     * Minify HTML (basic implementation)
     */
    private minifyHtml;
}
//# sourceMappingURL=html-agent.d.ts.map