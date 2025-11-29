/**
 * Think Agent - Refactored with Provider System
 *
 * Handles AI reasoning using composition-based provider system.
 * Reduced from 355 lines to ~160 lines through proper abstraction.
 *
 * Auto-detection: Provider is automatically detected from model name:
 * - Models starting with @cf/ → Cloudflare Workers AI
 * - Models starting with gpt- or o1- → OpenAI
 * - Models starting with claude- → Anthropic
 *
 * Default model: claude-3-5-haiku-20241022 (Anthropic Haiku 3.5)
 * Default provider: anthropic (when model doesn't match auto-detection patterns)
 */
import { BaseAgent } from './base-agent.js';
import { getProviderRegistry } from './think-providers/index.js';
import { AIProvider } from '../types/constants.js';
import { resolveValue } from '../utils/component-resolver.js';
import { SimpleTemplateEngine } from '../utils/templates/engines/simple.js';
import { LiquidTemplateEngine } from '../utils/templates/engines/liquid.js';
/**
 * Think Agent - Executes AI reasoning via provider system
 */
export class ThinkAgent extends BaseAgent {
    constructor(config, providerRegistry) {
        super(config);
        // Use injected registry for testing, or global registry for production
        this.providerRegistry = providerRegistry || getProviderRegistry();
        const cfg = config.config;
        // Initialize template engine based on config (default: simple - Workers compatible)
        const engineType = cfg?.templateEngine || 'simple';
        switch (engineType) {
            case 'simple':
                this.templateEngine = new SimpleTemplateEngine();
                break;
            case 'liquid':
                this.templateEngine = new LiquidTemplateEngine();
                break;
            default:
                this.templateEngine = new SimpleTemplateEngine();
                break;
        }
        const model = cfg?.model || 'claude-3-5-haiku-20241022';
        // Auto-detect provider from model name if not explicitly set
        const provider = cfg?.provider || this.detectProvider(model);
        this.thinkConfig = {
            model,
            provider,
            temperature: cfg?.temperature || 0.7,
            maxTokens: cfg?.maxTokens || 1000,
            apiKey: cfg?.apiKey,
            apiEndpoint: cfg?.apiEndpoint,
            systemPrompt: cfg?.systemPrompt,
            prompt: cfg?.prompt,
            schema: cfg?.schema,
        };
    }
    /**
     * Auto-detect AI provider from model name
     */
    detectProvider(model) {
        // Cloudflare Workers AI models start with @cf/
        if (model.startsWith('@cf/')) {
            return AIProvider.Cloudflare;
        }
        // OpenAI models (gpt-*, o1-*, etc.)
        if (model.startsWith('gpt-') || model.startsWith('o1-') || model.startsWith('text-')) {
            return AIProvider.OpenAI;
        }
        // Anthropic models (claude-*)
        if (model.startsWith('claude-')) {
            return AIProvider.Anthropic;
        }
        // Default to Anthropic for unknown models
        return AIProvider.Anthropic;
    }
    /**
     * Execute AI reasoning via provider system
     *
     * Output Design Philosophy:
     * ─────────────────────────
     * Think agents return output that's intuitive to use in ensembles:
     *
     * 1. If schema defines output fields → AI response maps to those fields
     *    Schema: { output: { greeting: string } }
     *    Output: { greeting: "Hello!", _meta: { model, provider, tokens } }
     *    Usage:  ${agent.output.greeting}
     *
     * 2. If no schema → AI response is the direct output value
     *    Output: "Hello!"  (string, not wrapped in object)
     *    Usage:  ${agent.output}
     *
     * 3. If AI returns JSON → parsed and spread as output fields
     *    Output: { name: "John", age: 30, _meta: {...} }
     *    Usage:  ${agent.output.name}, ${agent.output.age}
     *
     * The _meta field contains provider details (model, tokens, etc.)
     * for debugging/logging, but user data is always top-level.
     */
    async run(context) {
        const { input, env } = context;
        // Load versioned prompt if configured
        await this.resolvePrompt(env);
        // Render template variables in systemPrompt (e.g., {{input.name}})
        // Uses configurable template engine (simple or liquid) - both are Cloudflare Workers compatible
        if (this.thinkConfig.systemPrompt) {
            const logger = context.logger;
            logger?.debug('Template rendering started', {
                agentName: this.getName(),
                templateLength: this.thinkConfig.systemPrompt.length,
            });
            try {
                this.thinkConfig.systemPrompt = await this.templateEngine.render(this.thinkConfig.systemPrompt, {
                    input,
                    env,
                    context,
                });
                logger?.debug('Template rendering completed', {
                    agentName: this.getName(),
                    renderedLength: this.thinkConfig.systemPrompt.length,
                });
            }
            catch (error) {
                logger?.error('Template rendering failed', error instanceof Error ? error : undefined, {
                    agentName: this.getName(),
                });
                throw new Error(`Failed to render systemPrompt template: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Load versioned schema if configured
        await this.resolveSchema(env);
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
            schema: this.thinkConfig.schema,
        };
        // Validate configuration
        const configError = provider.getConfigError(providerConfig, env);
        if (configError) {
            throw new Error(configError);
        }
        // Build messages from input
        const messages = this.buildMessages(input);
        // Execute via provider
        const response = await provider.execute({
            messages,
            config: providerConfig,
            env,
        });
        // Transform to user-friendly output structure
        return this.buildOutput(response);
    }
    /**
     * Build user-friendly output from AI provider response
     *
     * Design Goals:
     * 1. Schema-defined fields are top-level (not nested under 'content')
     * 2. Metadata is accessible but doesn't pollute user data
     * 3. Works intuitively with ${agent.output.fieldName} syntax
     */
    buildOutput(response) {
        const outputSchema = this.config.schema?.output;
        // Metadata available as _meta for debugging/logging
        const meta = {
            model: response.model,
            provider: response.provider,
            tokensUsed: response.tokensUsed,
            ...(response.metadata || {}),
        };
        // Try to parse JSON from AI response (common for structured output)
        let parsedContent = null;
        try {
            parsedContent = JSON.parse(response.content);
        }
        catch {
            // Not JSON, use raw content
        }
        // Case 1: AI returned valid JSON object → spread as top-level fields
        if (parsedContent && typeof parsedContent === 'object' && !Array.isArray(parsedContent)) {
            return {
                ...parsedContent,
                _meta: meta,
            };
        }
        // Case 2: Schema defines output fields → map content to schema field(s)
        if (outputSchema && typeof outputSchema === 'object') {
            const schemaFields = Object.keys(outputSchema);
            if (schemaFields.length === 1) {
                // Single field schema: map content directly to that field
                // Schema: { message: string } → Output: { message: "Hello!", _meta: {...} }
                const fieldName = schemaFields[0];
                return {
                    [fieldName]: parsedContent ?? response.content,
                    _meta: meta,
                };
            }
            else if (schemaFields.length > 1) {
                // Multi-field schema but AI didn't return JSON - put in first field
                // This is a fallback; ideally AI returns structured JSON
                const fieldName = schemaFields[0];
                return {
                    [fieldName]: parsedContent ?? response.content,
                    _meta: meta,
                };
            }
        }
        // Case 3: No schema, AI returned array → wrap with _meta
        if (Array.isArray(parsedContent)) {
            return {
                items: parsedContent,
                _meta: meta,
            };
        }
        // Case 4: No schema, simple string response → return content directly
        // This allows ${agent.output} to get the string value
        // But also allows ${agent.output._meta.model} for metadata
        return {
            content: response.content,
            _meta: meta,
        };
    }
    /**
     * Resolve prompt from Edgit if needed
     */
    async resolvePrompt(env) {
        // If systemPrompt already set inline, use it
        if (this.thinkConfig.systemPrompt)
            return;
        // If prompt reference configured, resolve it
        if (this.thinkConfig.prompt) {
            const context = {
                env,
                baseDir: process.cwd(),
            };
            try {
                const resolved = await resolveValue(this.thinkConfig.prompt, context);
                // Set resolved content as systemPrompt
                if (typeof resolved.content === 'string') {
                    this.thinkConfig.systemPrompt = resolved.content;
                }
                else {
                    throw new Error(`Prompt must resolve to a string, got ${typeof resolved.content}`);
                }
            }
            catch (error) {
                throw new Error(`Failed to resolve prompt "${this.thinkConfig.prompt}": ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Resolve schema from Edgit if needed
     */
    async resolveSchema(env) {
        // If schema not configured or already an object, skip resolution
        if (!this.thinkConfig.schema)
            return;
        if (typeof this.thinkConfig.schema !== 'string')
            return;
        // If schema is a reference (contains path/name@version format), resolve it
        const context = {
            env,
            baseDir: process.cwd(),
        };
        try {
            const resolved = await resolveValue(this.thinkConfig.schema, context);
            // Set resolved content as schema (must be an object)
            if (typeof resolved.content === 'object' && resolved.content !== null) {
                this.thinkConfig.schema = resolved.content;
            }
            else if (typeof resolved.content === 'string') {
                // Try parsing as JSON if string
                try {
                    this.thinkConfig.schema = JSON.parse(resolved.content);
                }
                catch {
                    throw new Error(`Schema must be valid JSON, got invalid string`);
                }
            }
            else {
                throw new Error(`Schema must resolve to an object or JSON string, got ${typeof resolved.content}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to resolve schema "${this.thinkConfig.schema}": ${error instanceof Error ? error.message : String(error)}`);
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
