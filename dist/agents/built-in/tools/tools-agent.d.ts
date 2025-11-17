/**
 * Tools Agent - MCP Tool Invocation
 *
 * Invokes external MCP (Model Context Protocol) tools over HTTP.
 *
 * Features:
 * - HTTP-only transport (no stdio complexity)
 * - Tool discovery caching
 * - Bearer and OAuth authentication
 * - Configurable timeouts
 */
import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js';
import type { AgentConfig } from '../../../runtime/parser.js';
import type { ToolsResult } from './types.js';
export declare class ToolsMember extends BaseAgent {
    private readonly env;
    private toolsConfig;
    private mcpServerConfig;
    constructor(config: AgentConfig, env: Env);
    protected run(context: AgentExecutionContext): Promise<ToolsResult>;
    /**
     * Load MCP server configuration from conductor config
     */
    private loadMCPServerConfig;
    /**
     * Discover available tools from MCP server (for AI agent tool access)
     */
    discoverTools(): Promise<any[]>;
    /**
     * Get cached tools from KV
     */
    private getCachedTools;
    /**
     * Cache tools in KV
     */
    private cacheTools;
}
//# sourceMappingURL=tools-agent.d.ts.map