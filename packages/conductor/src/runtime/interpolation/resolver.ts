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
   * Traverse context using dot-separated path with optional filter chain
   * Supports: input.text | split(' ') | length
   * Note: We check for single pipe (filter) vs double pipe (|| logical OR operator)
   */
  private traversePath(path: string, context: ResolutionContext): unknown {
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
   * Resolve a simple dot-separated property path
   */
  private resolvePropertyPath(path: string, context: ResolutionContext): unknown {
    const parts = path.split('.').map((p) => p.trim())

    let value: unknown = context
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return value
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
