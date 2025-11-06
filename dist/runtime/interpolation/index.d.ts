/**
 * Interpolation System
 *
 * Chain of responsibility pattern for template resolution.
 * Exports all resolver types and interpolator.
 */
export type { InterpolationResolver, ResolutionContext } from './resolver.js';
export { StringResolver, ArrayResolver, ObjectResolver, PassthroughResolver } from './resolver.js';
export { Interpolator, getInterpolator, resetInterpolator } from './interpolator.js';
//# sourceMappingURL=index.d.ts.map