/**
 * Reference Primitives
 *
 * Provides primitives for referencing values from state, input, environment,
 * and step results. References enable dynamic value resolution at runtime.
 */

/**
 * Reference source types
 */
export type ReferenceSource = 'input' | 'state' | 'env' | 'steps' | 'context' | 'output'

/**
 * Reference options
 */
export interface ReferenceOptions {
	/** Default value if reference is undefined */
	default?: unknown
	/** Transform function to apply to the value */
	transform?: (value: unknown) => unknown
	/** Whether the reference is required */
	required?: boolean
	/** Type validation */
	type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
}

/**
 * Reference class - represents a dynamic value reference
 */
export class Reference {
	public readonly source: ReferenceSource
	public readonly path: string
	public readonly defaultValue?: unknown
	public readonly transform?: (value: unknown) => unknown
	public readonly required: boolean
	public readonly type?: 'string' | 'number' | 'boolean' | 'object' | 'array'

	/** Internal marker for serialization */
	public readonly __isReference = true

	constructor(source: ReferenceSource, path: string, options?: ReferenceOptions) {
		this.source = source
		this.path = path
		this.defaultValue = options?.default
		this.transform = options?.transform
		this.required = options?.required ?? false
		this.type = options?.type
	}

	/**
	 * Get the full reference path (source.path)
	 */
	getFullPath(): string {
		return `${this.source}.${this.path}`
	}

	/**
	 * Convert to string expression for YAML/serialization
	 */
	toExpression(): string {
		return `\${${this.getFullPath()}}`
	}

	/**
	 * Convert to plain config object
	 */
	toConfig(): { ref: string; default?: unknown; required?: boolean; type?: string } {
		const config: { ref: string; default?: unknown; required?: boolean; type?: string } = {
			ref: this.getFullPath(),
		}
		if (this.defaultValue !== undefined) {
			config.default = this.defaultValue
		}
		if (this.required) {
			config.required = true
		}
		if (this.type) {
			config.type = this.type
		}
		return config
	}
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
export function ref(path: string, options?: ReferenceOptions): Reference {
	// Parse the path to extract source
	const parts = path.split('.')
	const source = parts[0] as ReferenceSource
	const restPath = parts.slice(1).join('.')

	// Validate source
	const validSources: ReferenceSource[] = ['input', 'state', 'env', 'steps', 'context', 'output']
	if (!validSources.includes(source)) {
		throw new Error(
			`Invalid reference source: ${source}. Must be one of: ${validSources.join(', ')}`
		)
	}

	return new Reference(source, restPath, options)
}

/**
 * Create a reference to input data
 *
 * @example
 * ```typescript
 * const query = inputRef('query');
 * const userId = inputRef('user.id', { required: true });
 * ```
 */
export function inputRef(path: string, options?: ReferenceOptions): Reference {
	return new Reference('input', path, options)
}

/**
 * Create a reference to state data
 *
 * @example
 * ```typescript
 * const counter = stateRef('counter', { default: 0 });
 * const userData = stateRef('user', { type: 'object' });
 * ```
 */
export function stateRef(path: string, options?: ReferenceOptions): Reference {
	return new Reference('state', path, options)
}

/**
 * Create a reference to environment variables
 *
 * @example
 * ```typescript
 * const apiKey = envRef('API_KEY', { required: true });
 * const debug = envRef('DEBUG', { default: 'false', type: 'boolean' });
 * ```
 */
export function envRef(path: string, options?: ReferenceOptions): Reference {
	return new Reference('env', path, options)
}

/**
 * Create a reference to a step's result
 *
 * @example
 * ```typescript
 * const analysisResult = stepRef('analyze', 'result');
 * const fetchedData = stepRef('fetch-data', 'data.items');
 * ```
 */
export function stepRef(stepName: string, path?: string, options?: ReferenceOptions): Reference {
	const fullPath = path ? `${stepName}.${path}` : stepName
	return new Reference('steps', fullPath, options)
}

/**
 * Create a reference to the current context
 *
 * @example
 * ```typescript
 * const executionId = contextRef('executionId');
 * const timestamp = contextRef('timestamp');
 * ```
 */
export function contextRef(path: string, options?: ReferenceOptions): Reference {
	return new Reference('context', path, options)
}

/**
 * Create a reference to the output being built
 *
 * @example
 * ```typescript
 * const currentOutput = outputRef('summary');
 * ```
 */
export function outputRef(path: string, options?: ReferenceOptions): Reference {
	return new Reference('output', path, options)
}

/**
 * Check if a value is a Reference instance
 */
export function isReference(value: unknown): value is Reference {
	return value instanceof Reference || (typeof value === 'object' && value !== null && '__isReference' in value)
}

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
export function computed(
	refs: Reference[],
	compute: (values: unknown[]) => unknown
): { refs: Reference[]; compute: (values: unknown[]) => unknown; __isComputed: true } {
	return {
		refs,
		compute,
		__isComputed: true as const,
	}
}

/**
 * Check if a value is a computed reference
 */
export function isComputed(
	value: unknown
): value is { refs: Reference[]; compute: (values: unknown[]) => unknown; __isComputed: true } {
	return typeof value === 'object' && value !== null && '__isComputed' in value
}

/**
 * Template string helper for creating expressions with references
 *
 * @example
 * ```typescript
 * const greeting = template`Hello, ${inputRef('name')}! Your order ${stateRef('orderId')} is ready.`;
 * ```
 */
export function template(
	strings: TemplateStringsArray,
	...values: (Reference | string | number)[]
): { template: string; refs: Reference[]; __isTemplate: true } {
	const refs: Reference[] = []
	let result = strings[0]

	values.forEach((value, i) => {
		if (isReference(value)) {
			refs.push(value)
			result += value.toExpression()
		} else {
			result += String(value)
		}
		result += strings[i + 1]
	})

	return {
		template: result,
		refs,
		__isTemplate: true as const,
	}
}

/**
 * Check if a value is a template expression
 */
export function isTemplate(
	value: unknown
): value is { template: string; refs: Reference[]; __isTemplate: true } {
	return typeof value === 'object' && value !== null && '__isTemplate' in value
}

/**
 * Parse a string expression into a Reference
 *
 * @example
 * ```typescript
 * const ref = parseRef('${input.userId}');
 * // Returns Reference { source: 'input', path: 'userId' }
 * ```
 */
export function parseRef(expression: string): Reference | null {
	const match = expression.match(/^\$\{(.+)\}$/)
	if (!match) {
		return null
	}
	try {
		return ref(match[1])
	} catch {
		return null
	}
}

/**
 * Check if a string looks like a reference expression
 */
export function isRefExpression(value: unknown): boolean {
	return typeof value === 'string' && /^\$\{.+\}$/.test(value)
}

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
export function refMap(
	paths: Record<string, string>,
	defaultOptions?: ReferenceOptions
): Record<string, Reference> {
	const result: Record<string, Reference> = {}
	for (const [key, path] of Object.entries(paths)) {
		result[key] = ref(path, defaultOptions)
	}
	return result
}
