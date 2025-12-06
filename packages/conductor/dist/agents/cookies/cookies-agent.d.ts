/**
 * Cookies Agent
 *
 * Cookie management operation with:
 * - Read cookies from request (get, getAll)
 * - Set cookies on response (set)
 * - Delete cookies (delete)
 * - Consent integration with location context
 * - Graceful handling of non-HTTP triggers
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { CookiesOutput } from './types/index.js';
export declare class CookiesAgent extends BaseAgent {
    private cookiesConfig;
    constructor(config: AgentConfig);
    /**
     * Validate agent configuration
     */
    private validateConfig;
    /**
     * Execute cookie operation
     */
    protected run(context: AgentExecutionContext): Promise<CookiesOutput>;
    /**
     * Get a single cookie value
     */
    private handleGet;
    /**
     * Get all cookies
     */
    private handleGetAll;
    /**
     * Set a cookie
     */
    private handleSet;
    /**
     * Delete a cookie
     */
    private handleDelete;
    /**
     * Get parsed cookies from context
     * First checks input.cookies (set by trigger), then falls back to parsing request header
     */
    private getCookiesFromContext;
    /**
     * Check if context has HTTP capabilities
     */
    private hasHttpContext;
    /**
     * Get trigger type from context
     */
    private getTriggerType;
    /**
     * Add Set-Cookie header to context for response building
     */
    private addSetCookieHeader;
}
//# sourceMappingURL=cookies-agent.d.ts.map