/**
 * Template Filters
 *
 * Provides safe, predefined transformations for template interpolations.
 * Inspired by Liquid/Jinja2/Handlebars filter syntax.
 *
 * Syntax: ${input.text | filter1 | filter2}
 */
/**
 * Built-in filters registry
 */
export const filters = {
    // String filters
    uppercase: (str) => String(str).toUpperCase(),
    lowercase: (str) => String(str).toLowerCase(),
    capitalize: (str) => {
        const s = String(str);
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    },
    trim: (str) => String(str).trim(),
    // Array/String filters
    split: (str, delimiter = ' ') => String(str).split(delimiter),
    join: (arr, delimiter = ', ') => arr.join(delimiter),
    length: (value) => {
        if (typeof value === 'string')
            return value.length;
        if (Array.isArray(value))
            return value.length;
        return 0;
    },
    // Array filters
    first: (arr) => Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined,
    last: (arr) => Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined,
    slice: (arr, start, end) => Array.isArray(arr) ? arr.slice(start, end) : [],
    reverse: (arr) => Array.isArray(arr) ? [...arr].reverse() : [],
    sort: (arr) => Array.isArray(arr) ? [...arr].sort() : [],
    // Number filters
    abs: (num) => Math.abs(Number(num)),
    round: (num) => Math.round(Number(num)),
    floor: (num) => Math.floor(Number(num)),
    ceil: (num) => Math.ceil(Number(num)),
    // Type conversion
    string: (value) => String(value),
    number: (value) => Number(value),
    boolean: (value) => Boolean(value),
    // Object filters
    keys: (obj) => typeof obj === 'object' && obj !== null ? Object.keys(obj) : [],
    values: (obj) => typeof obj === 'object' && obj !== null ? Object.values(obj) : [],
    // Utility filters
    default: (value, defaultValue) => value !== undefined && value !== null ? value : defaultValue,
    json: (value) => JSON.stringify(value),
};
/**
 * Apply a chain of filters to a value
 *
 * @param value - Initial value
 * @param filterChain - Array of filter expressions (e.g., ['split(" ")', 'length'])
 * @returns Transformed value
 */
export function applyFilters(value, filterChain) {
    let result = value;
    for (const filterExpr of filterChain) {
        // Parse filter name and arguments
        // Support: "filterName" or "filterName(arg1, arg2)"
        const match = filterExpr.match(/^(\w+)(?:\((.*)\))?$/);
        if (!match) {
            throw new Error(`Invalid filter syntax: ${filterExpr}`);
        }
        const [, filterName, argsStr] = match;
        const filter = filters[filterName];
        if (!filter) {
            throw new Error(`Unknown filter: ${filterName}`);
        }
        // Parse arguments if present
        const args = [];
        if (argsStr) {
            // Simple argument parsing (handles strings, numbers, booleans)
            // Match: quoted strings (with quotes) OR non-comma/non-whitespace sequences
            const argMatches = argsStr.match(/"[^"]*"|'[^']*'|[^,\s]+/g) || [];
            for (const arg of argMatches) {
                const trimmed = arg.trim();
                // String literal
                if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                    (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                    args.push(trimmed.slice(1, -1));
                }
                // Number
                else if (!isNaN(Number(trimmed))) {
                    args.push(Number(trimmed));
                }
                // Boolean
                else if (trimmed === 'true' || trimmed === 'false') {
                    args.push(trimmed === 'true');
                }
                // Keep as string
                else {
                    args.push(trimmed);
                }
            }
        }
        // Apply filter
        result = filter(result, ...args);
    }
    return result;
}
/**
 * Register a custom filter
 */
export function registerFilter(name, fn) {
    filters[name] = fn;
}
