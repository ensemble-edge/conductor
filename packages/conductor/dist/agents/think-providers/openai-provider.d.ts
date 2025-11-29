/**
 * OpenAI Provider
 *
 * Handles OpenAI API calls with proper error handling and validation.
 */
import { BaseAIProvider } from './base-provider.js';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider.js';
import type { ProviderId } from '../../types/branded.js';
import type { ConductorEnv } from '../../types/env.js';
export declare class OpenAIProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "OpenAI";
    private readonly defaultEndpoint;
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null;
}
//# sourceMappingURL=openai-provider.d.ts.map