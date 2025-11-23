/**
 * Prompt Manager
 *
 * Manages prompt templates with:
 * - YAML loading from files or strings
 * - In-memory caching for performance
 * - Variable substitution
 * - Version management
 * - Template validation
 */
import type { PromptTemplate } from './prompt-schema.js';
import { type ParserOptions } from './prompt-parser.js';
export interface PromptManagerConfig {
    cacheEnabled?: boolean;
    strictValidation?: boolean;
    parserOptions?: ParserOptions;
}
export interface RenderOptions {
    validate?: boolean;
    parserOptions?: ParserOptions;
}
export interface RenderedPrompt {
    content: string;
    metadata: {
        name: string;
        version: string;
        variables: Record<string, unknown>;
    };
}
export declare class PromptManager {
    private cache;
    private parser;
    private config;
    constructor(config?: PromptManagerConfig);
    /**
     * Load prompt from YAML string
     */
    loadFromYAML(yaml: string): PromptTemplate;
    /**
     * Load prompt from JSON string
     */
    loadFromJSON(json: string): PromptTemplate;
    /**
     * Register a prompt template in cache
     */
    register(template: PromptTemplate): void;
    /**
     * Get a prompt template from cache
     */
    get(name: string, version?: string): PromptTemplate | null;
    /**
     * Check if a prompt exists in cache
     */
    has(name: string, version?: string): boolean;
    /**
     * List all cached prompts
     */
    list(): Array<{
        name: string;
        version: string;
    }>;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Render a prompt with variables
     */
    render(template: PromptTemplate, variables: Record<string, unknown>, options?: RenderOptions): RenderedPrompt;
    /**
     * Render a prompt by name from cache
     */
    renderByName(name: string, variables: Record<string, unknown>, version?: string, options?: RenderOptions): RenderedPrompt;
    /**
     * Get cache key
     */
    private getCacheKey;
    /**
     * Simple YAML parser (basic implementation)
     * For production use, replace with a proper YAML library like js-yaml
     */
    private parseSimpleYAML;
    /**
     * Convert template to YAML string
     */
    toYAML(template: PromptTemplate): string;
}
/**
 * Get or create the global prompt manager
 */
export declare function getGlobalPromptManager(config?: PromptManagerConfig): PromptManager;
//# sourceMappingURL=prompt-manager.d.ts.map