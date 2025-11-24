import { B as BaseAgent } from "./worker-entry-kH6ZwluV.js";
class MCPClient {
  constructor(config) {
    this.config = config;
  }
  /**
   * Discover available tools from MCP server
   */
  async listTools() {
    const url = `${this.config.url}/tools`;
    const response = await this.request(url, {
      method: "GET"
    });
    return response;
  }
  /**
   * Invoke a tool on the MCP server
   */
  async invokeTool(toolName, args) {
    const url = `${this.config.url}/tools/${encodeURIComponent(toolName)}`;
    const body = {
      name: toolName,
      arguments: args
    };
    const response = await this.request(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    });
    return response;
  }
  /**
   * Make an authenticated HTTP request to MCP server
   */
  async request(url, options) {
    const headers = {
      ...options.headers
    };
    if (this.config.auth) {
      if (this.config.auth.type === "bearer" && this.config.auth.token) {
        headers["Authorization"] = `Bearer ${this.config.auth.token}`;
      } else if (this.config.auth.type === "oauth" && this.config.auth.accessToken) {
        headers["Authorization"] = `Bearer ${this.config.auth.accessToken}`;
      }
    }
    const timeout = this.config.timeout || 3e4;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `MCP server error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`MCP request timeout after ${timeout}ms`);
        }
        throw error;
      }
      throw new Error("Unknown MCP client error");
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
class ToolsMember extends BaseAgent {
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
      cacheTTL: cfg.cacheTTL || 3600
    };
  }
  async run(context) {
    const input = context.input;
    const startTime = Date.now();
    try {
      const serverConfig = await this.loadMCPServerConfig();
      const client = new MCPClient(serverConfig);
      const response = await client.invokeTool(this.toolsConfig.tool, input);
      return {
        tool: this.toolsConfig.tool,
        server: this.toolsConfig.mcp,
        content: response.content,
        duration: Date.now() - startTime,
        isError: response.isError
      };
    } catch (error) {
      throw new Error(
        `Failed to invoke tool "${this.toolsConfig.tool}" on MCP server "${this.toolsConfig.mcp}": ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Load MCP server configuration from conductor config
   */
  async loadMCPServerConfig() {
    const mcpServers = this.env.MCP_SERVERS;
    if (!mcpServers) {
      throw new Error(
        "MCP servers not configured. Add MCP_SERVERS binding or configure in conductor.config.ts"
      );
    }
    const serverConfig = mcpServers[this.toolsConfig.mcp];
    if (!serverConfig) {
      throw new Error(
        `MCP server "${this.toolsConfig.mcp}" not found in configuration. Available servers: ${Object.keys(mcpServers).join(", ")}`
      );
    }
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
    if (this.toolsConfig.cacheDiscovery) {
      const cached = await this.getCachedTools(this.toolsConfig.mcp);
      if (cached) {
        return cached;
      }
    }
    const response = await client.listTools();
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
      if (!kv) return null;
      const cacheKey = `mcp:tools:${serverName}`;
      const cached = await kv.get(cacheKey, "json");
      return cached;
    } catch (error) {
      return null;
    }
  }
  /**
   * Cache tools in KV
   */
  async cacheTools(serverName, tools) {
    try {
      const kv = this.env.MCP_CACHE;
      if (!kv) return;
      const cacheKey = `mcp:tools:${serverName}`;
      await kv.put(cacheKey, JSON.stringify(tools), {
        expirationTtl: this.toolsConfig.cacheTTL
      });
    } catch (error) {
    }
  }
}
export {
  MCPClient,
  ToolsMember
};
//# sourceMappingURL=index-K2keZ3ms.js.map
