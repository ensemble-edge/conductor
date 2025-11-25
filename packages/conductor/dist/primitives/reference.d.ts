/**
 * Reference Primitives
 *
 * Provides primitives for referencing values from state, input, environment,
 * and step results. References enable dynamic value resolution at runtime.
 */
/**
 * Reference source types
 */
export type ReferenceSource = 'input' | 'state' | 'env' | 'steps' | 'context' | 'output';
/**
 * Reference options
 */
export interface ReferenceOptions {
    /** Default value if reference is undefined */
    default?: unknown;
    /** Transform function to apply to the value */
    transform?: (value: unknown) => unknown;
    /** Whether the reference is required */
    required?: boolean;
    /** Type validation */
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
}
/**
 * Reference class - represents a dynamic value reference
 */
export declare class Reference {
    readonly source: ReferenceSource;
    readonly path: string;
    readonly defaultValue?: unknown;
    readonly transform?: (value: unknown) => unknown;
    readonly required: boolean;
    readonly type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    /** Internal marker for serialization */
    readonly __isReference = true;
    constructor(source: ReferenceSource, path: string, options?: ReferenceOptions);
    /**
     * Get the full reference path (source.path)
     */
    getFullPath(): string;
    /**
     * Convert to string expression for YAML/serialization
     */
    toExpression(): string;
    /**
     * Convert to plain config object
     */
    toConfig(): {
        ref: string;
        default?: unknown;
        required?: boolean;
        type?: string;
    };
}
/**
 * Create a reference to a value
 *
 * @example
 * ```typescript
 * // Reference input
 * const userId = ref('input.userId');
 *
 * // Reference state with default
 * const count = ref('state.counter', { default: 0 });
 *
 * // Reference step result
 * const analysis = ref('steps.analyze.result');
 *
 * // Reference environment variable
 * const apiKey = ref('env.API_KEY', { required: true });
 * ```
 */
export declare function ref(path: string, options?: ReferenceOptions): Reference;
/**
 * Create a reference to input data
 *
 * @example
 * ```typescript
 * const query = inputRef('query');
 * const userId = inputRef('user.id', { required: true });
 * ```
 */
export declare function inputRef(path: string, options?: ReferenceOptions): Reference;
/**
 * Create a reference to state data
 *
 * @example
 * ```typescript
 * const counter = stateRef('counter', { default: 0 });
 * const userData = stateRef('user', { type: 'object' });
 * ```
 */
export declare function stateRef(path: string, options?: ReferenceOptions): Reference;
/**
 * Create a reference to environment variables
 *
 * @example
 * ```typescript
 * const apiKey = envRef('API_KEY', { required: true });
 * const debug = envRef('DEBUG', { default: 'false', type: 'boolean' });
 * ```
 */
export declare function envRef(path: string, options?: ReferenceOptions): Reference;
/**
 * Create a reference to a step's result
 *
 * @example
 * ```typescript
 * const analysisResult = stepRef('analyze', 'result');
 * const fetchedData = stepRef('fetch-data', 'data.items');
 * ```
 */
export declare function stepRef(stepName: string, path?: string, options?: ReferenceOptions): Reference;
/**
 * Create a reference to the current context
 *
 * @example
 * ```typescript
 * const executionId = contextRef('executionId');
 * const timestamp = contextRef('timestamp');
 * ```
 */
export declare function contextRef(path: string, options?: ReferenceOptions): Reference;
/**
 * Create a reference to the output being built
 *
 * @example
 * ```typescript
 * const currentOutput = outputRef('summary');
 * ```
 */
export declare function outputRef(path: string, options?: ReferenceOptions): Reference;
/**
 * Check if a value is a Reference instance
 */
export declare function isReference(value: unknown): value is Reference;
/**
 * Create a computed value from multiple references
 *
 * @example
 * ```typescript
 * const fullName = computed(
 *   [inputRef('firstName'), inputRef('lastName')],
 *   ([first, last]) => `${first} ${last}`
 * );
 * ```
 */
export declare function computed(refs: Reference[], compute: (values: unknown[]) => unknown): {
    refs: Reference[];
    compute: (values: unknown[]) => unknown;
    __isComputed: true;
};
/**
 * Check if a value is a computed reference
 */
export declare function isComputed(value: unknown): value is {
    refs: Reference[];
    compute: (values: unknown[]) => unknown;
    __isComputed: true;
};
/**
 * Template string helper for creating expressions with references
 *
 * @example
 * ```typescript
 * const greeting = template`Hello, ${inputRef('name')}! Your order ${stateRef('orderId')} is ready.`;
 * ```
 */
export declare function template(strings: TemplateStringsArray, ...values: (Reference | string | number)[]): {
    template: string;
    refs: Reference[];
    __isTemplate: true;
};
/**
 * Check if a value is a template expression
 */
export declare function isTemplate(value: unknown): value is {
    template: string;
    refs: Reference[];
    __isTemplate: true;
};
/**
 * Parse a string expression into a Reference
 *
 * @example
 * ```typescript
 * const ref = parseRef('${input.userId}');
 * // Returns Reference { source: 'input', path: 'userId' }
 * ```
 */
export declare function parseRef(expression: string): Reference | null;
/**
 * Check if a string looks like a reference expression
 */
export declare function isRefExpression(value: unknown): boolean;
/**
 * Utility to create a map of references
 *
 * @example
 * ```typescript
 * const refs = refMap({
 *   userId: 'input.userId',
 *   apiKey: 'env.API_KEY',
 *   previousResult: 'steps.analyze.result'
 * });
 * ```
 */
export declare function refMap(paths: Record<string, string>, defaultOptions?: ReferenceOptions): Record<string, Reference>;
//# sourceMappingURL=reference.d.ts.map