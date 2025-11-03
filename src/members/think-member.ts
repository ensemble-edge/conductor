/**
 * Think Member - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic
 */

import { BaseMember, type MemberExecutionContext } from './base-member';
import type { MemberConfig } from '../runtime/parser';
import { getProviderRegistry } from './think-providers';
import type { AIMessage, AIProviderConfig } from './think-providers';
import { AIProvider } from '../types/constants';
import type { ConductorEnv } from '../types/env';

export interface ThinkConfig {
	model?: string;
	provider?: AIProvider;
	temperature?: number;
	maxTokens?: number;
	apiKey?: string;
	apiEndpoint?: string;
	systemPrompt?: string;
	prompt?: string; // Reference to versioned prompt (e.g., "company-analysis-prompt@v1.0.0")
}

export interface ThinkInput {
	prompt?: string;
	messages?: Array<{ role: string; content: string }>;
	[key: string]: any;
}

/**
 * Think Member - Executes AI reasoning via provider system
 */
export class ThinkMember extends BaseMember {
	private thinkConfig: ThinkConfig;
	private providerRegistry = getProviderRegistry();

	constructor(config: MemberConfig) {
		super(config);

		this.thinkConfig = {
			model: config.config?.model || 'claude-3-5-haiku-20241022',
			provider: config.config?.provider || AIProvider.Anthropic,
			temperature: config.config?.temperature || 0.7,
			maxTokens: config.config?.maxTokens || 1000,
			apiKey: config.config?.apiKey,
			apiEndpoint: config.config?.apiEndpoint,
			systemPrompt: config.config?.systemPrompt,
			prompt: config.config?.prompt
		};
	}

	/**
	 * Execute AI reasoning via provider system
	 */
	protected async run(context: MemberExecutionContext): Promise<any> {
		const { input, env } = context;

		// Load versioned prompt if configured
		await this.resolvePrompt(env);

		// Get provider from registry
		const providerId = this.thinkConfig.provider || AIProvider.Anthropic;
		const provider = this.providerRegistry.get(providerId);

		if (!provider) {
			throw new Error(
				`Unknown AI provider: ${providerId}. ` +
				`Available providers: ${this.providerRegistry.getProviderIds().join(', ')}`
			);
		}

		// Build provider config
		const providerConfig: AIProviderConfig = {
			model: this.thinkConfig.model || 'claude-3-5-haiku-20241022',
			temperature: this.thinkConfig.temperature,
			maxTokens: this.thinkConfig.maxTokens,
			apiKey: this.thinkConfig.apiKey,
			apiEndpoint: this.thinkConfig.apiEndpoint,
			systemPrompt: this.thinkConfig.systemPrompt
		};

		// Validate configuration
		const configError = provider.getConfigError(providerConfig, env);
		if (configError) {
			throw new Error(configError);
		}

		// Build messages from input
		const messages = this.buildMessages(input);

		// Execute via provider
		return await provider.execute({
			messages,
			config: providerConfig,
			env
		});
	}

	/**
	 * Resolve prompt from Edgit if needed
	 */
	private async resolvePrompt(env: ConductorEnv): Promise<void> {
		if (this.thinkConfig.systemPrompt) return;

		if (this.thinkConfig.prompt) {
			throw new Error(
				`Cannot load versioned prompt "${this.thinkConfig.prompt}". ` +
				`Edgit integration not yet available. ` +
				`Use inline systemPrompt in config for now.`
			);
		}
	}

	/**
	 * Build messages array from input
	 */
	private buildMessages(input: ThinkInput): AIMessage[] {
		const messages: AIMessage[] = [];

		// Add system prompt if configured
		if (this.thinkConfig.systemPrompt) {
			messages.push({
				role: 'system',
				content: this.thinkConfig.systemPrompt
			});
		}

		// If input has messages array, use it
		if (input.messages && Array.isArray(input.messages)) {
			messages.push(...(input.messages as AIMessage[]));
		}
		// Otherwise, build from prompt
		else if (input.prompt) {
			messages.push({
				role: 'user',
				content: input.prompt
			});
		}
		// Build prompt from input data
		else {
			const promptParts: string[] = [];
			for (const [key, value] of Object.entries(input)) {
				if (typeof value === 'string') {
					promptParts.push(`${key}: ${value}`);
				} else {
					promptParts.push(`${key}: ${JSON.stringify(value, null, 2)}`);
				}
			}

			messages.push({
				role: 'user',
				content: promptParts.join('\n\n')
			});
		}

		return messages;
	}

	/**
	 * Get Think configuration
	 */
	getThinkConfig(): ThinkConfig {
		return { ...this.thinkConfig };
	}
}
