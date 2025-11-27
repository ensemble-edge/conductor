/**
 * Template Registry
 *
 * Provides typed access to HTML/Handlebars templates from KV storage.
 * Templates support versioning and can be rendered with variables.
 *
 * @module components/templates
 */

import type { ComponentRegistry } from './registry.js'
import { parseNameWithVersion } from './registry.js'
import { renderHandlebars } from './prompts.js'

/**
 * HTML/Handlebars template loaded from KV
 */
export interface Template {
  /** Raw template content (HTML/Handlebars) */
  content: string
  /** Template engine to use */
  engine?: 'handlebars' | 'html' | 'liquid'
  /** Optional description */
  description?: string
}

/**
 * Template registry for accessing HTML/Handlebars templates
 *
 * @example
 * ```typescript
 * export default async function(ctx: AgentExecutionContext) {
 *   const { templates } = ctx
 *
 *   // Get a template
 *   const template = await templates.get('email-header@v1.0.0')
 *
 *   // Render with variables
 *   const html = await templates.render('page-layout', {
 *     title: 'Welcome',
 *     content: 'Hello World',
 *   })
 *
 *   return { html }
 * }
 * ```
 */
export class TemplateRegistry {
  constructor(private parent: ComponentRegistry) {}

  /**
   * Get a template by name (with optional @version)
   *
   * @param nameOrRef - Template name with optional version (e.g., "header" or "header@v1.0.0")
   * @returns Template object with content
   *
   * @example
   * templates.get('header')           // header@latest
   * templates.get('header@v1.0.0')    // exact version
   */
  async get(nameOrRef: string): Promise<Template> {
    const { name, version } = parseNameWithVersion(nameOrRef)
    const ref = `templates/${name}@${version}`
    const content = await this.parent.resolve(ref)

    // Handle both raw string and structured object
    if (typeof content === 'string') {
      return { content, engine: 'handlebars' }
    }
    return {
      content: content.content || content.template || String(content),
      engine: content.engine || 'handlebars',
      description: content.description,
    }
  }

  /**
   * Get raw template content as string
   *
   * @param nameOrRef - Template name with optional version
   * @returns Raw template content
   */
  async getContent(nameOrRef: string): Promise<string> {
    const template = await this.get(nameOrRef)
    return template.content
  }

  /**
   * Render a template with variables
   *
   * Uses Handlebars for rendering by default.
   *
   * @param nameOrRef - Template name with optional version
   * @param variables - Variables to substitute in the template
   * @returns Rendered HTML string
   *
   * @example
   * const html = await templates.render('email-template', {
   *   userName: 'John',
   *   orderNumber: '12345',
   * })
   */
  async render(nameOrRef: string, variables: Record<string, unknown>): Promise<string> {
    const template = await this.get(nameOrRef)

    // Use Handlebars rendering (same as prompts)
    if (template.engine === 'handlebars' || !template.engine) {
      return renderHandlebars(template.content, variables)
    }

    // For plain HTML, just return content (no variable substitution)
    if (template.engine === 'html') {
      return template.content
    }

    // Default: Handlebars
    return renderHandlebars(template.content, variables)
  }

  /**
   * Check if a template exists
   *
   * @param nameOrRef - Template name with optional version
   * @returns True if template exists
   */
  async exists(nameOrRef: string): Promise<boolean> {
    try {
      await this.get(nameOrRef)
      return true
    } catch {
      return false
    }
  }
}
