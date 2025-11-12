/**
 * Cloudflare Platform Adapter - Refactored with Strong Types
 *
 * Provides Cloudflare Workers-specific platform functionality
 * with proper type safety and explicit error handling.
 */

import { BasePlatform } from '../base/platform.js'
import type {
  ModelValidationResult,
  PlatformModelsData,
  PlatformCapabilities,
} from '../../types/platform-data.js'
import type { ModelId, ProviderId } from '../../types/branded.js'

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
  name = 'cloudflare'
  version = '2.0.0'

  constructor(modelsData: PlatformModelsData, capabilitiesData: PlatformCapabilities) {
    super(modelsData, capabilitiesData)
  }

  /**
   * Validate a model specifically for Cloudflare context
   * Adds platform-specific warnings and recommendations
   */
  validateModel(modelId: ModelId, provider?: ProviderId): ModelValidationResult {
    // Use base validation logic
    const result = super.validateModel(modelId, provider)

    // Add Cloudflare-specific context to warnings
    if (result.model) {
      const modelProvider = this.getProviderForModel(modelId)

      if (modelProvider === 'workers-ai') {
        // Workers AI models require AI binding
        if (!result.warnings.some((w) => w.includes('binding'))) {
          result.warnings.push(
            'Workers AI models require AI binding in wrangler.toml: ' +
              'Add [ai] binding = "AI" to your configuration'
          )
        }
      } else if (this.isExternalProvider(modelProvider)) {
        // External models can use AI Gateway or direct API
        if (!result.warnings.some((w) => w.includes('API key') || w.includes('Gateway'))) {
          result.warnings.push(
            `${modelProvider} models can use Cloudflare AI Gateway (recommended) or direct API. ` +
              `AI Gateway provides caching, analytics, and rate limiting.`
          )
        }
      }
    }

    return result
  }

  /**
   * Check if provider is external (not Workers AI)
   */
  private isExternalProvider(provider: ProviderId | null): boolean {
    if (!provider) return false

    const externalProviders: ProviderId[] = [
      'openai' as ProviderId,
      'anthropic' as ProviderId,
      'groq' as ProviderId,
    ]

    return externalProviders.includes(provider)
  }

  /**
   * Get Cloudflare-specific recommendations for a model
   */
  getModelRecommendations(modelId: ModelId): string[] {
    const recommendations: string[] = []
    const model = this.findModel(modelId)

    if (!model) {
      return recommendations
    }

    const provider = this.getProviderForModel(modelId)

    // Workers AI recommendations
    if (provider === 'workers-ai') {
      recommendations.push(
        'Workers AI models run on Cloudflare edge network for low-latency inference'
      )

      if (model.pricing.type === 'free') {
        recommendations.push('This model is free to use within Cloudflare Workers')
      }
    }

    // External provider recommendations
    if (this.isExternalProvider(provider)) {
      recommendations.push('Use Cloudflare AI Gateway for caching, analytics, and cost controls')

      recommendations.push(`Configure routing in agent.yaml: routing: "cloudflare-gateway"`)
    }

    // Context window recommendations
    if (model.contextWindow >= 128000) {
      recommendations.push('Large context window - suitable for processing extensive documents')
    }

    // Capability-based recommendations
    if (model.capabilities.includes('multilingual')) {
      recommendations.push('Supports multiple languages for international applications')
    }

    if (model.capabilities.includes('function-calling')) {
      recommendations.push('Supports function calling for tool use and structured outputs')
    }

    return recommendations
  }

  /**
   * Get binding requirements for a model
   */
  getBindingRequirements(modelId: ModelId): string[] {
    const requirements: string[] = []
    const provider = this.getProviderForModel(modelId)

    if (!provider) {
      return requirements
    }

    if (provider === 'workers-ai') {
      requirements.push('AI binding required: [ai] binding = "AI"')
    }

    if (this.isExternalProvider(provider)) {
      requirements.push(`API key required: ${provider.toUpperCase()}_API_KEY environment variable`)
    }

    return requirements
  }

  /**
   * Check if AI Gateway is configured
   */
  hasAIGateway(): boolean {
    const capabilities = this.getCapabilities()
    return capabilities.features.aiGateway?.supported === true
  }

  /**
   * Get supported AI Gateway providers
   */
  getAIGatewayProviders(): ProviderId[] {
    const capabilities = this.getCapabilities()
    return (capabilities.features.aiGateway?.providers || []) as ProviderId[]
  }
}

/**
 * Create a Cloudflare platform instance with data
 */
export function createCloudfarePlatform(
  modelsData: PlatformModelsData,
  capabilitiesData: PlatformCapabilities
): CloudflarePlatform {
  return new CloudflarePlatform(modelsData, capabilitiesData)
}
