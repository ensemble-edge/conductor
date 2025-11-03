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
export declare function validateInput(input: unknown, schema: Record<string, string>): void;
/**
 * Validate output against a schema
 */
export declare function validateOutput(output: unknown, schema: Record<string, string>): void;
/**
 * Assert that a condition is true
 */
export declare function assert(condition: boolean, message: string): asserts condition;
/**
 * Validate that a value is not null or undefined
 */
export declare function assertExists<T>(value: T | null | undefined, name: string): asserts value is T;
/**
 * Coerce input to expected types
 */
export declare function coerceInput(input: unknown, schema: Record<string, string>): Record<string, unknown>;
//# sourceMappingURL=validation.d.ts.map