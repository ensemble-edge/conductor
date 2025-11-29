/**
 * Anthropic Provider
 *
 * Handles Anthropic API calls with proper message formatting.
 */
import { BaseAIProvider } from './base-provider.js';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider.js';
import type { ProviderId } from '../../types/branded.js';
import type { ConductorEnv } from '../../types/env.js';
export declare class AnthropicProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "Anthropic";
    private readonly defaultEndpoint;
    private readonly defaultModel;
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null;
}
//# sourceMappingURL=anthropic-provider.d.ts.map