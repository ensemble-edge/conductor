/**
 * Think Member Engine
 *
 * Handles AI reasoning and LLM calls via Cloudflare AI Gateway
 * Supports multiple model providers (OpenAI, Anthropic, etc.)
 */

import { BaseMember, type MemberExecutionContext } from './base-member';
import type { MemberConfig } from '../runtime/parser';

export interface ThinkConfig {
	model?: string;
	provider?: 'openai' | 'anthropic' | 'cloudflare' | 'custom';
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
 * Think Member executes AI reasoning tasks using LLMs
 *
 * @example User's member definition with inline prompt:
 * ```yaml
 * # members/analyze-company/member.yaml
 * name: analyze-company
 * type: Think
 * description: Analyze company data using AI
 * config:
 *   model: gpt-4
 *   provider: openai
 *   temperature: 0.7
 *   maxTokens: 2000
 *   systemPrompt: You are a business analyst...
 * schema:
 *   input:
 *     companyData: object
 *   output:
 *     analysis: string
 *     confidence: number
 * ```
 *
 * @example User's member definition with versioned prompt from Edgit:
 * ```yaml
 * # members/analyze-company/member.yaml
 * name: analyze-company
 * type: Think
 * description: Analyze company data using AI
 * config:
 *   model: gpt-4
 *   provider: openai
 *   temperature: 0.7
 *   maxTokens: 2000
 *   prompt: company-analysis-prompt@v2.1.0  # Loads from Edgit
 * schema:
 *   input:
 *     companyData: object
 *   output:
 *     analysis: string
 *     confidence: number
 * ```
 */
export class ThinkMember extends BaseMember {
	private thinkConfig: ThinkConfig;

	constructor(config: MemberConfig) {
		super(config);

		this.thinkConfig = {
			model: config.config?.model || 'gpt-3.5-turbo',
			provider: config.config?.provider || 'openai',
			temperature: config.config?.temperature || 0.7,
			maxTokens: config.config?.maxTokens || 1000,
			apiKey: config.config?.apiKey,
			apiEndpoint: config.config?.apiEndpoint,
			systemPrompt: config.config?.systemPrompt,
			prompt: config.config?.prompt // Versioned prompt reference
		};
	}

	/**
	 * Execute AI reasoning
	 */
	protected async run(context: MemberExecutionContext): Promise<any> {
		const { input, env } = context;

		// Load versioned prompt if configured
		await this.resolvePrompt(env);

		// Determine which provider to use
		switch (this.thinkConfig.provider) {
			case 'cloudflare':
				return await this.executeCloudflareAI(input, env);

			case 'openai':
				return await this.executeOpenAI(input, env);

			case 'anthropic':
				return await this.executeAnthropic(input, env);

			case 'custom':
				return await this.executeCustomProvider(input, env);

			default:
				throw new Error(`Unknown AI provider: ${this.thinkConfig.provider}`);
		}
	}

	/**
	 * Resolve prompt from Edgit if needed
	 * Loads versioned prompts at runtime for flexibility
	 */
	private async resolvePrompt(env: Env): Promise<void> {
		// If systemPrompt is already set, use it (inline config)
		if (this.thinkConfig.systemPrompt) {
			return;
		}

		// If prompt reference is set, load from Edgit
		if (this.thinkConfig.prompt) {
			// TODO: Load from Edgit when available
			// Expected implementation:
			// import { loadComponent } from '../sdk/edgit';
			// this.thinkConfig.systemPrompt = await loadComponent(this.thinkConfig.prompt, env);

			throw new Error(
				`Cannot load versioned prompt "${this.thinkConfig.prompt}". ` +
				`Edgit integration not yet available. ` +
				`Use inline systemPrompt in config for now.`
			);
		}

		// No prompt configured - will use input.prompt or auto-generate from input
	}

	/**
	 * Execute using Cloudflare Workers AI
	 */
	private async executeCloudflareAI(input: ThinkInput, env: Env): Promise<any> {
		if (!env.AI) {
			throw new Error('Cloudflare AI binding not available. Add "ai" binding to wrangler.toml');
		}

		// Build messages
		const messages = this.buildMessages(input);

		// Call Cloudflare AI
		const response = await env.AI.run(this.thinkConfig.model as any || '@cf/meta/llama-2-7b-chat-int8', {
			messages,
			temperature: this.thinkConfig.temperature,
			max_tokens: this.thinkConfig.maxTokens
		}) as any;

		return {
			content: response.response || response.result?.response || String(response),
			model: this.thinkConfig.model,
			tokensUsed: response.tokens_used,
			provider: 'cloudflare'
		};
	}

	/**
	 * Execute using OpenAI API
	 */
	private async executeOpenAI(input: ThinkInput, env: Env): Promise<any> {
		const apiKey = this.thinkConfig.apiKey || (env as any).OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error('OpenAI API key not found. Set OPENAI_API_KEY in env or config');
		}

		const endpoint = this.thinkConfig.apiEndpoint || 'https://api.openai.com/v1/chat/completions';

		// Build messages
		const messages = this.buildMessages(input);

		// Make API call
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: this.thinkConfig.model,
				messages,
				temperature: this.thinkConfig.temperature,
				max_tokens: this.thinkConfig.maxTokens
			})
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json() as any;

		return {
			content: data.choices[0]?.message?.content || '',
			model: this.thinkConfig.model,
			tokensUsed: data.usage?.total_tokens,
			provider: 'openai'
		};
	}

	/**
	 * Execute using Anthropic API
	 */
	private async executeAnthropic(input: ThinkInput, env: Env): Promise<any> {
		const apiKey = this.thinkConfig.apiKey || (env as any).ANTHROPIC_API_KEY;
		if (!apiKey) {
			throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY in env or config');
		}

		const endpoint = this.thinkConfig.apiEndpoint || 'https://api.anthropic.com/v1/messages';

		// Build messages (Anthropic format is slightly different)
		const messages = this.buildMessages(input).filter(m => m.role !== 'system');
		const system = this.thinkConfig.systemPrompt;

		// Make API call
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: this.thinkConfig.model || 'claude-3-sonnet-20240229',
				messages,
				system,
				temperature: this.thinkConfig.temperature,
				max_tokens: this.thinkConfig.maxTokens
			})
		});

		if (!response.ok) {
			throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json() as any;

		return {
			content: data.content[0]?.text || '',
			model: this.thinkConfig.model,
			tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
			provider: 'anthropic'
		};
	}

	/**
	 * Execute using custom API endpoint
	 */
	private async executeCustomProvider(input: ThinkInput, env: Env): Promise<any> {
		const endpoint = this.thinkConfig.apiEndpoint;
		if (!endpoint) {
			throw new Error('Custom provider requires apiEndpoint in config');
		}

		const apiKey = this.thinkConfig.apiKey || (env as any).AI_API_KEY;

		// Build messages
		const messages = this.buildMessages(input);

		// Make API call with standard OpenAI-compatible format
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
			},
			body: JSON.stringify({
				model: this.thinkConfig.model,
				messages,
				temperature: this.thinkConfig.temperature,
				max_tokens: this.thinkConfig.maxTokens
			})
		});

		if (!response.ok) {
			throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json() as any;

		return {
			content: data.choices?.[0]?.message?.content || data.response || data.content || '',
			model: this.thinkConfig.model,
			tokensUsed: data.usage?.total_tokens,
			provider: 'custom'
		};
	}

	/**
	 * Build messages array from input
	 */
	private buildMessages(input: ThinkInput): Array<{ role: string; content: string }> {
		const messages: Array<{ role: string; content: string }> = [];

		// Add system prompt if configured
		if (this.thinkConfig.systemPrompt) {
			messages.push({
				role: 'system',
				content: this.thinkConfig.systemPrompt
			});
		}

		// If input has messages array, use it
		if (input.messages && Array.isArray(input.messages)) {
			messages.push(...input.messages);
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
			// Convert input object to a structured prompt
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
