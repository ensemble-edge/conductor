/**
 * Interpolator
 *
 * Orchestrates chain of resolvers for template interpolation.
 * Reduced from 42 lines of nested if/else to clean chain pattern.
 */

import type { InterpolationResolver, ResolutionContext } from './resolver';
import { StringResolver, ArrayResolver, ObjectResolver, PassthroughResolver } from './resolver';

/**
 * Interpolator with chain of resolvers
 */
export class Interpolator {
	private resolvers: InterpolationResolver[];

	constructor(resolvers?: InterpolationResolver[]) {
		this.resolvers = resolvers || [
			new StringResolver(),
			new ArrayResolver(),
			new ObjectResolver(),
			new PassthroughResolver() // Must be last (catches all)
		];
	}

	/**
	 * Resolve template with context
	 * Delegates to first resolver that can handle the template
	 */
	resolve(template: any, context: ResolutionContext): any {
		for (const resolver of this.resolvers) {
			if (resolver.canResolve(template)) {
				return resolver.resolve(template, context, (t, c) => this.resolve(t, c));
			}
		}

		// Should never reach here due to PassthroughResolver
		return template;
	}
}

/**
 * Singleton instance for global use
 */
let globalInterpolator: Interpolator | null = null;

/**
 * Get global interpolator
 */
export function getInterpolator(): Interpolator {
	if (!globalInterpolator) {
		globalInterpolator = new Interpolator();
	}
	return globalInterpolator;
}

/**
 * Reset global interpolator (useful for testing)
 */
export function resetInterpolator(): void {
	globalInterpolator = null;
}
