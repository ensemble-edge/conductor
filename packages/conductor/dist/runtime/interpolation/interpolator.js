/**
 * Interpolator
 *
 * Orchestrates chain of resolvers for template interpolation.
 * Reduced from 42 lines of nested if/else to clean chain pattern.
 */
import { StringResolver, ArrayResolver, ObjectResolver, PassthroughResolver } from './resolver.js';
/**
 * Interpolator with chain of resolvers
 */
export class Interpolator {
    constructor(resolvers) {
        this.resolvers = resolvers || [
            new StringResolver(),
            new ArrayResolver(),
            new ObjectResolver(),
            new PassthroughResolver(), // Must be last (catches all)
        ];
    }
    /**
     * Resolve template with context
     * Delegates to first resolver that can handle the template
     */
    resolve(template, context) {
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
let globalInterpolator = null;
/**
 * Get global interpolator
 */
export function getInterpolator() {
    if (!globalInterpolator) {
        globalInterpolator = new Interpolator();
    }
    return globalInterpolator;
}
/**
 * Reset global interpolator (useful for testing)
 */
export function resetInterpolator() {
    globalInterpolator = null;
}
