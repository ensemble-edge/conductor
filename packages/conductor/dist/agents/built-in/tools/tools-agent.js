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
import { BaseAgent } from '../../base-agent.js';
import { MCPClient } from './mcp-client.js';
export class ToolsMember extends BaseAgent {
    constructor(config, env) {
        super(config);
        this.env = env;
        this.mcpServerConfig = null;
        const cfg = config.config;
        if (!cfg || !cfg.mcp || !cfg.tool) {
            throw new Error('Tools agent requires "mcp" (server name) and "tool" (tool name) in config');
        }
        this.toolsConfig = {
            mcp: cfg.mcp,
            tool: cfg.tool,
            timeout: cfg.timeout,
            cacheDiscovery: cfg.cacheDiscovery ?? true,
            cacheTTL: cfg.cacheTTL || 3600,
        };
    }
    async run(context) {
        const input = context.input;
        const startTime = Date.now();
        try {
            // Load MCP server configuration
            const serverConfig = await this.loadMCPServerConfig();
            // Create MCP client
            const client = new MCPClient(serverConfig);
            // Invoke tool
            const response = await client.invokeTool(this.toolsConfig.tool, input);
            return {
                tool: this.toolsConfig.tool,
                server: this.toolsConfig.mcp,
                content: response.content,
                duration: Date.now() - startTime,
                isError: response.isError,
            };
        }
        catch (error) {
            throw new Error(`Failed to invoke tool "${this.toolsConfig.tool}" on MCP server "${this.toolsConfig.mcp}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Load MCP server configuration from conductor config
     */
    async loadMCPServerConfig() {
        // In a real implementation, this would load from conductor.config.ts
        // For now, we'll check if it's available in env bindings
        const mcpServers = this.env.MCP_SERVERS;
        if (!mcpServers) {
            throw new Error('MCP servers not configured. Add MCP_SERVERS binding or configure in conductor.config.ts');
        }
        const serverConfig = mcpServers[this.toolsConfig.mcp];
        if (!serverConfig) {
            throw new Error(`MCP server "${this.toolsConfig.mcp}" not found in configuration. Available servers: ${Object.keys(mcpServers).join(', ')}`);
        }
        // Override timeout if specified in agent config
        if (this.toolsConfig.timeout) {
            serverConfig.timeout = this.toolsConfig.timeout;
        }
        return serverConfig;
    }
    /**
     * Discover available tools from MCP server (for AI agent tool access)
     */
    async discoverTools() {
        const serverConfig = await this.loadMCPServerConfig();
        const client = new MCPClient(serverConfig);
        // Check cache if enabled
        if (this.toolsConfig.cacheDiscovery) {
            const cached = await this.getCachedTools(this.toolsConfig.mcp);
            if (cached) {
                return cached;
            }
        }
        // Fetch tools
        const response = await client.listTools();
        // Cache if enabled
        if (this.toolsConfig.cacheDiscovery) {
            await this.cacheTools(this.toolsConfig.mcp, response.tools);
        }
        return response.tools;
    }
    /**
     * Get cached tools from KV
     */
    async getCachedTools(serverName) {
        try {
            const kv = this.env.MCP_CACHE;
            if (!kv)
                return null;
            const cacheKey = `mcp:tools:${serverName}`;
            const cached = await kv.get(cacheKey, 'json');
            return cached;
        }
        catch (error) {
            // Cache miss or error, return null
            return null;
        }
    }
    /**
     * Cache tools in KV
     */
    async cacheTools(serverName, tools) {
        try {
            const kv = this.env.MCP_CACHE;
            if (!kv)
                return;
            const cacheKey = `mcp:tools:${serverName}`;
            await kv.put(cacheKey, JSON.stringify(tools), {
                expirationTtl: this.toolsConfig.cacheTTL,
            });
        }
        catch (error) {
            // Ignore cache errors
        }
    }
}
