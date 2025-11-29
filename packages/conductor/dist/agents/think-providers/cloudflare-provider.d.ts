/**
 * Cloudflare Provider
 *
 * Handles Cloudflare Workers AI binding calls.
 */
import { BaseAIProvider } from './base-provider.js';
import type { AIProviderConfig, AIProviderRequest, AIProviderResponse } from './base-provider.js';
import type { ProviderId } from '../../types/branded.js';
import type { ConductorEnv } from '../../types/env.js';
export declare class CloudflareProvider extends BaseAIProvider {
    readonly id: ProviderId;
    readonly name = "Cloudflare Workers AI";
    private readonly defaultModel;
    execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    getConfigError(_config: AIProviderConfig, env: ConductorEnv): string | null;
}
//# sourceMappingURL=cloudflare-provider.d.ts.map