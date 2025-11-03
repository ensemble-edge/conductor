/**
 * Cloudflare Platform Adapter - Refactored with Strong Types
 *
 * Provides Cloudflare Workers-specific platform functionality
 * with proper type safety and explicit error handling.
 */
import { BasePlatform } from '../base/platform';
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
export declare class CloudflarePlatform extends BasePlatform {
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
export declare function createCloudfarePlatform(modelsData: PlatformModelsData, capabilitiesData: PlatformCapabilities): CloudflarePlatform;
//# sourceMappingURL=index.d.ts.map