/**
 * Tools Agent - Type Definitions
 *
 * For invoking external MCP (Model Context Protocol) tools over HTTP
 */

/**
 * MCP server authentication configuration
 */
export interface MCPAuth {
	/** Auth type */
	type: 'bearer' | 'oauth'
	/** Bearer token (for bearer auth) */
	token?: string
	/** OAuth access token (for oauth auth) */
	accessToken?: string
}

/**
 * MCP server configuration (from conductor.config.ts)
 */
export interface MCPServerConfig {
	/** Server URL */
	url: string
	/** Authentication */
	auth?: MCPAuth
	/** Request timeout in ms */
	timeout?: number
}

/**
 * MCP tool parameter schema
 */
export interface MCPToolParameter {
	type: string
	description?: string
	required?: boolean
	enum?: string[]
	items?: MCPToolParameter
	properties?: Record<string, MCPToolParameter>
}

/**
 * MCP tool definition
 */
export interface MCPTool {
	/** Tool name */
	name: string
	/** Tool description */
	description: string
	/** Input schema */
	inputSchema: {
		type: 'object'
		properties: Record<string, MCPToolParameter>
		required?: string[]
	}
}

/**
 * MCP tool list response
 */
export interface MCPToolListResponse {
	tools: MCPTool[]
}

/**
 * MCP tool invocation request
 */
export interface MCPToolInvocationRequest {
	/** Tool name */
	name: string
	/** Tool arguments */
	arguments: Record<string, unknown>
}

/**
 * MCP tool invocation response
 */
export interface MCPToolInvocationResponse {
	/** Tool result content */
	content: Array<{
		type: 'text' | 'image' | 'resource'
		text?: string
		data?: string
		mimeType?: string
	}>
	/** Whether execution succeeded */
	isError?: boolean
}

/**
 * Tools agent configuration
 */
export interface ToolsConfig {
	/** MCP server name (from conductor.config.ts) */
	mcp: string
	/** Tool name to invoke */
	tool: string
	/** Request timeout override */
	timeout?: number
	/** Enable caching of tool discovery */
	cacheDiscovery?: boolean
	/** Cache TTL in seconds */
	cacheTTL?: number
}

/**
 * Tools agent input
 */
export interface ToolsInput {
	/** Tool arguments */
	[key: string]: unknown
}

/**
 * Tools agent output
 */
export interface ToolsResult {
	/** Tool name that was invoked */
	tool: string
	/** MCP server name */
	server: string
	/** Tool result content */
	content: MCPToolInvocationResponse['content']
	/** Execution duration in ms */
	duration: number
	/** Whether result is from cache */
	cached?: boolean
	/** Error flag */
	isError?: boolean
}
