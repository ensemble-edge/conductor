/**
 * MCP Client - HTTP Transport
 *
 * Client for communicating with MCP servers over HTTP
 */
export class MCPClient {
    constructor(config) {
        this.config = config;
    }
    /**
     * Discover available tools from MCP server
     */
    async listTools() {
        const url = `${this.config.url}/tools`;
        const response = await this.request(url, {
            method: 'GET',
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
            arguments: args,
        };
        const response = await this.request(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response;
    }
    /**
     * Make an authenticated HTTP request to MCP server
     */
    async request(url, options) {
        // Add authentication headers
        const headers = {
            ...options.headers,
        };
        if (this.config.auth) {
            if (this.config.auth.type === 'bearer' && this.config.auth.token) {
                headers['Authorization'] = `Bearer ${this.config.auth.token}`;
            }
            else if (this.config.auth.type === 'oauth' && this.config.auth.accessToken) {
                headers['Authorization'] = `Bearer ${this.config.auth.accessToken}`;
            }
        }
        // Set timeout
        const timeout = this.config.timeout || 30000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`MCP server error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`MCP request timeout after ${timeout}ms`);
                }
                throw error;
            }
            throw new Error('Unknown MCP client error');
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
}
