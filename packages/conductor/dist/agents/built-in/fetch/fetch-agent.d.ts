/**
 * Fetch Agent - HTTP Client with Retry Logic
 *
 * Features:
 * - Configurable retry attempts with exponential backoff
 * - Timeout handling
 * - Custom headers support
 * - Multiple HTTP methods
 * - SSRF protection (blocks private/internal IPs by default)
 */
import { BaseAgent, type AgentExecutionContext } from '../../base-agent.js';
import type { AgentConfig } from '../../../runtime/parser.js';
import type { FetchResult } from './types.js';
export declare class FetchMember extends BaseAgent {
    private readonly env;
    private fetchConfig;
    constructor(config: AgentConfig, env: Env);
    protected run(context: AgentExecutionContext): Promise<FetchResult>;
    private executeRequest;
    private sleep;
}
//# sourceMappingURL=fetch-agent.d.ts.map