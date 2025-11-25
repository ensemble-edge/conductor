/**
 * Tool Primitives
 *
 * Provides primitives for defining and configuring tools that agents can use.
 * Supports MCP (Model Context Protocol) tools, custom functions, and skill integration.
 */
/**
 * Tool class - runtime representation of a tool configuration
 */
export class Tool {
    constructor(config) {
        this.config = config;
        // Extract name and description based on tool type
        if (config.type === 'custom' || config.type === 'http') {
            this.name = config.definition.name;
            this.description = config.definition.description;
            this.parameters = config.definition.parameters;
            this.metadata = config.definition.metadata;
        }
        else if (config.type === 'mcp') {
            this.name = config.name ?? 'mcp-server';
            this.description = `MCP Server: ${config.url ?? config.name}`;
        }
        else if (config.type === 'skill') {
            this.name = config.tool ?? config.skill;
            this.description = `Skill: ${config.skill}`;
        }
        else {
            this.name = 'unknown';
            this.description = 'Unknown tool type';
        }
    }
    /**
     * Check if this is an MCP server tool
     */
    isMCP() {
        return this.config.type === 'mcp';
    }
    /**
     * Check if this is a custom tool
     */
    isCustom() {
        return this.config.type === 'custom';
    }
    /**
     * Check if this is an HTTP tool
     */
    isHTTP() {
        return this.config.type === 'http';
    }
    /**
     * Check if this is a skill reference
     */
    isSkill() {
        return this.config.type === 'skill';
    }
    /**
     * Convert to plain config object
     */
    toConfig() {
        return this.config;
    }
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
export function mcpTool(config) {
    return new Tool({ type: 'mcp', ...config });
}
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
export function customTool(options) {
    return new Tool({
        type: 'custom',
        definition: {
            name: options.name,
            description: options.description,
            parameters: options.parameters,
            metadata: options.metadata,
        },
        handler: options.handler,
        execute: options.execute,
    });
}
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
export function httpTool(options) {
    return new Tool({
        type: 'http',
        definition: {
            name: options.name,
            description: options.description,
            parameters: options.parameters,
            metadata: options.metadata,
        },
        url: options.url,
        method: options.method,
        headers: options.headers,
        auth: options.auth,
    });
}
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
export function skillTool(options) {
    return new Tool({
        type: 'skill',
        skill: options.skill,
        tool: options.tool,
        config: options.config,
    });
}
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
export function createTool(config) {
    return new Tool(config);
}
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
export function toolCollection(options) {
    return {
        name: options.name,
        tools: options.tools.map((t) => (t instanceof Tool ? t.toConfig() : t)),
        timeout: options.timeout,
        maxConcurrent: options.maxConcurrent,
        retry: options.retry,
    };
}
/**
 * Check if a value is a Tool instance
 */
export function isTool(value) {
    return value instanceof Tool;
}
/**
 * Check if a value is a valid tool configuration
 */
export function isToolConfig(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const config = value;
    return ['mcp', 'custom', 'http', 'skill'].includes(config.type);
}
