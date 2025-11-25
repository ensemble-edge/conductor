/**
 * Tool Primitives
 *
 * Provides primitives for defining and configuring tools that agents can use.
 * Supports MCP (Model Context Protocol) tools, custom functions, and skill integration.
 */
/**
 * Tool parameter definition
 */
export interface ToolParameter {
    /** Parameter name */
    name: string;
    /** Parameter type */
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    /** Description for the AI model */
    description?: string;
    /** Whether the parameter is required */
    required?: boolean;
    /** Default value if not provided */
    default?: unknown;
    /** Enum values for constrained parameters */
    enum?: unknown[];
    /** JSON Schema for complex types */
    schema?: Record<string, unknown>;
}
/**
 * Tool definition for agent use
 */
export interface ToolDefinition {
    /** Tool identifier */
    name: string;
    /** Human-readable description */
    description: string;
    /** Input parameters */
    parameters?: ToolParameter[];
    /** Parameter schema (JSON Schema format) */
    inputSchema?: Record<string, unknown>;
    /** Return type description */
    returns?: {
        type: string;
        description?: string;
        schema?: Record<string, unknown>;
    };
    /** Tool metadata */
    metadata?: Record<string, unknown>;
}
/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
    /** Server type */
    type: 'mcp';
    /** Server URL or connection string */
    url?: string;
    /** Server name for local servers */
    name?: string;
    /** Transport type */
    transport?: 'stdio' | 'http' | 'websocket';
    /** Command to start the server (for stdio transport) */
    command?: string;
    /** Arguments for the command */
    args?: string[];
    /** Environment variables */
    env?: Record<string, string>;
    /** Authentication configuration */
    auth?: {
        type: 'bearer' | 'api-key' | 'oauth';
        token?: string;
        secret?: string;
    };
    /** Tool filtering - only expose these tools */
    tools?: string[];
    /** Tool filtering - exclude these tools */
    excludeTools?: string[];
}
/**
 * Custom tool configuration (JavaScript function)
 */
export interface CustomToolConfig {
    /** Tool type */
    type: 'custom';
    /** Tool definition */
    definition: ToolDefinition;
    /** Handler function path (for bundled code) */
    handler?: string;
    /** Inline handler (only for programmatic use) */
    execute?: (input: Record<string, unknown>) => Promise<unknown>;
}
/**
 * HTTP API tool configuration
 */
export interface HTTPToolConfig {
    /** Tool type */
    type: 'http';
    /** Tool definition */
    definition: ToolDefinition;
    /** API endpoint URL */
    url: string;
    /** HTTP method */
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** Request headers */
    headers?: Record<string, string>;
    /** Response mapping */
    responseMapping?: Record<string, string>;
    /** Authentication */
    auth?: {
        type: 'bearer' | 'api-key' | 'basic';
        token?: string;
        key?: string;
        secret?: string;
    };
}
/**
 * Skill reference configuration
 */
export interface SkillToolConfig {
    /** Tool type */
    type: 'skill';
    /** Skill name to reference */
    skill: string;
    /** Tool name within the skill */
    tool?: string;
    /** Override configuration */
    config?: Record<string, unknown>;
}
/**
 * Union type for all tool configurations
 */
export type ToolConfig = MCPServerConfig | CustomToolConfig | HTTPToolConfig | SkillToolConfig;
/**
 * Tool collection for agent configuration
 */
export interface ToolCollection {
    /** Collection name */
    name?: string;
    /** Tools in this collection */
    tools: ToolConfig[];
    /** Default timeout for tool calls */
    timeout?: number;
    /** Maximum concurrent tool calls */
    maxConcurrent?: number;
    /** Retry configuration */
    retry?: {
        maxAttempts: number;
        backoff?: 'linear' | 'exponential';
        initialDelay?: number;
    };
}
/**
 * Tool class - runtime representation of a tool configuration
 */
export declare class Tool {
    readonly name: string;
    readonly description: string;
    readonly config: ToolConfig;
    readonly parameters?: ToolParameter[];
    readonly metadata?: Record<string, unknown>;
    constructor(config: ToolConfig);
    /**
     * Check if this is an MCP server tool
     */
    isMCP(): this is Tool & {
        config: MCPServerConfig;
    };
    /**
     * Check if this is a custom tool
     */
    isCustom(): this is Tool & {
        config: CustomToolConfig;
    };
    /**
     * Check if this is an HTTP tool
     */
    isHTTP(): this is Tool & {
        config: HTTPToolConfig;
    };
    /**
     * Check if this is a skill reference
     */
    isSkill(): this is Tool & {
        config: SkillToolConfig;
    };
    /**
     * Convert to plain config object
     */
    toConfig(): ToolConfig;
}
/**
 * Create an MCP tool configuration
 *
 * @example
 * ```typescript
 * const browserTool = mcpTool({
 *   url: 'https://mcp.example.com/browser',
 *   auth: { type: 'bearer', token: '${env.MCP_TOKEN}' },
 *   tools: ['navigate', 'screenshot', 'click']
 * });
 * ```
 */
export declare function mcpTool(config: Omit<MCPServerConfig, 'type'>): Tool;
/**
 * Create a custom tool from a function definition
 *
 * @example
 * ```typescript
 * const calculatorTool = customTool({
 *   name: 'calculator',
 *   description: 'Performs mathematical calculations',
 *   parameters: [
 *     { name: 'expression', type: 'string', required: true }
 *   ],
 *   handler: 'tools/calculator'
 * });
 * ```
 */
export declare function customTool(options: {
    name: string;
    description: string;
    parameters?: ToolParameter[];
    handler?: string;
    execute?: (input: Record<string, unknown>) => Promise<unknown>;
    metadata?: Record<string, unknown>;
}): Tool;
/**
 * Create an HTTP API tool
 *
 * @example
 * ```typescript
 * const weatherTool = httpTool({
 *   name: 'get_weather',
 *   description: 'Get current weather for a location',
 *   url: 'https://api.weather.com/v1/current',
 *   method: 'GET',
 *   parameters: [
 *     { name: 'location', type: 'string', required: true }
 *   ],
 *   auth: { type: 'api-key', key: '${env.WEATHER_API_KEY}' }
 * });
 * ```
 */
export declare function httpTool(options: {
    name: string;
    description: string;
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    parameters?: ToolParameter[];
    auth?: HTTPToolConfig['auth'];
    metadata?: Record<string, unknown>;
}): Tool;
/**
 * Create a skill reference tool
 *
 * @example
 * ```typescript
 * const searchTool = skillTool({
 *   skill: 'web-search',
 *   tool: 'search',
 *   config: { maxResults: 10 }
 * });
 * ```
 */
export declare function skillTool(options: {
    skill: string;
    tool?: string;
    config?: Record<string, unknown>;
}): Tool;
/**
 * Create a tool from any supported configuration
 *
 * @example
 * ```typescript
 * const tool = createTool({
 *   type: 'mcp',
 *   url: 'https://mcp.example.com'
 * });
 * ```
 */
export declare function createTool(config: ToolConfig): Tool;
/**
 * Create a tool collection
 *
 * @example
 * ```typescript
 * const tools = toolCollection({
 *   name: 'research-tools',
 *   tools: [
 *     mcpTool({ url: 'https://mcp.example.com/browser' }),
 *     httpTool({ name: 'search', url: '...' })
 *   ],
 *   timeout: 30000,
 *   maxConcurrent: 3
 * });
 * ```
 */
export declare function toolCollection(options: {
    name?: string;
    tools: (Tool | ToolConfig)[];
    timeout?: number;
    maxConcurrent?: number;
    retry?: ToolCollection['retry'];
}): ToolCollection;
/**
 * Check if a value is a Tool instance
 */
export declare function isTool(value: unknown): value is Tool;
/**
 * Check if a value is a valid tool configuration
 */
export declare function isToolConfig(value: unknown): value is ToolConfig;
//# sourceMappingURL=tool.d.ts.map