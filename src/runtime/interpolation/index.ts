/**
 * Interpolation System
 *
 * Chain of responsibility pattern for template resolution.
 * Exports all resolver types and interpolator.
 */

// Resolver types
export type { InterpolationResolver, ResolutionContext } from './resolver';
export {
	StringResolver,
	ArrayResolver,
	ObjectResolver,
	PassthroughResolver
} from './resolver';

// Interpolator
export { Interpolator, getInterpolator, resetInterpolator } from './interpolator';
