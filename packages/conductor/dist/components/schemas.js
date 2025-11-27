/**
 * Schema Registry
 *
 * Provides typed access to JSON schemas with validation support.
 * Wraps the ComponentRegistry for schema-specific operations.
 *
 * @module components/schemas
 */
import { parseNameWithVersion } from './registry.js';
/**
 * Schema registry - access and validate against schemas
 *
 * @example
 * ```typescript
 * // Get a schema
 * const schema = await ctx.schemas.get('order')
 * const schemaWithVersion = await ctx.schemas.get('order@v1.0.0')
 *
 * // Validate data
 * const result = await ctx.schemas.validate('order', orderData)
 * if (!result.valid) {
 *   console.log(result.errors)
 * }
 *
 * // Quick boolean check
 * if (await ctx.schemas.isValid('order', orderData)) {
 *   // process valid order
 * }
 * ```
 */
export class SchemaRegistry {
    constructor(parent) {
        this.parent = parent;
    }
    /**
     * Get a schema by name (with optional @version)
     *
     * @param nameOrRef - Schema name with optional version
     * @returns JSON Schema object
     *
     * @example
     * ```typescript
     * ctx.schemas.get('order')           // order@latest
     * ctx.schemas.get('order@v1.0.0')    // exact version
     * ctx.schemas.get('order@^2.0.0')    // semver range
     * ```
     */
    async get(nameOrRef) {
        const { name, version } = parseNameWithVersion(nameOrRef);
        const ref = `schemas/${name}@${version}`;
        return this.parent.resolve(ref);
    }
    /**
     * Validate data against a schema
     *
     * Uses a lightweight JSON Schema validator optimized for Workers.
     * Supports most JSON Schema Draft 7 features.
     *
     * @param nameOrRef - Schema name with optional version
     * @param data - Data to validate
     * @returns Validation result with errors
     *
     * @example
     * ```typescript
     * const result = await ctx.schemas.validate('order@v1.0.0', orderData)
     * if (!result.valid) {
     *   console.log('Validation errors:', result.errors)
     * }
     * ```
     */
    async validate(nameOrRef, data) {
        const schema = await this.get(nameOrRef);
        return validateJsonSchema(schema, data);
    }
    /**
     * Check if data matches schema (returns boolean)
     *
     * Convenience method for simple valid/invalid checks.
     *
     * @param nameOrRef - Schema name with optional version
     * @param data - Data to validate
     * @returns True if valid
     *
     * @example
     * ```typescript
     * if (await ctx.schemas.isValid('order', orderData)) {
     *   await processOrder(orderData)
     * }
     * ```
     */
    async isValid(nameOrRef, data) {
        const result = await this.validate(nameOrRef, data);
        return result.valid;
    }
    /**
     * Check if a schema exists
     *
     * @param nameOrRef - Schema name with optional version
     * @returns True if schema exists
     */
    async exists(nameOrRef) {
        try {
            await this.get(nameOrRef);
            return true;
        }
        catch {
            return false;
        }
    }
}
/**
 * Lightweight JSON Schema validator
 *
 * Optimized for Cloudflare Workers - no external dependencies.
 * Supports most JSON Schema Draft 7 features.
 */
export function validateJsonSchema(schema, data, path = '') {
    const errors = [];
    // Helper to add error
    const addError = (keyword, message, expected, actual) => {
        errors.push({ path: path || '/', keyword, message, expected, actual });
    };
    // Handle boolean schemas (JSON Schema Draft 6+)
    // true matches everything, false matches nothing
    if (schema === true) {
        return { valid: true, errors: [] };
    }
    if (schema === false) {
        addError('false', 'Schema is false - no data is valid');
        return { valid: false, errors };
    }
    // Handle null/undefined schema (matches everything)
    if (schema === null || schema === undefined) {
        return { valid: true, errors: [] };
    }
    // Type validation
    if (schema.type !== undefined) {
        const types = Array.isArray(schema.type) ? schema.type : [schema.type];
        const actualType = getJsonType(data);
        if (!types.includes(actualType)) {
            // Handle integer as a special case of number
            if (!(types.includes('integer') && actualType === 'number' && Number.isInteger(data))) {
                addError('type', `Expected ${types.join(' or ')}, got ${actualType}`, types, actualType);
            }
        }
    }
    // Const validation
    if (schema.const !== undefined) {
        if (!deepEqual(data, schema.const)) {
            addError('const', `Value must be ${JSON.stringify(schema.const)}`, schema.const, data);
        }
    }
    // Enum validation
    if (schema.enum !== undefined) {
        if (!schema.enum.some((e) => deepEqual(data, e))) {
            addError('enum', `Value must be one of: ${JSON.stringify(schema.enum)}`, schema.enum, data);
        }
    }
    // String validations
    if (typeof data === 'string') {
        if (schema.minLength !== undefined && data.length < schema.minLength) {
            addError('minLength', `String must be at least ${schema.minLength} characters`, schema.minLength, data.length);
        }
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
            addError('maxLength', `String must be at most ${schema.maxLength} characters`, schema.maxLength, data.length);
        }
        if (schema.pattern !== undefined) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(data)) {
                addError('pattern', `String must match pattern: ${schema.pattern}`, schema.pattern, data);
            }
        }
        // Format validation (basic)
        if (schema.format !== undefined) {
            const formatError = validateFormat(data, schema.format);
            if (formatError) {
                addError('format', formatError, schema.format, data);
            }
        }
    }
    // Number validations
    if (typeof data === 'number') {
        if (schema.minimum !== undefined && data < schema.minimum) {
            addError('minimum', `Number must be >= ${schema.minimum}`, schema.minimum, data);
        }
        if (schema.maximum !== undefined && data > schema.maximum) {
            addError('maximum', `Number must be <= ${schema.maximum}`, schema.maximum, data);
        }
        if (schema.exclusiveMinimum !== undefined && data <= schema.exclusiveMinimum) {
            addError('exclusiveMinimum', `Number must be > ${schema.exclusiveMinimum}`, schema.exclusiveMinimum, data);
        }
        if (schema.exclusiveMaximum !== undefined && data >= schema.exclusiveMaximum) {
            addError('exclusiveMaximum', `Number must be < ${schema.exclusiveMaximum}`, schema.exclusiveMaximum, data);
        }
        if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
            addError('multipleOf', `Number must be a multiple of ${schema.multipleOf}`, schema.multipleOf, data);
        }
    }
    // Array validations
    if (Array.isArray(data)) {
        if (schema.minItems !== undefined && data.length < schema.minItems) {
            addError('minItems', `Array must have at least ${schema.minItems} items`, schema.minItems, data.length);
        }
        if (schema.maxItems !== undefined && data.length > schema.maxItems) {
            addError('maxItems', `Array must have at most ${schema.maxItems} items`, schema.maxItems, data.length);
        }
        if (schema.uniqueItems && new Set(data.map((item) => JSON.stringify(item))).size !== data.length) {
            addError('uniqueItems', 'Array items must be unique');
        }
        // Validate items
        if (schema.items) {
            if (Array.isArray(schema.items)) {
                // Tuple validation
                schema.items.forEach((itemSchema, i) => {
                    if (i < data.length) {
                        const itemResult = validateJsonSchema(itemSchema, data[i], `${path}[${i}]`);
                        errors.push(...itemResult.errors);
                    }
                });
            }
            else {
                // All items must match schema
                data.forEach((item, i) => {
                    const itemResult = validateJsonSchema(schema.items, item, `${path}[${i}]`);
                    errors.push(...itemResult.errors);
                });
            }
        }
    }
    // Object validations
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const dataKeys = Object.keys(data);
        if (schema.minProperties !== undefined && dataKeys.length < schema.minProperties) {
            addError('minProperties', `Object must have at least ${schema.minProperties} properties`, schema.minProperties, dataKeys.length);
        }
        if (schema.maxProperties !== undefined && dataKeys.length > schema.maxProperties) {
            addError('maxProperties', `Object must have at most ${schema.maxProperties} properties`, schema.maxProperties, dataKeys.length);
        }
        // Required properties
        if (schema.required) {
            for (const req of schema.required) {
                if (!(req in data)) {
                    errors.push({
                        path: `${path}/${req}`,
                        keyword: 'required',
                        message: `Missing required property: ${req}`,
                        expected: req,
                    });
                }
            }
        }
        // Validate properties
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in data) {
                    const propResult = validateJsonSchema(propSchema, data[key], `${path}/${key}`);
                    errors.push(...propResult.errors);
                }
            }
        }
        // Additional properties
        if (schema.additionalProperties === false) {
            const allowedKeys = Object.keys(schema.properties || {});
            const patternKeys = Object.keys(schema.patternProperties || {});
            for (const key of dataKeys) {
                if (!allowedKeys.includes(key) && !patternKeys.some(p => new RegExp(p).test(key))) {
                    addError('additionalProperties', `Additional property not allowed: ${key}`, false, key);
                }
            }
        }
    }
    // Combinators (allOf, anyOf, oneOf, not)
    if (schema.allOf) {
        for (let i = 0; i < schema.allOf.length; i++) {
            const result = validateJsonSchema(schema.allOf[i], data, path);
            errors.push(...result.errors);
        }
    }
    if (schema.anyOf) {
        const anyValid = schema.anyOf.some((s) => validateJsonSchema(s, data, path).valid);
        if (!anyValid) {
            addError('anyOf', 'Data must match at least one schema in anyOf');
        }
    }
    if (schema.oneOf) {
        const matchCount = schema.oneOf.filter((s) => validateJsonSchema(s, data, path).valid).length;
        if (matchCount !== 1) {
            addError('oneOf', `Data must match exactly one schema in oneOf (matched ${matchCount})`);
        }
    }
    if (schema.not) {
        if (validateJsonSchema(schema.not, data, path).valid) {
            addError('not', 'Data must not match the schema in not');
        }
    }
    // Conditional (if/then/else)
    if (schema.if) {
        const ifValid = validateJsonSchema(schema.if, data, path).valid;
        if (ifValid && schema.then) {
            const thenResult = validateJsonSchema(schema.then, data, path);
            errors.push(...thenResult.errors);
        }
        else if (!ifValid && schema.else) {
            const elseResult = validateJsonSchema(schema.else, data, path);
            errors.push(...elseResult.errors);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Get JSON type of a value
 */
function getJsonType(value) {
    if (value === null)
        return 'null';
    if (Array.isArray(value))
        return 'array';
    return typeof value;
}
/**
 * Deep equality check
 */
function deepEqual(a, b) {
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (typeof a !== 'object' || a === null || b === null)
        return false;
    if (Array.isArray(a) !== Array.isArray(b))
        return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length)
            return false;
        return a.every((item, i) => deepEqual(item, b[i]));
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    return keysA.every(key => key in b && deepEqual(a[key], b[key]));
}
/**
 * Validate string format
 */
function validateFormat(value, format) {
    switch (format) {
        case 'email':
            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Invalid email format';
            }
            break;
        case 'uri':
        case 'url':
            try {
                new URL(value);
            }
            catch {
                return 'Invalid URL format';
            }
            break;
        case 'uuid':
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                return 'Invalid UUID format';
            }
            break;
        case 'date':
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
                return 'Invalid date format (expected YYYY-MM-DD)';
            }
            break;
        case 'date-time':
            if (isNaN(Date.parse(value))) {
                return 'Invalid date-time format';
            }
            break;
        case 'time':
            if (!/^\d{2}:\d{2}:\d{2}/.test(value)) {
                return 'Invalid time format (expected HH:MM:SS)';
            }
            break;
        case 'ipv4':
            if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value) ||
                value.split('.').some(n => parseInt(n) > 255)) {
                return 'Invalid IPv4 address';
            }
            break;
        case 'ipv6':
            // Simplified IPv6 check
            if (!/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(value) &&
                !/^([0-9a-fA-F]{1,4}:)*:([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/.test(value)) {
                return 'Invalid IPv6 address';
            }
            break;
        // Add more formats as needed
    }
    return null;
}
