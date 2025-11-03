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
export declare class StringResolver implements InterpolationResolver {
    private readonly fullPattern;
    private readonly hasInterpolationPattern;
    canResolve(template: unknown): boolean;
    resolve(template: string, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown;
    /**
     * Traverse context using dot-separated path
     */
    private traversePath;
}
/**
 * Resolves arrays by recursively resolving each item
 */
export declare class ArrayResolver implements InterpolationResolver {
    canResolve(template: unknown): boolean;
    resolve(template: unknown[], context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown;
}
/**
 * Resolves objects by recursively resolving each property
 */
export declare class ObjectResolver implements InterpolationResolver {
    canResolve(template: unknown): boolean;
    resolve(template: Record<string, unknown>, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown;
}
/**
 * Passthrough resolver for primitives (numbers, booleans, null)
 */
export declare class PassthroughResolver implements InterpolationResolver {
    canResolve(template: unknown): boolean;
    resolve(template: unknown): unknown;
}
//# sourceMappingURL=resolver.d.ts.map