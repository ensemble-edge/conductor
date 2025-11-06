/**
 * Custom Provider
 *
 * Handles custom API endpoints with OpenAI-compatible format.
 */
import { BaseAIProvider } from './base-provider.js';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider.js';
import type { ProviderId } from '../../types/branded.js';
export declare class CustomProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "Custom API";
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(config: AIProviderConfig, env: Env): string | null;
}
//# sourceMappingURL=custom-provider.d.ts.map