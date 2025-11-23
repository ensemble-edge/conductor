/**
 * Prompt Parser
 *
 * Handles template variable substitution with Handlebars-style syntax.
 * Supports:
 * - Simple variables: {{name}}
 * - Nested properties: {{user.email}}
 * - Array access: {{items[0]}}
 * - Conditional blocks: {{#if condition}}...{{/if}}
 * - Loop blocks: {{#each items}}...{{/each}}
 */
export interface ParserOptions {
    strict?: boolean;
    escapeHtml?: boolean;
    allowUndefined?: boolean;
}
export declare class PromptParser {
    private options;
    private defaultOptions;
    constructor(options?: ParserOptions);
    /**
     * Parse and substitute variables in template
     */
    parse(template: string, variables: Record<string, unknown>, options?: ParserOptions): string;
    /**
     * Parse simple variable substitution: {{name}}
     */
    private parseVariables;
    /**
     * Parse conditional blocks: {{#if condition}}...{{/if}}
     */
    private parseConditionals;
    /**
     * Parse loop blocks: {{#each items}}...{{/each}}
     */
    private parseLoops;
    /**
     * Resolve variable path (supports nested properties and array access)
     */
    private resolveVariable;
    /**
     * Check if value is truthy
     */
    private isTruthy;
    /**
     * Escape HTML special characters
     */
    private escapeHtml;
    /**
     * Extract all variable paths from template
     */
    static extractVariables(template: string): string[];
}
/**
 * Convenience function to parse a template
 */
export declare function parseTemplate(template: string, variables: Record<string, unknown>, options?: ParserOptions): string;
//# sourceMappingURL=prompt-parser.d.ts.map