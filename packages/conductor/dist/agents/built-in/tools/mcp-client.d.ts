/**
 * MCP Client - HTTP Transport
 *
 * Client for communicating with MCP servers over HTTP
 */
import type { MCPServerConfig, MCPToolListResponse, MCPToolInvocationResponse } from './types.js';
export declare class MCPClient {
    private readonly config;
    constructor(config: MCPServerConfig);
    /**
     * Discover available tools from MCP server
     */
    listTools(): Promise<MCPToolListResponse>;
    /**
     * Invoke a tool on the MCP server
     */
    invokeTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolInvocationResponse>;
    /**
     * Make an authenticated HTTP request to MCP server
     */
    private request;
}
//# sourceMappingURL=mcp-client.d.ts.map