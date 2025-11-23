/**
 * Think Agent - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Auto-detection: Provider is automatically detected from model name:
 * - Models starting with @cf/ → Cloudflare Workers AI
 * - Models starting with gpt- or o1- → OpenAI
 * - Models starting with claude- → Anthropic
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic (when model doesn't match auto-detection patterns)
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
    schema?: string | Record<string, unknown>;
    templateEngine?: 'simple' | 'liquid';
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
    private templateEngine;
    constructor(config: AgentConfig, providerRegistry?: ProviderRegistry);
    /**
     * Auto-detect AI provider from model name
     */
    private detectProvider;
    /**
     * Execute AI reasoning via provider system
     */
    protected run(context: AgentExecutionContext): Promise<AIProviderResponse>;
    /**
     * Resolve prompt from Edgit if needed
     */
    private resolvePrompt;
    /**
     * Resolve schema from Edgit if needed
     */
    private resolveSchema;
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