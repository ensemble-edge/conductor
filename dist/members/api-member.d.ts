/**
 * API Member Engine
 *
 * Makes HTTP requests to external APIs
 * Handles method, headers, body, timeouts, and response parsing
 */
import { BaseMember, type MemberExecutionContext } from './base-member';
import type { MemberConfig } from '../runtime/parser';
export interface APIConfig {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
}
/**
 * API Member makes HTTP requests to external services
 *
 * @example User's member definition:
 * ```yaml
 * # members/fetch-company/member.yaml
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
export declare class APIMember extends BaseMember {
    private apiConfig;
    constructor(config: MemberConfig);
    /**
     * Execute the API request
     */
    protected run(context: MemberExecutionContext): Promise<{
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
//# sourceMappingURL=api-member.d.ts.map