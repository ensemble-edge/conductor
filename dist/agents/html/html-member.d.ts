/**
 * HTML Member
 *
 * Renders HTML templates with support for:
 * - Multiple template engines (Simple, Handlebars, Liquid, MJML)
 * - Template loading from KV, R2, or inline
 * - Cookie management (set, read, delete, signed cookies)
 * - CSS inlining for email compatibility
 * - HTML minification
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import type { HtmlMemberOutput } from './types/index.js';
export declare class HtmlMember extends BaseMember {
    private htmlConfig;
    constructor(config: MemberConfig);
    /**
     * Validate member configuration
     */
    private validateConfig;
    /**
     * Execute HTML rendering
     */
    protected run(context: MemberExecutionContext): Promise<HtmlMemberOutput>;
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
//# sourceMappingURL=html-member.d.ts.map