/**
 * Cloudflare Platform Adapter V2 - Refactored with Strong Types
 *
 * Provides Cloudflare Workers-specific platform functionality
 * with proper type safety and explicit error handling.
 */
import { BasePlatformV2 } from '../base/platform-v2';
import type { ModelValidationResult, PlatformModelsData, PlatformCapabilities } from '../../types/platform-data';
import type { ModelId, ProviderId } from '../../types/branded';
/**
 * Cloudflare Platform Adapter
 *
 * Validates models against Cloudflare platform data including:
 * - Workers AI models (platform-native, edge-hosted)
 * - OpenAI models (via AI Gateway or direct)
 * - Anthropic models (via AI Gateway or direct)
 * - Groq models (via AI Gateway or direct)
 *
 * Supports three routing modes:
 * - cloudflare: Platform-native Workers AI
 * - cloudflare-gateway: External providers via AI Gateway
 * - direct: Direct API calls to external providers
 */
export declare class CloudflarePlatformV2 extends BasePlatformV2 {
    name: string;
    version: string;
    constructor(modelsData: PlatformModelsData, capabilitiesData: PlatformCapabilities);
    /**
     * Validate a model specifically for Cloudflare context
     * Adds platform-specific warnings and recommendations
     */
    validateModel(modelId: ModelId, provider?: ProviderId): ModelValidationResult;
    /**
     * Check if provider is external (not Workers AI)
     */
    private isExternalProvider;
    /**
     * Get Cloudflare-specific recommendations for a model
     */
    getModelRecommendations(modelId: ModelId): string[];
    /**
     * Get binding requirements for a model
     */
    getBindingRequirements(modelId: ModelId): string[];
    /**
     * Check if AI Gateway is configured
     */
    hasAIGateway(): boolean;
    /**
     * Get supported AI Gateway providers
     */
    getAIGatewayProviders(): ProviderId[];
}
/**
 * Create a Cloudflare platform instance with data
 */
export declare function createCloudfarePlatformV2(modelsData: PlatformModelsData, capabilitiesData: PlatformCapabilities): CloudflarePlatformV2;
export { CloudflarePlatformV2 as CloudflarePlatform };
export { createCloudfarePlatformV2 as createCloudfarePlatform };
//# sourceMappingURL=index-v2.d.ts.map