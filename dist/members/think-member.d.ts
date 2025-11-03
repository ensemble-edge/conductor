/**
 * Think Member - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic
 */
import { BaseMember, type MemberExecutionContext } from './base-member';
import type { MemberConfig } from '../runtime/parser';
import { type ProviderRegistry } from './think-providers';
import type { AIProviderResponse } from './think-providers';
import { AIProvider } from '../types/constants';
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
 * Think Member - Executes AI reasoning via provider system
 */
export declare class ThinkMember extends BaseMember {
    private thinkConfig;
    private providerRegistry;
    constructor(config: MemberConfig, providerRegistry?: ProviderRegistry);
    /**
     * Execute AI reasoning via provider system
     */
    protected run(context: MemberExecutionContext): Promise<AIProviderResponse>;
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
//# sourceMappingURL=think-member.d.ts.map