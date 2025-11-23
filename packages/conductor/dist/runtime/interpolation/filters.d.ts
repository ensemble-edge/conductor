/**
 * Template Filters
 *
 * Provides safe, predefined transformations for template interpolations.
 * Inspired by Liquid/Jinja2/Handlebars filter syntax.
 *
 * Syntax: ${input.text | filter1 | filter2}
 */
export type FilterFunction = (value: any, ...args: any[]) => any;
/**
 * Built-in filters registry
 */
export declare const filters: Record<string, FilterFunction>;
/**
 * Apply a chain of filters to a value
 *
 * @param value - Initial value
 * @param filterChain - Array of filter expressions (e.g., ['split(" ")', 'length'])
 * @returns Transformed value
 */
export declare function applyFilters(value: any, filterChain: string[]): any;
/**
 * Register a custom filter
 */
export declare function registerFilter(name: string, fn: FilterFunction): void;
//# sourceMappingURL=filters.d.ts.map