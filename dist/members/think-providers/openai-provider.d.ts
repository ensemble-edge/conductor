/**
 * OpenAI Provider
 *
 * Handles OpenAI API calls with proper error handling and validation.
 */
import { BaseAIProvider } from './base-provider';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider';
import type { ProviderId } from '../../types/branded';
export declare class OpenAIProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "OpenAI";
    private readonly defaultEndpoint;
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(config: AIProviderConfig, env: Env): string | null;
}
//# sourceMappingURL=openai-provider.d.ts.map