/**
 * Anthropic Provider
 *
 * Handles Anthropic API calls with proper message formatting.
 */
import { BaseAIProvider } from './base-provider';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider';
import type { ProviderId } from '../../types/branded';
export declare class AnthropicProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "Anthropic";
    private readonly defaultEndpoint;
    private readonly defaultModel;
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(config: AIProviderConfig, env: Env): string | null;
}
//# sourceMappingURL=anthropic-provider.d.ts.map