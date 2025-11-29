/**
 * AI Provider System
 *
 * Base interfaces and types for AI provider implementations.
 * Follows composition over inheritance for flexible provider management.
 */
import type { ProviderId } from '../../types/branded.js';
import type { ConductorEnv } from '../../types/env.js';
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
    /** JSON Schema for structured output (reference to schema component or inline schema) */
    schema?: string | Record<string, unknown>;
}
/**
 * Request to AI provider
 */
export interface AIProviderRequest {
    messages: AIMessage[];
    config: AIProviderConfig;
    env: ConductorEnv;
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
    validateConfig(config: AIProviderConfig, env: ConductorEnv): boolean;
    /**
     * Get error message for missing configuration
     */
    getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null;
}
/**
 * Base AI provider with common functionality
 */
export declare abstract class BaseAIProvider implements AIProvider {
    abstract readonly id: ProviderId;
    abstract readonly name: string;
    abstract execute(request: AIProviderRequest): Promise<AIProviderResponse>;
    /**
     * Default validation checks for API key
     */
    validateConfig(config: AIProviderConfig, env: ConductorEnv): boolean;
    /**
     * Override this to provide specific validation
     */
    abstract getConfigError(config: AIProviderConfig, env: ConductorEnv): string | null;
    /**
     * Helper to get API key from config or env
     */
    protected getApiKey(config: AIProviderConfig, env: ConductorEnv, envVarName: string): string | null;
    /**
     * Helper to make HTTP request
     */
    protected makeRequest(endpoint: string, headers: Record<string, string>, body: unknown): Promise<unknown>;
}
//# sourceMappingURL=base-provider.d.ts.map