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
 * Resolves string interpolations supporting two syntaxes:
 * - YAML syntax: ${input.x}, ${state.y} - used in YAML configuration files
 * - Template syntax: {{input.x}}, {{state.y}} - used in Handlebars/Liquid templates
 *
 * Supports both full replacement and partial interpolation:
 * - Full: '${input.name}' or '{{input.name}}' → returns value as-is (any type)
 * - Partial: 'Hello ${input.name}!' or 'Hello {{input.name}}!' → returns interpolated string
 *
 * Supports optional chaining (?.):
 * - ${input.user?.name} → returns undefined if user is null/undefined, else name
 * - ${input.data?.items?.[0]} → safe navigation through nested optional paths
 *
 * Supports nullish coalescing (??):
 * - ${input.name ?? "default"} → returns input.name if not null/undefined, else "default"
 * - ${input.query.name ?? input.body.name ?? "World"} → chain of fallbacks
 *
 * Supports falsy coalescing (||):
 * - ${input.name || "default"} → returns input.name if truthy, else "default"
 * - Catches "", 0, false, null, undefined (unlike ?? which only catches null/undefined)
 *
 * Supports ternary conditionals:
 * - ${input.enabled ? "yes" : "no"} → returns "yes" if truthy, "no" otherwise
 *
 * Supports boolean negation (!):
 * - ${!input.disabled} → returns true if input.disabled is falsy
 *
 * Supports array indexing:
 * - ${input.items[0]} → returns first element
 * - ${input.items[2].name} → returns name property of third element
 * - ${input.items?.[0]} → optional array access (returns undefined if items is null/undefined)
 *
 * Supports filter chains:
 * - ${input.text | uppercase}
 * - ${input.text | split(" ") | length}
 * - ${input.items | first | default("none")}
 */
export declare class StringResolver implements InterpolationResolver {
    private readonly fullPatternDollar;
    private readonly fullPatternHandlebar;
    private readonly hasInterpolationPattern;
    canResolve(template: unknown): boolean;
    resolve(template: string, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown;
    /**
     * Traverse context using dot-separated path with optional operators and filter chain
     * Supports (in order of precedence):
     * - input.enabled ? "yes" : "no" (ternary conditional)
     * - input.name ?? "default" (nullish coalescing - null/undefined only)
     * - input.name || "default" (falsy coalescing - catches "", 0, false too)
     * - input.text | split(' ') | length (filters)
     * Note: We check for single pipe (filter) vs double pipe (|| logical OR)
     */
    private traversePath;
    /**
     * Resolve a value that could be a literal or a path expression
     */
    private resolveLiteralOrPath;
    /**
     * Resolve a path that may include filter chains
     */
    private resolvePathWithFilters;
    /**
     * Resolve a simple dot-separated property path with support for:
     * - Array indexing: items[0], items[2].name
     * - Boolean negation: !input.disabled
     * - Optional chaining: input.user?.name, input.items?.[0]
     */
    private resolvePropertyPath;
    /**
     * Parse a path string into segments, handling optional chaining (?.)
     *
     * Examples:
     * - "input.name" → [{name: "input", optional: false}, {name: "name", optional: false}]
     * - "input?.name" → [{name: "input", optional: false}, {name: "name", optional: true}]
     * - "items[0]" → [{name: "items", optional: false, arrayIndex: 0}]
     * - "items?.[0]" → [{name: "items", optional: false}, {name: "", optional: true, arrayIndex: 0}]
     */
    private parsePathSegments;
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
    resolve(template: unknown, context: ResolutionContext, interpolate: (t: unknown, c: ResolutionContext) => unknown): unknown;
}
//# sourceMappingURL=resolver.d.ts.map