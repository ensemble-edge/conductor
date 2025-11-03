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
 */
export class StringResolver implements InterpolationResolver {
	private readonly interpolationPattern = /^\$\{(.+)\}$/;

	canResolve(template: unknown): boolean {
		return typeof template === 'string' && this.interpolationPattern.test(template);
	}

	resolve(template: string, context: ResolutionContext): unknown {
		const match = template.match(this.interpolationPattern);
		if (!match) return template;

		// Extract path like "input.domain" or "state.companyData"
		const path = match[1];
		const parts = path.split('.');

		// Traverse context to get value
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
