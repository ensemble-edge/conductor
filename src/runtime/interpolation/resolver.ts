/**
 * Interpolation Resolver System
 *
 * Chain of responsibility pattern for resolving template values.
 * Each resolver handles a specific type of interpolation.
 */

/**
 * Resolution context containing available values
 */
export interface ResolutionContext {
	[key: string]: unknown;
}

/**
 * Interpolation Resolver interface
 * Each resolver decides if it can handle the template, then resolves it
 */
export interface InterpolationResolver {
	/**
	 * Check if this resolver can handle the template
	 */
	canResolve(template: unknown): boolean;

	/**
	 * Resolve the template to its final value
	 */
	resolve(template: unknown, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown;
}

/**
 * Resolves string interpolations like ${input.x}, ${state.y}
 * Supports both full replacement and partial interpolation:
 * - Full: '${input.name}' → returns value as-is (any type)
 * - Partial: 'Hello ${input.name}!' → returns interpolated string
 */
export class StringResolver implements InterpolationResolver {
	private readonly fullPattern = /^\$\{([^}]*)\}$/;  // Disallow } in capture to prevent matching multiple ${}
	private readonly hasInterpolationPattern = /\$\{[^}]*\}/;

	canResolve(template: unknown): boolean {
		if (typeof template !== 'string') return false;
		return this.fullPattern.test(template) || this.hasInterpolationPattern.test(template);
	}

	resolve(template: string, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown {
		// Case 1: Full replacement - entire string is ${...}
		// Returns the value as-is (could be any type)
		const fullMatch = template.match(this.fullPattern);
		if (fullMatch) {
			const path = fullMatch[1].trim();

			// Handle empty path
			if (!path) {
				return undefined;
			}

			return this.traversePath(path, context);
		}

		// Case 2: Partial interpolation - string contains ${...}
		// Returns a string with all ${...} replaced
		const result = template.replace(/\$\{([^}]*)\}/g, (match, path) => {
			const trimmedPath = path.trim();

			// Empty path becomes empty string
			if (!trimmedPath) {
				return '';
			}

			const value = this.traversePath(trimmedPath, context);

			// If value is undefined, keep original ${...} in string
			// Otherwise convert value to string
			return value !== undefined ? String(value) : match;
		});

		return result;
	}

	/**
	 * Traverse context using dot-separated path
	 */
	private traversePath(path: string, context: ResolutionContext): unknown {
		const parts = path.split('.').map(p => p.trim());

		let value: unknown = context;
		for (const part of parts) {
			if (value && typeof value === 'object' && part in value) {
				value = (value as Record<string, unknown>)[part];
			} else {
				return undefined;
			}
		}

		return value;
	}
}

/**
 * Resolves arrays by recursively resolving each item
 */
export class ArrayResolver implements InterpolationResolver {
	canResolve(template: unknown): boolean {
		return Array.isArray(template);
	}

	resolve(template: unknown[], context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown {
		return template.map(item => interpolate(item, context));
	}
}

/**
 * Resolves objects by recursively resolving each property
 */
export class ObjectResolver implements InterpolationResolver {
	canResolve(template: unknown): boolean {
		return typeof template === 'object' && template !== null && !Array.isArray(template);
	}

	resolve(template: Record<string, unknown>, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown {
		const resolved: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(template)) {
			resolved[key] = interpolate(value, context);
		}
		return resolved;
	}
}

/**
 * Passthrough resolver for primitives (numbers, booleans, null)
 */
export class PassthroughResolver implements InterpolationResolver {
	canResolve(template: unknown): boolean {
		return true; // Handles everything else
	}

	resolve(template: unknown): unknown {
		return template;
	}
}
