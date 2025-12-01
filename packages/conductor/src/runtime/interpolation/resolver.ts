/**
 * Interpolation Resolver System
 *
 * Chain of responsibility pattern for resolving template values.
 * Each resolver handles a specific type of interpolation.
 */

/**
 * Path segment representation for optional chaining support
 */
interface PathSegment {
  name: string
  optional: boolean
  arrayIndex?: number
}

/**
 * Resolution context containing available values
 */
export interface ResolutionContext {
  [key: string]: unknown
}

/**
 * Interpolation Resolver interface
 * Each resolver decides if it can handle the template, then resolves it
 */
export interface InterpolationResolver {
  /**
   * Check if this resolver can handle the template
   */
  canResolve(template: unknown): boolean

  /**
   * Resolve the template to its final value
   */
  resolve(
    template: unknown,
    context: ResolutionContext,
    interpolate: (t: unknown, c: ResolutionContext) => unknown
  ): unknown
}

import { applyFilters } from './filters.js'

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
 * Supports ternary conditionals with comparison operators:
 * - ${input.enabled ? "yes" : "no"} → returns "yes" if truthy, "no" otherwise
 * - ${input.path == '/docs' ? "landing" : "other"} → equality comparison in condition
 * - ${input.count > 10 ? "many" : "few"} → numeric comparison in condition
 * - ${input.name != null && input.age >= 18 ? "valid" : "invalid"} → logical AND with comparisons
 *
 * Supports comparison operators in ternary conditions:
 * - == and != (loose equality)
 * - === and !== (strict equality)
 * - >, <, >=, <= (numeric comparison)
 * - && and || (logical AND/OR)
 *
 * Supports string method calls in conditions:
 * - ${input.path.includes('/api/') ? "api" : "other"} → string includes check
 * - ${input.url.startsWith('https') ? "secure" : "insecure"} → string prefix check
 * - ${input.file.endsWith('.json') ? "json" : "other"} → string suffix check
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
export class StringResolver implements InterpolationResolver {
  private readonly fullPatternDollar = /^\$\{([^}]*)\}$/ // YAML: ${...}
  private readonly fullPatternHandlebar = /^\{\{([^}]*)\}\}$/ // Templates: {{...}}
  private readonly hasInterpolationPattern = /(\$\{[^}]*\}|\{\{[^}]*\}\})/ // Either syntax

  canResolve(template: unknown): boolean {
    if (typeof template !== 'string') return false
    return (
      this.fullPatternDollar.test(template) ||
      this.fullPatternHandlebar.test(template) ||
      this.hasInterpolationPattern.test(template)
    )
  }

  resolve(
    template: string,
    context: ResolutionContext,
    interpolate: (t: unknown, c: ResolutionContext) => unknown
  ): unknown {
    // Case 1: Full replacement - entire string is ${...} or {{...}}
    // Returns the value as-is (could be any type)
    const dollarMatch = template.match(this.fullPatternDollar)
    const handlebarMatch = template.match(this.fullPatternHandlebar)
    const fullMatch = dollarMatch || handlebarMatch

    if (fullMatch) {
      const path = fullMatch[1].trim()

      // Handle empty path
      if (!path) {
        return undefined
      }

      return this.traversePath(path, context)
    }

    // Case 2: Partial interpolation - string contains ${...} or {{...}}
    // Returns a string with all interpolations replaced
    const result = template.replace(
      /(\$\{([^}]*)\}|\{\{([^}]*)\}\})/g,
      (match, _full, dollarPath, handlebarPath) => {
        const path = dollarPath !== undefined ? dollarPath : handlebarPath
        const trimmedPath = path.trim()

        // Empty path becomes empty string
        if (!trimmedPath) {
          return ''
        }

        const value = this.traversePath(trimmedPath, context)

        // If value is undefined, keep original ${...} or {{...}} in string
        // Otherwise convert value to string
        return value !== undefined ? String(value) : match
      }
    )

    return result
  }

  /**
   * Traverse context using dot-separated path with optional operators and filter chain
   * Supports (in order of precedence):
   * - input.enabled ? "yes" : "no" (ternary conditional)
   * - input.path == '/docs' ? "landing" : "other" (ternary with equality comparison)
   * - input.name ?? "default" (nullish coalescing - null/undefined only)
   * - input.name || "default" (falsy coalescing - catches "", 0, false too)
   * - input.text | split(' ') | length (filters)
   * Note: We check for single pipe (filter) vs double pipe (|| logical OR)
   */
  private traversePath(path: string, context: ResolutionContext): unknown {
    // First, handle ternary conditional (? :)
    // Match: condition ? trueValue : falseValue
    // Use negative lookbehind to NOT match ?. (optional chaining)
    // The ? must be followed by a space or non-dot character to be a ternary operator
    const ternaryMatch = path.match(/^(.+?)\s*\?(?!\.)\s*(.+?)\s*:\s*(.+)$/)
    if (ternaryMatch) {
      const [, conditionExpr, trueExpr, falseExpr] = ternaryMatch
      // Evaluate the condition - may include comparison operators
      const condition = this.evaluateCondition(conditionExpr.trim(), context)

      // Evaluate the appropriate branch
      const selectedExpr = condition ? trueExpr.trim() : falseExpr.trim()
      return this.resolveLiteralOrPath(selectedExpr, context)
    }

    // Handle nullish coalescing (??) - split and try each alternative
    if (path.includes('??')) {
      const alternatives = path.split('??').map((alt) => alt.trim())

      for (const alt of alternatives) {
        const value = this.resolveLiteralOrPath(alt, context)

        // Return first non-null/undefined value (nullish coalescing behavior)
        if (value !== null && value !== undefined) {
          return value
        }
      }

      // All alternatives were null/undefined
      return undefined
    }

    // Handle falsy coalescing (||) - similar to ?? but catches all falsy values
    // Must check this AFTER ?? to avoid conflicts, and ensure we don't confuse with filter |
    // Only treat as || if not part of a comparison expression
    if (/\|\|/.test(path) && !this.hasComparisonOperator(path)) {
      const alternatives = path.split('||').map((alt) => alt.trim())

      for (const alt of alternatives) {
        const value = this.resolveLiteralOrPath(alt, context)

        // Return first truthy value (falsy coalescing behavior)
        if (value) {
          return value
        }
      }

      // All alternatives were falsy, return last one
      const lastAlt = alternatives[alternatives.length - 1]
      return this.resolveLiteralOrPath(lastAlt, context)
    }

    // Handle standalone comparison expressions (not in a ternary)
    // This allows ${input.path == '/docs'} to return true/false
    if (this.hasComparisonOperator(path)) {
      return this.evaluateCondition(path, context)
    }

    // No coalescing or comparison operators, check for filters
    return this.resolvePathWithFilters(path, context)
  }

  /**
   * Check if an expression contains comparison operators
   * Used to detect expressions like "input.path == '/docs'" that should be evaluated as conditions
   */
  private hasComparisonOperator(expr: string): boolean {
    // Check for comparison operators (must be careful about string literals)
    // Look for patterns like: value == 'string', value != other, value > 10
    // Using word boundary-like patterns to avoid false positives
    return (
      /\s*(===|!==|==|!=|>=|<=|>|<|&&)\s*/.test(expr) ||
      // Also check for string method calls that return boolean
      /\.includes\(/.test(expr) ||
      /\.startsWith\(/.test(expr) ||
      /\.endsWith\(/.test(expr)
    )
  }

  /**
   * Evaluate a condition expression which may include comparison operators
   * Supports: ==, !=, ===, !==, >, <, >=, <=, &&, ||
   * Also supports string method calls like includes()
   */
  private evaluateCondition(expr: string, context: ResolutionContext): boolean {
    // Check for && (logical AND) - lowest precedence, evaluate left to right
    if (expr.includes('&&')) {
      const parts = expr.split('&&').map((p) => p.trim())
      return parts.every((part) => this.evaluateCondition(part, context))
    }

    // Check for logical || in condition (not to be confused with falsy coalescing)
    // This pattern looks for || that's part of a boolean expression
    if (/\s*\|\|\s*/.test(expr) && !expr.includes('?')) {
      const parts = expr.split(/\s*\|\|\s*/).map((p) => p.trim())
      return parts.some((part) => this.evaluateCondition(part, context))
    }

    // Handle string method calls like input.path.includes('/agents/')
    const includesMatch = expr.match(/^(.+?)\.includes\(\s*(['"])(.+?)\2\s*\)$/)
    if (includesMatch) {
      const [, pathExpr, , searchStr] = includesMatch
      const value = this.resolvePathWithFilters(pathExpr.trim(), context)
      if (typeof value === 'string') {
        return value.includes(searchStr)
      }
      return false
    }

    // Handle string method startsWith
    const startsWithMatch = expr.match(/^(.+?)\.startsWith\(\s*(['"])(.+?)\2\s*\)$/)
    if (startsWithMatch) {
      const [, pathExpr, , prefix] = startsWithMatch
      const value = this.resolvePathWithFilters(pathExpr.trim(), context)
      if (typeof value === 'string') {
        return value.startsWith(prefix)
      }
      return false
    }

    // Handle string method endsWith
    const endsWithMatch = expr.match(/^(.+?)\.endsWith\(\s*(['"])(.+?)\2\s*\)$/)
    if (endsWithMatch) {
      const [, pathExpr, , suffix] = endsWithMatch
      const value = this.resolvePathWithFilters(pathExpr.trim(), context)
      if (typeof value === 'string') {
        return value.endsWith(suffix)
      }
      return false
    }

    // Check for comparison operators (in order of specificity)
    // === and !== (strict equality)
    const strictEqMatch = expr.match(/^(.+?)\s*(===|!==)\s*(.+)$/)
    if (strictEqMatch) {
      const [, leftExpr, op, rightExpr] = strictEqMatch
      const leftValue = this.resolveLiteralOrPath(leftExpr.trim(), context)
      const rightValue = this.resolveLiteralOrPath(rightExpr.trim(), context)
      return op === '===' ? leftValue === rightValue : leftValue !== rightValue
    }

    // == and != (loose equality)
    const eqMatch = expr.match(/^(.+?)\s*(==|!=)\s*(.+)$/)
    if (eqMatch) {
      const [, leftExpr, op, rightExpr] = eqMatch
      const leftValue = this.resolveLiteralOrPath(leftExpr.trim(), context)
      const rightValue = this.resolveLiteralOrPath(rightExpr.trim(), context)
      // eslint-disable-next-line eqeqeq
      return op === '==' ? leftValue == rightValue : leftValue != rightValue
    }

    // >= and <= (comparison)
    const compEqMatch = expr.match(/^(.+?)\s*(>=|<=)\s*(.+)$/)
    if (compEqMatch) {
      const [, leftExpr, op, rightExpr] = compEqMatch
      const leftValue = this.resolveLiteralOrPath(leftExpr.trim(), context) as number
      const rightValue = this.resolveLiteralOrPath(rightExpr.trim(), context) as number
      return op === '>=' ? leftValue >= rightValue : leftValue <= rightValue
    }

    // > and < (comparison)
    const compMatch = expr.match(/^(.+?)\s*([><])\s*(.+)$/)
    if (compMatch) {
      const [, leftExpr, op, rightExpr] = compMatch
      const leftValue = this.resolveLiteralOrPath(leftExpr.trim(), context) as number
      const rightValue = this.resolveLiteralOrPath(rightExpr.trim(), context) as number
      return op === '>' ? leftValue > rightValue : leftValue < rightValue
    }

    // No comparison operator found - resolve as truthy/falsy value
    const value = this.resolvePathWithFilters(expr, context)
    return Boolean(value)
  }

  /**
   * Resolve a value that could be a literal or a path expression
   */
  private resolveLiteralOrPath(expr: string, context: ResolutionContext): unknown {
    // Check if this is a string literal (quoted)
    const stringLiteralMatch = expr.match(/^["'](.*)["']$/)
    if (stringLiteralMatch) {
      return stringLiteralMatch[1]
    }

    // Check if this is a numeric literal
    const numericMatch = expr.match(/^-?\d+(\.\d+)?$/)
    if (numericMatch) {
      return parseFloat(expr)
    }

    // Check if this is a boolean literal
    if (expr === 'true') return true
    if (expr === 'false') return false

    // Check if this is null literal
    if (expr === 'null') return null

    // Use traversePath to handle nested ternaries, comparisons, and filters
    return this.traversePath(expr, context)
  }

  /**
   * Resolve a path that may include filter chains
   */
  private resolvePathWithFilters(path: string, context: ResolutionContext): unknown {
    // Check if path contains filter syntax (single pipe character, not ||)
    // Use a regex to find single pipes that aren't part of ||
    const hasSinglePipe = /(?<!\|)\|(?!\|)/.test(path)

    if (hasSinglePipe) {
      // Split by single pipes only (not ||)
      const parts = path.split(/(?<!\|)\|(?!\|)/)
      const propertyPath = parts[0].trim()

      // Get the initial value
      let value = this.resolvePropertyPath(propertyPath, context)

      // Apply filter chain if present
      if (parts.length > 1) {
        const filterChain = parts
          .slice(1)
          .map((f) => f.trim())
          .filter((f) => f.length > 0)
        if (filterChain.length > 0) {
          value = applyFilters(value, filterChain)
        }
      }

      return value
    }

    // No filters, just resolve property path
    return this.resolvePropertyPath(path, context)
  }

  /**
   * Resolve a simple dot-separated property path with support for:
   * - Array indexing: items[0], items[2].name
   * - Boolean negation: !input.disabled
   * - Optional chaining: input.user?.name, input.items?.[0]
   */
  private resolvePropertyPath(path: string, context: ResolutionContext): unknown {
    // Handle boolean negation prefix
    let negate = false
    let actualPath = path
    if (path.startsWith('!')) {
      negate = true
      actualPath = path.slice(1).trim()
    }

    // Parse path into segments with optional chaining support
    const segments = this.parsePathSegments(actualPath)

    let value: unknown = context
    for (const segment of segments) {
      // If value is null/undefined and this access is optional, return undefined
      if (value === null || value === undefined) {
        if (segment.optional) {
          return negate ? true : undefined
        }
        // Non-optional access on null/undefined
        return negate ? true : undefined
      }

      // Handle array indexing: segment has arrayIndex
      if (segment.arrayIndex !== undefined) {
        // If there's a property name before the bracket, access it first
        if (segment.name) {
          if (typeof value === 'object' && segment.name in value) {
            value = (value as Record<string, unknown>)[segment.name]
          } else {
            return negate ? true : undefined
          }

          // Check if value became null/undefined after property access
          if (value === null || value === undefined) {
            return negate ? true : undefined
          }
        }

        // Now access the array index
        if (Array.isArray(value) && segment.arrayIndex >= 0 && segment.arrayIndex < value.length) {
          value = value[segment.arrayIndex]
        } else {
          return negate ? true : undefined
        }
      } else {
        // Regular property access
        if (typeof value === 'object' && segment.name in value) {
          value = (value as Record<string, unknown>)[segment.name]
        } else {
          return negate ? true : undefined
        }
      }
    }

    return negate ? !value : value
  }

  /**
   * Parse a path string into segments, handling optional chaining (?.)
   *
   * Examples:
   * - "input.name" → [{name: "input", optional: false}, {name: "name", optional: false}]
   * - "input?.name" → [{name: "input", optional: false}, {name: "name", optional: true}]
   * - "items[0]" → [{name: "items", optional: false, arrayIndex: 0}]
   * - "items?.[0]" → [{name: "items", optional: false}, {name: "", optional: true, arrayIndex: 0}]
   */
  private parsePathSegments(path: string): PathSegment[] {
    const segments: PathSegment[] = []

    // Split by both . and ?. while preserving the optional marker
    // We need to handle: a.b, a?.b, a[0], a?.[0]
    let remaining = path.trim()

    while (remaining.length > 0) {
      let optional = false

      // Check if this segment starts with ?. (optional chaining from previous)
      if (remaining.startsWith('?.')) {
        optional = true
        remaining = remaining.slice(2)
      } else if (remaining.startsWith('.') && segments.length > 0) {
        // Regular dot separator (skip if first segment)
        remaining = remaining.slice(1)
      }

      // Check for standalone array access: [0] or ?.[0]
      const standaloneArrayMatch = remaining.match(/^\[(\d+)\]/)
      if (standaloneArrayMatch) {
        segments.push({
          name: '',
          optional,
          arrayIndex: parseInt(standaloneArrayMatch[1], 10),
        })
        remaining = remaining.slice(standaloneArrayMatch[0].length)
        continue
      }

      // Match property name with optional array index: "items[0]" or "items"
      // Property names can include letters, digits, underscores, and hyphens (e.g., "scrape-primary")
      const propMatch = remaining.match(/^([\w-]+)(?:\[(\d+)\])?/)
      if (propMatch) {
        const [fullMatch, propName, indexStr] = propMatch
        segments.push({
          name: propName,
          optional,
          arrayIndex: indexStr !== undefined ? parseInt(indexStr, 10) : undefined,
        })
        remaining = remaining.slice(fullMatch.length)
      } else {
        // Couldn't parse - break to avoid infinite loop
        break
      }
    }

    return segments
  }
}

/**
 * Resolves arrays by recursively resolving each item
 */
export class ArrayResolver implements InterpolationResolver {
  canResolve(template: unknown): boolean {
    return Array.isArray(template)
  }

  resolve(
    template: unknown[],
    context: ResolutionContext,
    interpolate: (t: unknown, c: ResolutionContext) => unknown
  ): unknown {
    return template.map((item) => interpolate(item, context))
  }
}

/**
 * Resolves objects by recursively resolving each property
 */
export class ObjectResolver implements InterpolationResolver {
  canResolve(template: unknown): boolean {
    return typeof template === 'object' && template !== null && !Array.isArray(template)
  }

  resolve(
    template: Record<string, unknown>,
    context: ResolutionContext,
    interpolate: (t: unknown, c: ResolutionContext) => unknown
  ): unknown {
    const resolved: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(template)) {
      resolved[key] = interpolate(value, context)
    }
    return resolved
  }
}

/**
 * Passthrough resolver for primitives (numbers, booleans, null)
 */
export class PassthroughResolver implements InterpolationResolver {
  canResolve(template: unknown): boolean {
    return true // Handles everything else
  }

  resolve(
    template: unknown,
    context: ResolutionContext,
    interpolate: (t: unknown, c: ResolutionContext) => unknown
  ): unknown {
    return template
  }
}
