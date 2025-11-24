/**
 * Template Filters
 *
 * Provides safe, predefined transformations for template interpolations.
 * Inspired by Liquid/Jinja2/Handlebars filter syntax.
 *
 * Syntax: ${input.text | filter1 | filter2}
 */

export type FilterFunction = (value: any, ...args: any[]) => any

/**
 * Built-in filters registry
 */
export const filters: Record<string, FilterFunction> = {
  // String filters
  uppercase: (str: string) => String(str).toUpperCase(),
  lowercase: (str: string) => String(str).toLowerCase(),
  capitalize: (str: string) => {
    const s = String(str)
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  },
  trim: (str: string) => String(str).trim(),

  // Array/String filters
  split: (str: string, delimiter: string = ' ') => String(str).split(delimiter),
  join: (arr: any[], delimiter: string = ', ') => arr.join(delimiter),
  length: (value: string | any[]) => {
    if (typeof value === 'string') return value.length
    if (Array.isArray(value)) return value.length
    return 0
  },

  // Array filters
  first: (arr: any[]) => (Array.isArray(arr) && arr.length > 0 ? arr[0] : undefined),
  last: (arr: any[]) => (Array.isArray(arr) && arr.length > 0 ? arr[arr.length - 1] : undefined),
  slice: (arr: any[], start: number, end?: number) =>
    Array.isArray(arr) ? arr.slice(start, end) : [],
  reverse: (arr: any[]) => (Array.isArray(arr) ? [...arr].reverse() : []),
  sort: (arr: any[]) => (Array.isArray(arr) ? [...arr].sort() : []),

  // Number filters
  abs: (num: number) => Math.abs(Number(num)),
  round: (num: number) => Math.round(Number(num)),
  floor: (num: number) => Math.floor(Number(num)),
  ceil: (num: number) => Math.ceil(Number(num)),

  // Type conversion
  string: (value: any) => String(value),
  number: (value: any) => Number(value),
  boolean: (value: any) => Boolean(value),

  // Object filters
  keys: (obj: any) => (typeof obj === 'object' && obj !== null ? Object.keys(obj) : []),
  values: (obj: any) => (typeof obj === 'object' && obj !== null ? Object.values(obj) : []),

  // Utility filters
  default: (value: any, defaultValue: any) =>
    value !== undefined && value !== null ? value : defaultValue,
  json: (value: any) => JSON.stringify(value),
}

/**
 * Apply a chain of filters to a value
 *
 * @param value - Initial value
 * @param filterChain - Array of filter expressions (e.g., ['split(" ")', 'length'])
 * @returns Transformed value
 */
export function applyFilters(value: any, filterChain: string[]): any {
  let result = value

  for (const filterExpr of filterChain) {
    // Parse filter name and arguments
    // Support: "filterName" or "filterName(arg1, arg2)"
    const match = filterExpr.match(/^(\w+)(?:\((.*)\))?$/)

    if (!match) {
      throw new Error(`Invalid filter syntax: ${filterExpr}`)
    }

    const [, filterName, argsStr] = match
    const filter = filters[filterName]

    if (!filter) {
      throw new Error(`Unknown filter: ${filterName}`)
    }

    // Parse arguments if present
    const args: any[] = []
    if (argsStr) {
      // Simple argument parsing (handles strings, numbers, booleans)
      // Match: quoted strings (with quotes) OR non-comma/non-whitespace sequences
      const argMatches = argsStr.match(/"[^"]*"|'[^']*'|[^,\s]+/g) || []
      for (const arg of argMatches) {
        const trimmed = arg.trim()

        // String literal
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          args.push(trimmed.slice(1, -1))
        }
        // Number
        else if (!isNaN(Number(trimmed))) {
          args.push(Number(trimmed))
        }
        // Boolean
        else if (trimmed === 'true' || trimmed === 'false') {
          args.push(trimmed === 'true')
        }
        // Keep as string
        else {
          args.push(trimmed)
        }
      }
    }

    // Apply filter
    result = filter(result, ...args)
  }

  return result
}

/**
 * Register a custom filter
 */
export function registerFilter(name: string, fn: FilterFunction): void {
  filters[name] = fn
}
