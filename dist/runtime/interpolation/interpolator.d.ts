/**
 * Interpolator
 *
 * Orchestrates chain of resolvers for template interpolation.
 * Reduced from 42 lines of nested if/else to clean chain pattern.
 */
import type { InterpolationResolver, ResolutionContext } from './resolver.js';
/**
 * Interpolator with chain of resolvers
 */
export declare class Interpolator {
    private resolvers;
    constructor(resolvers?: InterpolationResolver[]);
    /**
     * Resolve template with context
     * Delegates to first resolver that can handle the template
     */
    resolve(template: any, context: ResolutionContext): any;
}
/**
 * Get global interpolator
 */
export declare function getInterpolator(): Interpolator;
/**
 * Reset global interpolator (useful for testing)
 */
export declare function resetInterpolator(): void;
//# sourceMappingURL=interpolator.d.ts.map