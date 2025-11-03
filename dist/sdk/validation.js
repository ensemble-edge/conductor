/**
 * SDK Validation Helpers
 *
 * Runtime input/output validation utilities
 */
/**
 * Validate input against a schema
 *
 * @example
 * ```typescript
 * validateInput(input, {
 *   domain: 'string',
 *   required: 'boolean?'
 * });
 * ```
 */
export function validateInput(input, schema) {
    if (typeof input !== 'object' || input === null) {
        throw new Error('Input must be an object');
    }
    const inputObj = input;
    for (const [key, type] of Object.entries(schema)) {
        const optional = type.endsWith('?');
        const actualType = optional ? type.slice(0, -1) : type;
        const value = inputObj[key];
        // Check required fields
        if (!optional && value === undefined) {
            throw new Error(`Missing required field: ${key}`);
        }
        // Skip validation for optional missing fields
        if (optional && value === undefined) {
            continue;
        }
        // Type checking
        const jsType = typeof value;
        if (actualType === 'string' && jsType !== 'string') {
            throw new Error(`Field ${key} must be a string, got ${jsType}`);
        }
        if (actualType === 'number' && jsType !== 'number') {
            throw new Error(`Field ${key} must be a number, got ${jsType}`);
        }
        if (actualType === 'boolean' && jsType !== 'boolean') {
            throw new Error(`Field ${key} must be a boolean, got ${jsType}`);
        }
        if (actualType === 'object' &&
            (jsType !== 'object' || value === null || Array.isArray(value))) {
            throw new Error(`Field ${key} must be an object, got ${jsType}`);
        }
        if (actualType === 'array' && !Array.isArray(value)) {
            throw new Error(`Field ${key} must be an array, got ${jsType}`);
        }
    }
}
/**
 * Validate output against a schema
 */
export function validateOutput(output, schema) {
    validateInput(output, schema); // Same logic
}
/**
 * Assert that a condition is true
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}
/**
 * Validate that a value is not null or undefined
 */
export function assertExists(value, name) {
    if (value === null || value === undefined) {
        throw new Error(`${name} must exist, got ${value}`);
    }
}
/**
 * Coerce input to expected types
 */
export function coerceInput(input, schema) {
    if (typeof input !== 'object' || input === null) {
        throw new Error('Input must be an object');
    }
    const inputObj = input;
    const coerced = {};
    for (const [key, type] of Object.entries(schema)) {
        const optional = type.endsWith('?');
        const actualType = optional ? type.slice(0, -1) : type;
        const value = inputObj[key];
        if (value === undefined) {
            if (!optional) {
                throw new Error(`Missing required field: ${key}`);
            }
            continue;
        }
        // Type coercion
        switch (actualType) {
            case 'string':
                coerced[key] = String(value);
                break;
            case 'number':
                const numValue = Number(value);
                if (isNaN(numValue)) {
                    throw new Error(`Cannot coerce ${key} to number`);
                }
                coerced[key] = numValue;
                break;
            case 'boolean':
                coerced[key] = Boolean(value);
                break;
            default:
                coerced[key] = value;
        }
    }
    return coerced;
}
