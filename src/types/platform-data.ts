/**
 * Platform Data Types
 *
 * Strongly-typed definitions for platform data structures.
 * Replaces all `any` types in platform adapters with proper types.
 */

import type { ModelId, ProviderId, PlatformName } from './branded';

/**
 * Model status
 */
export type ModelStatus = 'active' | 'deprecated';

/**
 * Model pricing type
 */
export type PricingType = 'free' | 'metered';

/**
 * Routing mode for accessing models
 */
export type RoutingMode = 'direct' | 'cloudflare-gateway' | 'cloudflare';

/**
 * Authentication type for providers
 */
export type AuthenticationType = 'api-key' | 'binding' | 'oauth';

/**
 * Model pricing information
 */
export interface ModelPricing {
	type: PricingType;
	inputCost?: number;  // Cost per token (input)
	outputCost?: number; // Cost per token (output)
	currency?: string;   // Default: 'USD'
}

/**
 * AI Model definition
 */
export interface ProviderModel {
	/** Unique model identifier */
	id: ModelId;

	/** Human-readable model name */
	name: string;

	/** Model family (e.g., 'llama', 'gpt', 'claude') */
	family: string;

	/** Model status */
	status: ModelStatus;

	/** Date the model was introduced */
	introducedAt: string;

	/** Model capabilities */
	capabilities: string[];

	/** Context window size (tokens) */
	contextWindow: number;

	/** Pricing information */
	pricing: ModelPricing;

	/** Whether this model is recommended for general use */
	recommended?: boolean;

	/** Deprecated information (only if status is 'deprecated') */
	deprecatedAt?: string;
	deprecatedReason?: string;
	replacementModel?: ModelId;
	endOfLife?: string;
}

/**
 * Authentication configuration
 */
export interface ProviderAuthentication {
	type: AuthenticationType;
	envVar?: string;     // Environment variable name for API key
	binding?: string;    // Cloudflare binding name
	required?: boolean;  // Whether authentication is required
}

/**
 * Provider endpoint configuration
 */
export interface ProviderEndpoint {
	baseUrl: string;
	features?: string[];
}

/**
 * AI Provider definition
 */
export interface Provider {
	/** Provider identifier */
	provider: ProviderId;

	/** Human-readable provider name */
	name: string;

	/** Provider description */
	description: string;

	/** Documentation URL */
	documentation?: string;

	/** Default routing mode */
	defaultRouting?: RoutingMode;

	/** Authentication configuration */
	authentication?: ProviderAuthentication;

	/** Available endpoints */
	endpoints?: Record<RoutingMode, ProviderEndpoint>;

	/** Available models */
	models: ProviderModel[];
}

/**
 * Platform models data
 */
export interface PlatformModelsData {
	/** Data version */
	version: string;

	/** Last updated timestamp */
	lastUpdated: string;

	/** Available providers */
	providers: Record<string, Provider>;
}

/**
 * AI Gateway configuration
 */
export interface AIGatewayConfig {
	supported: boolean;
	providers: ProviderId[];
	features: string[];
}

/**
 * Edge compute configuration
 */
export interface EdgeComputeConfig {
	supported: boolean;
	runtime: string;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
	kv?: boolean;
	d1?: boolean;
	r2?: boolean;
}

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
	/** Platform name */
	name: PlatformName;

	/** Capabilities version */
	version: string;

	/** Available features */
	features: {
		aiGateway?: AIGatewayConfig;
		edgeCompute?: EdgeComputeConfig;
		storage?: StorageConfig;
	};
}

/**
 * Model validation result
 */
export interface ModelValidationResult {
	/** Whether the model is valid */
	valid: boolean;

	/** The validated model (if found) */
	model?: ProviderModel;

	/** Whether the model is deprecated */
	isDeprecated: boolean;

	/** Replacement model (if deprecated) */
	replacement?: ModelId;

	/** Days until end of life (if applicable) */
	daysUntilEOL?: number;

	/** Validation errors */
	errors: string[];

	/** Validation warnings */
	warnings: string[];
}

/**
 * Generic validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Member reference parsed components
 */
export interface MemberReference {
	name: string;
	version?: string;
}

/**
 * Model search options
 */
export interface ModelSearchOptions {
	provider?: ProviderId;
	filter?: 'active' | 'deprecated' | 'recommended';
	minContextWindow?: number;
	capabilities?: string[];
}

/**
 * Model with provider information
 */
export interface ModelWithProvider extends ProviderModel {
	provider: ProviderId;
}

/**
 * Data version information
 */
export interface DataVersion {
	version: string;
	lastUpdated: string;
}

/**
 * Type guards
 */
export const ModelValidation = {
	/**
	 * Check if a model is deprecated
	 */
	isDeprecated(model: ProviderModel): boolean {
		return model.status === 'deprecated';
	},

	/**
	 * Check if a model is active
	 */
	isActive(model: ProviderModel): boolean {
		return model.status === 'active';
	},

	/**
	 * Check if a model is recommended
	 */
	isRecommended(model: ProviderModel): boolean {
		return model.recommended === true;
	},

	/**
	 * Check if a model is past end of life
	 */
	isPastEOL(model: ProviderModel): boolean {
		if (!model.endOfLife) return false;
		return new Date(model.endOfLife) < new Date();
	},

	/**
	 * Get days until end of life
	 */
	getDaysUntilEOL(model: ProviderModel): number | null {
		if (!model.endOfLife) return null;

		const eolDate = new Date(model.endOfLife);
		const now = new Date();
		const diffMs = eolDate.getTime() - now.getTime();
		return Math.floor(diffMs / (1000 * 60 * 60 * 24));
	},

	/**
	 * Check if a model meets minimum context window requirement
	 */
	meetsContextWindow(model: ProviderModel, minTokens: number): boolean {
		return model.contextWindow >= minTokens;
	},

	/**
	 * Check if a model has specific capability
	 */
	hasCapability(model: ProviderModel, capability: string): boolean {
		return model.capabilities.includes(capability);
	},

	/**
	 * Check if a model has all specified capabilities
	 */
	hasAllCapabilities(model: ProviderModel, capabilities: string[]): boolean {
		return capabilities.every(cap => model.capabilities.includes(cap));
	}
};
