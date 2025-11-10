/**
 * Think Member - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic
 */
import { BaseMember } from './base-member.js';
import { getProviderRegistry } from './think-providers/index.js';
import { AIProvider } from '../types/constants.js';
/**
 * Think Member - Executes AI reasoning via provider system
 */
export class ThinkMember extends BaseMember {
    constructor(config, providerRegistry) {
        super(config);
        // Use injected registry for testing, or global registry for production
        this.providerRegistry = providerRegistry || getProviderRegistry();
        const cfg = config.config;
        this.thinkConfig = {
            model: cfg?.model || 'claude-3-5-haiku-20241022',
            provider: cfg?.provider || AIProvider.Anthropic,
            temperature: cfg?.temperature || 0.7,
            maxTokens: cfg?.maxTokens || 1000,
            apiKey: cfg?.apiKey,
            apiEndpoint: cfg?.apiEndpoint,
            systemPrompt: cfg?.systemPrompt,
            prompt: cfg?.prompt,
        };
    }
    /**
     * Execute AI reasoning via provider system
     */
    async run(context) {
        const { input, env } = context;
        // Load versioned prompt if configured
        await this.resolvePrompt(env);
        // Get provider from registry
        const providerId = this.thinkConfig.provider || AIProvider.Anthropic;
        const provider = this.providerRegistry.get(providerId);
        if (!provider) {
            throw new Error(`Unknown AI provider: ${providerId}. ` +
                `Available providers: ${this.providerRegistry.getProviderIds().join(', ')}`);
        }
        // Build provider config
        const providerConfig = {
            model: this.thinkConfig.model || 'claude-3-5-haiku-20241022',
            temperature: this.thinkConfig.temperature,
            maxTokens: this.thinkConfig.maxTokens,
            apiKey: this.thinkConfig.apiKey,
            apiEndpoint: this.thinkConfig.apiEndpoint,
            systemPrompt: this.thinkConfig.systemPrompt,
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
            env: env,
        });
    }
    /**
     * Resolve prompt from Edgit if needed
     */
    async resolvePrompt(env) {
        if (this.thinkConfig.systemPrompt)
            return;
        if (this.thinkConfig.prompt) {
            throw new Error(`Cannot load versioned prompt "${this.thinkConfig.prompt}". ` +
                `Edgit integration not yet available. ` +
                `Use inline systemPrompt in config for now.`);
        }
    }
    /**
     * Build messages array from input
     */
    buildMessages(input) {
        const messages = [];
        // Add system prompt if configured
        if (this.thinkConfig.systemPrompt) {
            messages.push({
                role: 'system',
                content: this.thinkConfig.systemPrompt,
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
                content: input.prompt,
            });
        }
        // Build prompt from input data
        else {
            const promptParts = [];
            for (const [key, value] of Object.entries(input)) {
                if (typeof value === 'string') {
                    promptParts.push(`${key}: ${value}`);
                }
                else {
                    promptParts.push(`${key}: ${JSON.stringify(value, null, 2)}`);
                }
            }
            messages.push({
                role: 'user',
                content: promptParts.join('\n\n'),
            });
        }
        return messages;
    }
    /**
     * Get Think configuration
     */
    getThinkConfig() {
        return { ...this.thinkConfig };
    }
}
