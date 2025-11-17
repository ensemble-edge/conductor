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

import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import type { ToolsConfig, ToolsInput, ToolsResult, MCPServerConfig } from './types.js'
import { MCPClient } from './mcp-client.js'

export class ToolsMember extends BaseAgent {
	private toolsConfig: ToolsConfig
	private mcpServerConfig: MCPServerConfig | null = null

	constructor(
		config: AgentConfig,
		private readonly env: Env
	) {
		super(config)

		const cfg = config.config as ToolsConfig | undefined
		if (!cfg || !cfg.mcp || !cfg.tool) {
			throw new Error('Tools agent requires "mcp" (server name) and "tool" (tool name) in config')
		}

		this.toolsConfig = {
			mcp: cfg.mcp,
			tool: cfg.tool,
			timeout: cfg.timeout,
			cacheDiscovery: cfg.cacheDiscovery ?? true,
			cacheTTL: cfg.cacheTTL || 3600,
		}
	}

	protected async run(context: AgentExecutionContext): Promise<ToolsResult> {
		const input = context.input as ToolsInput
		const startTime = Date.now()

		try {
			// Load MCP server configuration
			const serverConfig = await this.loadMCPServerConfig()

			// Create MCP client
			const client = new MCPClient(serverConfig)

			// Invoke tool
			const response = await client.invokeTool(this.toolsConfig.tool, input)

			return {
				tool: this.toolsConfig.tool,
				server: this.toolsConfig.mcp,
				content: response.content,
				duration: Date.now() - startTime,
				isError: response.isError,
			}
		} catch (error) {
			throw new Error(
				`Failed to invoke tool "${this.toolsConfig.tool}" on MCP server "${this.toolsConfig.mcp}": ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			)
		}
	}

	/**
	 * Load MCP server configuration from conductor config
	 */
	private async loadMCPServerConfig(): Promise<MCPServerConfig> {
		// In a real implementation, this would load from conductor.config.ts
		// For now, we'll check if it's available in env bindings
		const mcpServers = (this.env as any).MCP_SERVERS as
			| Record<string, MCPServerConfig>
			| undefined

		if (!mcpServers) {
			throw new Error(
				'MCP servers not configured. Add MCP_SERVERS binding or configure in conductor.config.ts'
			)
		}

		const serverConfig = mcpServers[this.toolsConfig.mcp]
		if (!serverConfig) {
			throw new Error(
				`MCP server "${this.toolsConfig.mcp}" not found in configuration. Available servers: ${Object.keys(mcpServers).join(', ')}`
			)
		}

		// Override timeout if specified in agent config
		if (this.toolsConfig.timeout) {
			serverConfig.timeout = this.toolsConfig.timeout
		}

		return serverConfig
	}

	/**
	 * Discover available tools from MCP server (for AI agent tool access)
	 */
	async discoverTools(): Promise<any[]> {
		const serverConfig = await this.loadMCPServerConfig()
		const client = new MCPClient(serverConfig)

		// Check cache if enabled
		if (this.toolsConfig.cacheDiscovery) {
			const cached = await this.getCachedTools(this.toolsConfig.mcp)
			if (cached) {
				return cached
			}
		}

		// Fetch tools
		const response = await client.listTools()

		// Cache if enabled
		if (this.toolsConfig.cacheDiscovery) {
			await this.cacheTools(this.toolsConfig.mcp, response.tools)
		}

		return response.tools
	}

	/**
	 * Get cached tools from KV
	 */
	private async getCachedTools(serverName: string): Promise<any[] | null> {
		try {
			const kv = (this.env as any).MCP_CACHE as KVNamespace | undefined
			if (!kv) return null

			const cacheKey = `mcp:tools:${serverName}`
			const cached = await kv.get(cacheKey, 'json')
			return cached as any[] | null
		} catch (error) {
			// Cache miss or error, return null
			return null
		}
	}

	/**
	 * Cache tools in KV
	 */
	private async cacheTools(serverName: string, tools: any[]): Promise<void> {
		try {
			const kv = (this.env as any).MCP_CACHE as KVNamespace | undefined
			if (!kv) return

			const cacheKey = `mcp:tools:${serverName}`
			await kv.put(cacheKey, JSON.stringify(tools), {
				expirationTtl: this.toolsConfig.cacheTTL,
			})
		} catch (error) {
			// Ignore cache errors
		}
	}
}
