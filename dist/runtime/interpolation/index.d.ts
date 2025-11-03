/**
 * Interpolation System
 *
 * Chain of responsibility pattern for template resolution.
 * Exports all resolver types and interpolator.
 */
export type { InterpolationResolver, ResolutionContext } from './resolver';
export { StringResolver, ArrayResolver, ObjectResolver, PassthroughResolver } from './resolver';
export { Interpolator, getInterpolator, resetInterpolator } from './interpolator';
//# sourceMappingURL=index.d.ts.map