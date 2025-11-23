/**
 * Cloudflare Provider
 *
 * Handles Cloudflare Workers AI binding calls.
 */
import { BaseAIProvider } from './base-provider.js';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider.js';
import type { ProviderId } from '../../types/branded.js';
export declare class CloudflareProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "Cloudflare Workers AI";
    private readonly defaultModel;
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(config: AIProviderConfig, env: Env): string | null;
}
//# sourceMappingURL=cloudflare-provider.d.ts.map