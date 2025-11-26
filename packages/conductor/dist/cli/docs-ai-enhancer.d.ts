/**
 * AI Documentation Enhancer
 *
 * Uses Workers AI to enhance auto-generated documentation with:
 * - Better descriptions
 * - Usage examples
 * - Clear explanations
 * - Best practices
 *
 * Includes comprehensive Conductor context in prompts.
 */
import type { OpenAPISpec } from './openapi-generator.js';
/**
 * Enhance an agent description
 */
export declare function createAgentDescriptionPrompt(agent: {
    name: string;
    operation: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
}): string;
/**
 * Enhance an ensemble description
 */
export declare function createEnsembleDescriptionPrompt(ensemble: {
    name: string;
    description?: string;
    triggers?: Array<{
        type: string;
        path?: string;
        cron?: string;
    }>;
    stepCount: number;
    agentNames: string[];
}): string;
/**
 * Generate a usage example for an agent
 */
export declare function createAgentExamplePrompt(agent: {
    name: string;
    operation: string;
    inputSchema?: Record<string, unknown>;
}): string;
/**
 * Generate a usage example for an ensemble
 */
export declare function createEnsembleExamplePrompt(ensemble: {
    name: string;
    inputSchema?: Record<string, unknown>;
}): string;
/**
 * Enhance OpenAPI operation description
 */
export declare function createOpenAPIOperationPrompt(operation: {
    path: string;
    method: string;
    summary?: string;
    description?: string;
    requestBody?: unknown;
    responses?: unknown;
}): string;
/**
 * AI configuration for docs enhancement
 */
export interface DocsAIConfig {
    /** Enable AI enhancement */
    enabled?: boolean;
    /** AI model to use */
    model?: string;
    /** AI provider */
    provider?: 'cloudflare' | 'openai' | 'anthropic';
    /** Temperature (0-1) */
    temperature?: number;
}
/**
 * Default AI configuration
 */
export declare const DEFAULT_AI_CONFIG: DocsAIConfig;
/**
 * AI Enhancer class for documentation
 *
 * Supports multiple AI providers:
 * - Cloudflare Workers AI (default)
 * - OpenAI (via API key)
 * - Anthropic (via API key)
 */
export declare class DocsAIEnhancer {
    private aiBinding;
    private config;
    constructor(aiBinding: any, config?: DocsAIConfig);
    /**
     * Get current AI configuration
     */
    getConfig(): DocsAIConfig;
    /**
     * Update AI configuration
     */
    setConfig(config: Partial<DocsAIConfig>): void;
    /**
     * Enhance a single text using AI
     */
    enhance(prompt: string): Promise<string>;
    /**
     * Enhance an entire OpenAPI spec
     */
    enhanceSpec(spec: OpenAPISpec): Promise<OpenAPISpec>;
    /**
     * Enhance agent description
     */
    enhanceAgentDescription(agent: {
        name: string;
        operation: string;
        description?: string;
        inputSchema?: Record<string, unknown>;
        outputSchema?: Record<string, unknown>;
    }): Promise<string>;
    /**
     * Enhance ensemble description
     */
    enhanceEnsembleDescription(ensemble: {
        name: string;
        description?: string;
        triggers?: Array<{
            type: string;
            path?: string;
            cron?: string;
        }>;
        stepCount: number;
        agentNames: string[];
    }): Promise<string>;
    /**
     * Generate agent usage example
     */
    generateAgentExample(agent: {
        name: string;
        operation: string;
        inputSchema?: Record<string, unknown>;
    }): Promise<string>;
    /**
     * Generate ensemble usage example
     */
    generateEnsembleExample(ensemble: {
        name: string;
        inputSchema?: Record<string, unknown>;
    }): Promise<string>;
}
/**
 * Get system prompt (exported for testing/inspection)
 */
export declare function getSystemPrompt(): string;
/**
 * Get Conductor context (exported for testing/inspection)
 */
export declare function getConductorContext(): string;
//# sourceMappingURL=docs-ai-enhancer.d.ts.map