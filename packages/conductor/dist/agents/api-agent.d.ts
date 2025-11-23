/**
 * API Agent Engine
 *
 * Makes HTTP requests to external APIs
 * Handles method, headers, body, timeouts, and response parsing
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import type { RouteAuthConfig } from '../routing/config.js';
export interface APIConfig {
    /** Route configuration for UnifiedRouter integration */
    route?: {
        /** Route path (e.g., "/api/v1/users") */
        path?: string;
        /** HTTP methods (defaults to ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) */
        methods?: string[];
        /** Auth configuration */
        auth?: Partial<RouteAuthConfig>;
        /** Priority (defaults to 50 for APIs) */
        priority?: number;
        /** Response headers to add/override */
        headers?: Record<string, string>;
        /** CORS configuration */
        cors?: {
            origins?: string[] | '*';
            methods?: string[];
            allowedHeaders?: string[];
            exposedHeaders?: string[];
            credentials?: boolean;
            maxAge?: number;
        };
    };
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
}
/**
 * API Agent makes HTTP requests to external services
 *
 * @example User's agent definition:
 * ```yaml
 * # agents/fetch-company/agent.yaml
 * name: fetch-company
 * type: API
 * description: Fetch company data from external API
 * config:
 *   url: https://api.example.com/company
 *   method: GET
 *   headers:
 *     Authorization: Bearer ${env.API_KEY}
 *   timeout: 5000
 * schema:
 *   input:
 *     domain: string
 *   output:
 *     data: object
 * ```
 */
export declare class APIAgent extends BaseAgent {
    private apiConfig;
    constructor(config: AgentConfig);
    /**
     * Execute the API request
     */
    protected run(context: AgentExecutionContext): Promise<{
        status: number;
        headers: Record<string, string>;
        data: unknown;
    }>;
    /**
     * Resolve headers (may contain env var references)
     */
    private resolveHeaders;
    /**
     * Execute request with timeout and retry logic
     */
    private executeWithRetries;
    /**
     * Get API configuration
     */
    getAPIConfig(): APIConfig;
}
//# sourceMappingURL=api-agent.d.ts.map