/**
 * Prompt Registry
 *
 * Provides typed access to prompt templates with rendering support.
 * Wraps the ComponentRegistry for prompt-specific operations.
 *
 * @module components/prompts
 */
import { type ComponentRegistry } from './registry.js';
/**
 * Prompt template with optional metadata
 */
export interface PromptTemplate {
    /** The prompt template content */
    content: string;
    /** Optional metadata about the prompt */
    metadata?: {
        /** Prompt name */
        name?: string;
        /** Prompt description */
        description?: string;
        /** Expected variables */
        variables?: string[];
        /** Version */
        version?: string;
    };
}
/**
 * Prompt registry - access and render prompts
 *
 * @example
 * ```typescript
 * // Get a prompt template
 * const prompt = await ctx.prompts.get('extraction')
 * const promptWithVersion = await ctx.prompts.get('extraction@v1.0.0')
 *
 * // Render with variables
 * const rendered = await ctx.prompts.render('docs-writer', {
 *   page: 'getting-started',
 *   projectName: 'MyApp'
 * })
 * ```
 */
export declare class PromptRegistry {
    private parent;
    constructor(parent: ComponentRegistry);
    /**
     * Get a prompt template by name (with optional @version)
     *
     * Returns the raw prompt template string.
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns Prompt template string
     *
     * @example
     * ```typescript
     * ctx.prompts.get('extraction')           // extraction@latest
     * ctx.prompts.get('extraction@v1.0.0')    // exact version
     * ```
     */
    get(nameOrRef: string): Promise<string>;
    /**
     * Get prompt with metadata
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns Prompt template with metadata
     */
    getWithMetadata(nameOrRef: string): Promise<PromptTemplate>;
    /**
     * Render a prompt with variables (Handlebars)
     *
     * Uses Handlebars templating to replace variables in the prompt.
     *
     * @param nameOrRef - Prompt name with optional version
     * @param variables - Variables to inject into the template
     * @returns Rendered prompt string
     *
     * @example
     * ```typescript
     * const rendered = await ctx.prompts.render('docs-writer@v1.0.0', {
     *   page: 'getting-started',
     *   projectName: 'MyApp'
     * })
     * ```
     */
    render(nameOrRef: string, variables: Record<string, any>): Promise<string>;
    /**
     * Check if a prompt exists
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns True if prompt exists
     */
    exists(nameOrRef: string): Promise<boolean>;
    /**
     * List variables used in a prompt template
     *
     * Extracts Handlebars variable references from the template.
     *
     * @param nameOrRef - Prompt name with optional version
     * @returns Array of variable names
     *
     * @example
     * ```typescript
     * const vars = await ctx.prompts.listVariables('docs-writer')
     * // ['page', 'projectName', 'description']
     * ```
     */
    listVariables(nameOrRef: string): Promise<string[]>;
}
/**
 * Render a Handlebars template
 *
 * Lightweight implementation optimized for Workers.
 * Supports basic Handlebars features:
 * - {{variable}} - Variable substitution
 * - {{nested.path}} - Nested property access
 * - {{#if condition}}...{{/if}} - Conditionals
 * - {{#each items}}...{{/each}} - Iteration
 * - {{#unless condition}}...{{/unless}} - Negative conditionals
 * - {{@index}}, {{@key}} - Loop context
 *
 * @param template - Handlebars template string
 * @param variables - Variables to inject
 * @returns Rendered string
 */
export declare function renderHandlebars(template: string, variables: Record<string, any>): string;
//# sourceMappingURL=prompts.d.ts.map