/**
 * Prompt Parser
 *
 * Handles template variable substitution with Handlebars-style syntax.
 * Supports:
 * - Simple variables: {{name}}
 * - Nested properties: {{user.email}}
 * - Array access: {{items[0]}}
 * - Conditional blocks: {{#if condition}}...{{/if}}
 * - Loop blocks: {{#each items}}...{{/each}}
 */

export interface ParserOptions {
  strict?: boolean // Throw error on missing variables
  escapeHtml?: boolean // Escape HTML in substituted values
  allowUndefined?: boolean // Allow undefined variables (replace with empty string)
}

export class PromptParser {
  private defaultOptions: Required<ParserOptions> = {
    strict: false,
    escapeHtml: false,
    allowUndefined: true,
  }

  constructor(private options: ParserOptions = {}) {
    this.options = { ...this.defaultOptions, ...options }
  }

  /**
   * Parse and substitute variables in template
   */
  parse(template: string, variables: Record<string, unknown>, options?: ParserOptions): string {
    const opts: Required<ParserOptions> = {
      ...this.defaultOptions,
      ...this.options,
      ...options,
    }
    let result = template

    // Handle conditional blocks first
    result = this.parseConditionals(result, variables, opts)

    // Handle loop blocks
    result = this.parseLoops(result, variables, opts)

    // Handle simple variable substitution
    result = this.parseVariables(result, variables, opts)

    return result
  }

  /**
   * Parse simple variable substitution: {{name}}
   */
  private parseVariables(
    template: string,
    variables: Record<string, unknown>,
    options: Required<ParserOptions>
  ): string {
    const regex = /\{\{([^#/][^}]*)\}\}/g

    return template.replace(regex, (match, varPath) => {
      const trimmedPath = varPath.trim()
      const value = this.resolveVariable(trimmedPath, variables)

      if (value === undefined || value === null) {
        if (options.strict && !options.allowUndefined) {
          throw new Error(`Variable not found: ${trimmedPath}`)
        }
        return options.allowUndefined ? '' : match
      }

      const stringValue = String(value)
      return options.escapeHtml ? this.escapeHtml(stringValue) : stringValue
    })
  }

  /**
   * Parse conditional blocks: {{#if condition}}...{{/if}}
   */
  private parseConditionals(
    template: string,
    variables: Record<string, unknown>,
    options: Required<ParserOptions>
  ): string {
    const regex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g

    return template.replace(regex, (match, condition, content) => {
      const conditionValue = this.resolveVariable(condition.trim(), variables)
      const isTruthy = this.isTruthy(conditionValue)

      return isTruthy ? content : ''
    })
  }

  /**
   * Parse loop blocks: {{#each items}}...{{/each}}
   */
  private parseLoops(
    template: string,
    variables: Record<string, unknown>,
    options: Required<ParserOptions>
  ): string {
    const regex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g

    return template.replace(regex, (match, arrayPath, content) => {
      const array = this.resolveVariable(arrayPath.trim(), variables)

      if (!Array.isArray(array)) {
        if (options.strict) {
          throw new Error(`Variable "${arrayPath}" is not an array`)
        }
        return ''
      }

      return array
        .map((item, index) => {
          // Create context with item and index
          const itemContext = {
            ...variables,
            this: item,
            index: index,
            first: index === 0,
            last: index === array.length - 1,
          }

          // Parse content with item context
          return this.parseVariables(content, itemContext, options)
        })
        .join('')
    })
  }

  /**
   * Resolve variable path (supports nested properties and array access)
   */
  private resolveVariable(path: string, variables: Record<string, unknown>): unknown {
    // Handle 'this' keyword
    if (path === 'this') {
      return variables.this
    }

    // Split path by dots and brackets
    const parts = path.split(/[.\[\]]+/).filter((p) => p.length > 0)

    let value: unknown = variables
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined
      }

      // Type guard: value must be an object or array to access properties
      if (typeof value !== 'object') {
        return undefined
      }

      // Handle numeric indices
      const index = parseInt(part, 10)
      if (!isNaN(index) && Array.isArray(value)) {
        value = value[index]
      } else if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Check if value is truthy
   */
  private isTruthy(value: unknown): boolean {
    if (value === undefined || value === null) {
      return false
    }

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value !== 0
    }

    if (typeof value === 'string') {
      return value.length > 0
    }

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0
    }

    return true
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }

    return text.replace(/[&<>"']/g, (char) => map[char])
  }

  /**
   * Extract all variable paths from template
   */
  static extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = regex.exec(template)) !== null) {
      const varPath = match[1].trim()
      // Skip helpers (if, each, etc.)
      if (!varPath.startsWith('#') && !varPath.startsWith('/')) {
        variables.add(varPath)
      }
    }

    return Array.from(variables)
  }
}

/**
 * Convenience function to parse a template
 */
export function parseTemplate(
  template: string,
  variables: Record<string, unknown>,
  options?: ParserOptions
): string {
  const parser = new PromptParser(options)
  return parser.parse(template, variables)
}
