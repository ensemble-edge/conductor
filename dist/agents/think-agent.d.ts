/**
 * Think Agent - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic
 */
import { BaseAgent, type AgentExecutionContext } from './base-agent.js';
import type { AgentConfig } from '../runtime/parser.js';
import { type ProviderRegistry } from './think-providers/index.js';
import type { AIProviderResponse } from './think-providers/index.js';
import { AIProvider } from '../types/constants.js';
export interface ThinkConfig {
    model?: string;
    provider?: AIProvider;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    apiEndpoint?: string;
    systemPrompt?: string;
    prompt?: string;
}
export interface ThinkInput {
    prompt?: string;
    messages?: Array<{
        role: string;
        content: string;
    }>;
    [key: string]: unknown;
}
/**
 * Think Agent - Executes AI reasoning via provider system
 */
export declare class ThinkAgent extends BaseAgent {
    private thinkConfig;
    private providerRegistry;
    constructor(config: AgentConfig, providerRegistry?: ProviderRegistry);
    /**
     * Execute AI reasoning via provider system
     */
    protected run(context: AgentExecutionContext): Promise<AIProviderResponse>;
    /**
     * Resolve prompt from Edgit if needed
     */
    private resolvePrompt;
    /**
     * Build messages array from input
     */
    private buildMessages;
    /**
     * Get Think configuration
     */
    getThinkConfig(): ThinkConfig;
}
//# sourceMappingURL=think-agent.d.ts.map