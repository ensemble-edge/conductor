/**
 * Prompt Schema
 *
 * Defines the structure for YAML-based prompt templates.
 * Prompts are versioned, support variables, and can have metadata.
 */
export interface PromptVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
    required?: boolean;
    default?: unknown;
    examples?: unknown[];
}
export interface PromptMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}
export interface PromptTemplate {
    metadata: PromptMetadata;
    variables?: PromptVariable[];
    system?: string;
    user?: string;
    assistant?: string;
    template: string;
}
export interface PromptValidationError {
    variable: string;
    message: string;
}
export interface PromptValidationResult {
    valid: boolean;
    errors: PromptValidationError[];
}
/**
 * Validate prompt variables against schema
 */
export declare function validatePromptVariables(template: PromptTemplate, variables: Record<string, unknown>): PromptValidationResult;
/**
 * Apply default values to variables
 */
export declare function applyDefaultVariables(template: PromptTemplate, variables: Record<string, unknown>): Record<string, unknown>;
/**
 * Extract variables from template string
 */
export declare function extractVariables(template: string): string[];
/**
 * Get variable info from template
 */
export declare function getVariableInfo(template: PromptTemplate, variableName: string): PromptVariable | null;
//# sourceMappingURL=prompt-schema.d.ts.map