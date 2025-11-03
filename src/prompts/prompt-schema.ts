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
export function validatePromptVariables(
	template: PromptTemplate,
	variables: Record<string, unknown>
): PromptValidationResult {
	const errors: PromptValidationError[] = [];

	if (!template.variables) {
		return { valid: true, errors: [] };
	}

	// Check required variables
	for (const varDef of template.variables) {
		const value = variables[varDef.name];

		// Check if required variable is missing
		if (varDef.required && (value === undefined || value === null)) {
			errors.push({
				variable: varDef.name,
				message: `Required variable "${varDef.name}" is missing`
			});
			continue;
		}

		// Skip type checking if variable is not provided and has default
		if (value === undefined || value === null) {
			continue;
		}

		// Type checking
		const actualType = Array.isArray(value) ? 'array' : typeof value;
		if (actualType !== varDef.type) {
			errors.push({
				variable: varDef.name,
				message: `Variable "${varDef.name}" has type "${actualType}" but expected "${varDef.type}"`
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Apply default values to variables
 */
export function applyDefaultVariables(
	template: PromptTemplate,
	variables: Record<string, unknown>
): Record<string, unknown> {
	if (!template.variables) {
		return variables;
	}

	const result = { ...variables };

	for (const varDef of template.variables) {
		if (result[varDef.name] === undefined && varDef.default !== undefined) {
			result[varDef.name] = varDef.default;
		}
	}

	return result;
}

/**
 * Extract variables from template string
 */
export function extractVariables(template: string): string[] {
	const regex = /\{\{([^}]+)\}\}/g;
	const variables = new Set<string>();
	let match;

	while ((match = regex.exec(template)) !== null) {
		const varName = match[1].trim();
		variables.add(varName);
	}

	return Array.from(variables);
}

/**
 * Get variable info from template
 */
export function getVariableInfo(template: PromptTemplate, variableName: string): PromptVariable | null {
	if (!template.variables) {
		return null;
	}

	return template.variables.find((v) => v.name === variableName) || null;
}
