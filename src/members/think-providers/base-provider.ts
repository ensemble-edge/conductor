/**
 * AI Provider System
 *
 * Base interfaces and types for AI provider implementations.
 * Follows composition over inheritance for flexible provider management.
 */

import type { ProviderId } from '../../types/branded';

/**
 * Message format for AI conversations
 */
export interface AIMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

/**
 * Configuration for AI provider execution
 */
export interface AIProviderConfig {
	model: string;
	temperature?: number;
	maxTokens?: number;
	apiKey?: string;
	apiEndpoint?: string;
	systemPrompt?: string;
}

/**
 * Request to AI provider
 */
export interface AIProviderRequest {
	messages: AIMessage[];
	config: AIProviderConfig;
	env: Env;
}

/**
 * Response from AI provider
 */
export interface AIProviderResponse {
	content: string;
	model: string;
	tokensUsed?: number;
	provider: string;
	metadata?: Record<string, unknown>;
}

/**
 * AI Provider interface - contract for all provider implementations
 */
export interface AIProvider {
	/**
	 * Provider identifier
	 */
	readonly id: ProviderId;

	/**
	 * Provider display name
	 */
	readonly name: string;

	/**
	 * Execute AI request
	 */
	execute(request: AIProviderRequest): Promise<AIProviderResponse>;

	/**
	 * Validate provider configuration
	 */
	validateConfig(config: AIProviderConfig, env: Env): boolean;

	/**
	 * Get error message for missing configuration
	 */
	getConfigError(config: AIProviderConfig, env: Env): string | null;
}

/**
 * Base AI provider with common functionality
 */
export abstract class BaseAIProvider implements AIProvider {
	abstract readonly id: ProviderId;
	abstract readonly name: string;

	abstract execute(request: AIProviderRequest): Promise<AIProviderResponse>;

	/**
	 * Default validation checks for API key
	 */
	validateConfig(config: AIProviderConfig, env: Env): boolean {
		return this.getConfigError(config, env) === null;
	}

	/**
	 * Override this to provide specific validation
	 */
	abstract getConfigError(config: AIProviderConfig, env: Env): string | null;

	/**
	 * Helper to get API key from config or env
	 */
	protected getApiKey(config: AIProviderConfig, env: Env, envVarName: string): string | null {
		return config.apiKey || (env as unknown as Record<string, unknown>)[envVarName] as string | undefined || null;
	}

	/**
	 * Helper to make HTTP request
	 */
	protected async makeRequest(
		endpoint: string,
		headers: Record<string, string>,
		body: unknown
	): Promise<unknown> {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`API request failed: ${response.status} ${response.statusText}\n${errorText}`
			);
		}

		return await response.json();
	}
}
