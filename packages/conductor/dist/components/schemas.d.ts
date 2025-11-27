/**
 * Schema Registry
 *
 * Provides typed access to JSON schemas with validation support.
 * Wraps the ComponentRegistry for schema-specific operations.
 *
 * @module components/schemas
 */
import { type ComponentRegistry } from './registry.js';
/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
    type?: string | string[];
    properties?: Record<string, JSONSchema>;
    required?: string[];
    items?: JSONSchema | JSONSchema[];
    additionalProperties?: boolean | JSONSchema;
    enum?: any[];
    const?: any;
    allOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    oneOf?: JSONSchema[];
    not?: JSONSchema;
    if?: JSONSchema;
    then?: JSONSchema;
    else?: JSONSchema;
    $ref?: string;
    $defs?: Record<string, JSONSchema>;
    definitions?: Record<string, JSONSchema>;
    title?: string;
    description?: string;
    default?: any;
    examples?: any[];
    format?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    minProperties?: number;
    maxProperties?: number;
    [key: string]: any;
}
/**
 * Validation result from schema validation
 */
export interface ValidationResult {
    /** Whether the data is valid */
    valid: boolean;
    /** List of validation errors (empty if valid) */
    errors: ValidationError[];
}
/**
 * Individual validation error
 */
export interface ValidationError {
    /** JSON path to the invalid property */
    path: string;
    /** Human-readable error message */
    message: string;
    /** JSON Schema keyword that failed (e.g., 'required', 'type') */
    keyword: string;
    /** Expected value/type */
    expected?: any;
    /** Actual value received */
    actual?: any;
}
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
export declare class SchemaRegistry {
    private parent;
    constructor(parent: ComponentRegistry);
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
    get(nameOrRef: string): Promise<JSONSchema>;
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
    validate(nameOrRef: string, data: any): Promise<ValidationResult>;
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
    isValid(nameOrRef: string, data: any): Promise<boolean>;
    /**
     * Check if a schema exists
     *
     * @param nameOrRef - Schema name with optional version
     * @returns True if schema exists
     */
    exists(nameOrRef: string): Promise<boolean>;
}
/**
 * Lightweight JSON Schema validator
 *
 * Optimized for Cloudflare Workers - no external dependencies.
 * Supports most JSON Schema Draft 7 features.
 */
export declare function validateJsonSchema(schema: JSONSchema | boolean, data: any, path?: string): ValidationResult;
//# sourceMappingURL=schemas.d.ts.map