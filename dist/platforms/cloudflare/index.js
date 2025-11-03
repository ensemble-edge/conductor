/**
 * Cloudflare Platform Adapter - Refactored with Strong Types
 *
 * Provides Cloudflare Workers-specific platform functionality
 * with proper type safety and explicit error handling.
 */
import { BasePlatform } from '../base/platform';
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
export class CloudflarePlatform extends BasePlatform {
    constructor(modelsData, capabilitiesData) {
        super(modelsData, capabilitiesData);
        this.name = 'cloudflare';
        this.version = '2.0.0';
    }
    /**
     * Validate a model specifically for Cloudflare context
     * Adds platform-specific warnings and recommendations
     */
    validateModel(modelId, provider) {
        // Use base validation logic
        const result = super.validateModel(modelId, provider);
        // Add Cloudflare-specific context to warnings
        if (result.model) {
            const modelProvider = this.getProviderForModel(modelId);
            if (modelProvider === 'workers-ai') {
                // Workers AI models require AI binding
                if (!result.warnings.some((w) => w.includes('binding'))) {
                    result.warnings.push('Workers AI models require AI binding in wrangler.toml: ' +
                        'Add [ai] binding = "AI" to your configuration');
                }
            }
            else if (this.isExternalProvider(modelProvider)) {
                // External models can use AI Gateway or direct API
                if (!result.warnings.some((w) => w.includes('API key') || w.includes('Gateway'))) {
                    result.warnings.push(`${modelProvider} models can use Cloudflare AI Gateway (recommended) or direct API. ` +
                        `AI Gateway provides caching, analytics, and rate limiting.`);
                }
            }
        }
        return result;
    }
    /**
     * Check if provider is external (not Workers AI)
     */
    isExternalProvider(provider) {
        if (!provider)
            return false;
        const externalProviders = [
            'openai',
            'anthropic',
            'groq',
        ];
        return externalProviders.includes(provider);
    }
    /**
     * Get Cloudflare-specific recommendations for a model
     */
    getModelRecommendations(modelId) {
        const recommendations = [];
        const model = this.findModel(modelId);
        if (!model) {
            return recommendations;
        }
        const provider = this.getProviderForModel(modelId);
        // Workers AI recommendations
        if (provider === 'workers-ai') {
            recommendations.push('Workers AI models run on Cloudflare edge network for low-latency inference');
            if (model.pricing.type === 'free') {
                recommendations.push('This model is free to use within Cloudflare Workers');
            }
        }
        // External provider recommendations
        if (this.isExternalProvider(provider)) {
            recommendations.push('Use Cloudflare AI Gateway for caching, analytics, and cost controls');
            recommendations.push(`Configure routing in member.yaml: routing: "cloudflare-gateway"`);
        }
        // Context window recommendations
        if (model.contextWindow >= 128000) {
            recommendations.push('Large context window - suitable for processing extensive documents');
        }
        // Capability-based recommendations
        if (model.capabilities.includes('multilingual')) {
            recommendations.push('Supports multiple languages for international applications');
        }
        if (model.capabilities.includes('function-calling')) {
            recommendations.push('Supports function calling for tool use and structured outputs');
        }
        return recommendations;
    }
    /**
     * Get binding requirements for a model
     */
    getBindingRequirements(modelId) {
        const requirements = [];
        const provider = this.getProviderForModel(modelId);
        if (!provider) {
            return requirements;
        }
        if (provider === 'workers-ai') {
            requirements.push('AI binding required: [ai] binding = "AI"');
        }
        if (this.isExternalProvider(provider)) {
            requirements.push(`API key required: ${provider.toUpperCase()}_API_KEY environment variable`);
        }
        return requirements;
    }
    /**
     * Check if AI Gateway is configured
     */
    hasAIGateway() {
        const capabilities = this.getCapabilities();
        return capabilities.features.aiGateway?.supported === true;
    }
    /**
     * Get supported AI Gateway providers
     */
    getAIGatewayProviders() {
        const capabilities = this.getCapabilities();
        return (capabilities.features.aiGateway?.providers || []);
    }
}
/**
 * Create a Cloudflare platform instance with data
 */
export function createCloudfarePlatform(modelsData, capabilitiesData) {
    return new CloudflarePlatform(modelsData, capabilitiesData);
}
