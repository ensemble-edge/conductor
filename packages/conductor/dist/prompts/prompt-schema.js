/**
 * Prompt Schema
 *
 * Defines the structure for YAML-based prompt templates.
 * Prompts are versioned, support variables, and can have metadata.
 */
/**
 * Validate prompt variables against schema
 */
export function validatePromptVariables(template, variables) {
    const errors = [];
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
                message: `Required variable "${varDef.name}" is missing`,
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
                message: `Variable "${varDef.name}" has type "${actualType}" but expected "${varDef.type}"`,
            });
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Apply default values to variables
 */
export function applyDefaultVariables(template, variables) {
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
export function extractVariables(template) {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();
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
export function getVariableInfo(template, variableName) {
    if (!template.variables) {
        return null;
    }
    return template.variables.find((v) => v.name === variableName) || null;
}
