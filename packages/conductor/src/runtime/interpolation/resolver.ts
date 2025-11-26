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
   * - input.name ?? "default" (nullish coalescing - null/undefined only)
   * - input.name || "default" (falsy coalescing - catches "", 0, false too)
   * - input.text | split(' ') | length (filters)
   * Note: We check for single pipe (filter) vs double pipe (|| logical OR)
   */
  private traversePath(path: string, context: ResolutionContext): unknown {
    // First, handle ternary conditional (? :)
    // Match: condition ? trueValue : falseValue
    const ternaryMatch = path.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/)
    if (ternaryMatch) {
      const [, conditionPath, trueExpr, falseExpr] = ternaryMatch
      const condition = this.resolvePathWithFilters(conditionPath.trim(), context)

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
    if (/\|\|/.test(path)) {
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

    // No coalescing operators, check for filters
    return this.resolvePathWithFilters(path, context)
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

    // Try to resolve as a path (may include filters)
    return this.resolvePathWithFilters(expr, context)
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
   */
  private resolvePropertyPath(path: string, context: ResolutionContext): unknown {
    // Handle boolean negation prefix
    let negate = false
    let actualPath = path
    if (path.startsWith('!')) {
      negate = true
      actualPath = path.slice(1).trim()
    }

    // Split by dots, but preserve array indexing
    // "items[0].name" -> ["items[0]", "name"]
    const parts = actualPath.split('.').map((p) => p.trim())

    let value: unknown = context
    for (const part of parts) {
      // Check for array indexing: "items[0]" or just "[0]"
      const arrayMatch = part.match(/^(\w*)\[(\d+)\]$/)
      if (arrayMatch) {
        const [, propName, indexStr] = arrayMatch
        const index = parseInt(indexStr, 10)

        // If there's a property name before the bracket, access it first
        if (propName) {
          if (value && typeof value === 'object' && propName in value) {
            value = (value as Record<string, unknown>)[propName]
          } else {
            return negate ? true : undefined
          }
        }

        // Now access the array index
        if (Array.isArray(value) && index >= 0 && index < value.length) {
          value = value[index]
        } else {
          return negate ? true : undefined
        }
      } else {
        // Regular property access
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part]
        } else {
          return negate ? true : undefined
        }
      }
    }

    return negate ? !value : value
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
