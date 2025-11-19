/**
 * Docs Manager
 *
 * Manages markdown documentation with:
 * - Handlebars template rendering
 * - In-memory caching for performance
 * - Variable substitution
 * - Component reference support (docs://path@version)
 * - File-based auto-loading
 */

import { HandlebarsTemplateEngine } from '../utils/templates/engines/handlebars.js'
import type { TemplateContext } from '../utils/templates/types.js'

export interface DocsTemplate {
  /** Template name (file name without extension) */
  name: string
  /** Markdown content (may contain Handlebars) */
  content: string
  /** Metadata extracted from frontmatter (optional) */
  metadata?: {
    title?: string
    description?: string
    version?: string
    [key: string]: any
  }
}

export interface DocsManagerConfig {
  /** Enable in-memory caching */
  cacheEnabled?: boolean
  /** Enable Handlebars rendering */
  handlebarsEnabled?: boolean
}

export interface RenderOptions {
  /** Variables to inject into template */
  variables?: TemplateContext
  /** Skip Handlebars rendering (return raw markdown) */
  skipHandlebars?: boolean
}

export interface RenderedDocs {
  /** Rendered markdown content */
  content: string
  /** Template metadata */
  metadata?: DocsTemplate['metadata']
}

/**
 * Docs Manager - First-class component support for markdown documentation
 *
 * Works exactly like PromptManager with Handlebars rendering and caching.
 */
export class DocsManager {
  private cache = new Map<string, DocsTemplate>()
  private handlebars: HandlebarsTemplateEngine
  private config: Required<DocsManagerConfig>

  constructor(config: DocsManagerConfig = {}) {
    this.config = {
      cacheEnabled: config.cacheEnabled ?? true,
      handlebarsEnabled: config.handlebarsEnabled ?? true,
    }

    this.handlebars = new HandlebarsTemplateEngine()
  }

  /**
   * Register a docs template in cache
   */
  register(template: DocsTemplate): void {
    const key = template.name
    this.cache.set(key, template)
  }

  /**
   * Get a docs template from cache
   */
  get(name: string): DocsTemplate | null {
    return this.cache.get(name) || null
  }

  /**
   * Check if docs template exists in cache
   */
  has(name: string): boolean {
    return this.cache.has(name)
  }

  /**
   * List all cached docs templates
   */
  list(): Array<{ name: string; title?: string }> {
    return Array.from(this.cache.values()).map((template) => ({
      name: template.name,
      title: template.metadata?.title,
    }))
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Render markdown with Handlebars
   */
  async render(
    template: DocsTemplate,
    options?: RenderOptions
  ): Promise<RenderedDocs> {
    let content = template.content

    // Apply Handlebars rendering if enabled
    if (this.config.handlebarsEnabled && !options?.skipHandlebars) {
      const variables = options?.variables || {}
      content = await this.handlebars.render(content, variables)
    }

    return {
      content,
      metadata: template.metadata,
    }
  }

  /**
   * Render docs by name from cache
   */
  async renderByName(
    name: string,
    options?: RenderOptions
  ): Promise<RenderedDocs> {
    const template = this.get(name)
    if (!template) {
      throw new Error(`Docs template not found: ${name}`)
    }

    return this.render(template, options)
  }

  /**
   * Load docs from markdown string
   *
   * Supports optional YAML frontmatter:
   * ---
   * title: Getting Started
   * description: Quick start guide
   * ---
   * # Content here
   */
  loadFromMarkdown(markdown: string, name: string): DocsTemplate {
    const { content, metadata } = this.parseFrontmatter(markdown)

    const template: DocsTemplate = {
      name,
      content,
      metadata,
    }

    if (this.config.cacheEnabled) {
      this.register(template)
    }

    return template
  }

  /**
   * Parse YAML frontmatter from markdown
   */
  private parseFrontmatter(markdown: string): {
    content: string
    metadata?: Record<string, any>
  } {
    // Check for frontmatter (--- at start)
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
    const match = markdown.match(frontmatterRegex)

    if (!match) {
      return { content: markdown }
    }

    const [, frontmatterYaml, content] = match

    try {
      // Simple YAML parser for frontmatter
      const metadata: Record<string, any> = {}
      const lines = frontmatterYaml.split('\n')

      for (const line of lines) {
        const colonIndex = line.indexOf(':')
        if (colonIndex === -1) continue

        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()

        // Remove quotes
        metadata[key] = value.replace(/^["']|["']$/g, '')
      }

      return { content, metadata }
    } catch (error) {
      console.warn('Failed to parse frontmatter, using raw markdown:', error)
      return { content: markdown }
    }
  }

  /**
   * Register a custom Handlebars helper
   */
  registerHelper(name: string, fn: (...args: any[]) => any): void {
    this.handlebars.registerHelper(name, fn)
  }

  /**
   * Register a Handlebars partial
   */
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template)
  }
}

/**
 * Global docs manager instance
 */
let globalManager: DocsManager | null = null

/**
 * Get or create the global docs manager
 */
export function getGlobalDocsManager(config?: DocsManagerConfig): DocsManager {
  if (!globalManager) {
    globalManager = new DocsManager(config)
  }
  return globalManager
}
