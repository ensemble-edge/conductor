/**
 * Convert Agent
 *
 * Document format conversion agent for transforming between HTML, Markdown, DOCX, PDF, and text formats.
 * All libraries used are Workers-compatible with no Node.js dependencies.
 *
 * Supported conversions:
 * - html → markdown (turndown with GFM support)
 * - markdown → html (marked)
 * - markdown → frontmatter (gray-matter)
 * - html → text (built-in tag stripping)
 * - docx → markdown/html (mammoth, dynamic import)
 * - pdf → text (unpdf, dynamic import)
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import TurndownService from 'turndown'
// @ts-expect-error - turndown-plugin-gfm has no type declarations
import { gfm } from 'turndown-plugin-gfm'
import { marked } from 'marked'
import matter from 'gray-matter'
import type { AgentConfig } from '../../runtime/parser.js'
import type {
  ConvertConfig,
  ConvertOutput,
  FrontmatterResult,
  TurndownOptions,
  PdfOptions,
} from './types/index.js'

/**
 * Set of supported conversion paths
 */
const SUPPORTED_CONVERSIONS = new Set([
  'html→markdown',
  'html→text',
  'markdown→html',
  'markdown→frontmatter',
  'docx→markdown',
  'docx→html',
  'pdf→text',
])

export class ConvertAgent extends BaseAgent {
  private convertConfig: ConvertConfig

  constructor(config: AgentConfig) {
    super(config)
    this.convertConfig = (config.config as ConvertConfig) || {}
  }

  /**
   * Execute the conversion
   */
  protected async run(context: AgentExecutionContext): Promise<ConvertOutput> {
    // Merge static config with runtime config
    const config: ConvertConfig = {
      ...this.convertConfig,
      ...(context.config as Partial<ConvertConfig>),
    }

    const { input, from, to } = config

    // Validate required fields
    if (input === undefined || input === null) {
      throw new Error('convert: config.input is required')
    }

    if (!from) {
      throw new Error('convert: config.from is required')
    }

    if (!to) {
      throw new Error('convert: config.to is required')
    }

    // Validate conversion is supported
    const conversionKey = `${from}→${to}`
    if (!SUPPORTED_CONVERSIONS.has(conversionKey)) {
      const supported = [...SUPPORTED_CONVERSIONS].join(', ')
      throw new Error(`convert: unsupported conversion ${from} → ${to}. Supported: ${supported}`)
    }

    // Handle empty input gracefully
    if (typeof input === 'string' && input.trim() === '') {
      return to === 'frontmatter' ? { frontmatter: {}, content: '' } : ''
    }

    // Route to appropriate converter
    switch (conversionKey) {
      case 'html→markdown':
        return this.htmlToMarkdown(input as string, config.turndown)

      case 'html→text':
        return this.htmlToText(input as string)

      case 'markdown→html':
        return this.markdownToHtml(input as string, config.marked)

      case 'markdown→frontmatter':
        return this.markdownToFrontmatter(input as string)

      case 'docx→markdown':
        return this.docxToMarkdown(input as ArrayBuffer, config.mammoth)

      case 'docx→html':
        return this.docxToHtml(input as ArrayBuffer, config.mammoth)

      case 'pdf→text':
        return this.pdfToText(input as ArrayBuffer, config.pdf)

      default:
        throw new Error(`convert: unhandled conversion ${conversionKey}`)
    }
  }

  /**
   * Convert HTML to Markdown using Turndown
   */
  private htmlToMarkdown(html: string, options?: TurndownOptions): string {
    const turndownOptions: TurndownService.Options = {
      headingStyle: options?.headingStyle || 'atx',
      codeBlockStyle: options?.codeBlockStyle || 'fenced',
      bulletListMarker: options?.bulletListMarker || '-',
      emDelimiter: options?.emDelimiter || '_',
      strongDelimiter: options?.strongDelimiter || '**',
      linkStyle: options?.linkStyle || 'inlined',
    }

    const turndown = new TurndownService(turndownOptions)

    // Enable GFM plugin by default (tables, strikethrough, etc.)
    if (options?.gfm !== false) {
      turndown.use(gfm)
    }

    try {
      return turndown.turndown(html)
    } catch (error) {
      // Fallback to plain text extraction if HTML parsing fails
      const text = this.htmlToText(html)
      return text
    }
  }

  /**
   * Convert HTML to plain text (strip tags)
   */
  private htmlToText(html: string): string {
    return (
      html
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove style tags and content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove all HTML tags
        .replace(/<[^>]+>/g, ' ')
        // Decode common HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim()
    )
  }

  /**
   * Convert Markdown to HTML using Marked
   */
  private async markdownToHtml(
    markdown: string,
    options?: ConvertConfig['marked']
  ): Promise<string> {
    const markedOptions = {
      gfm: options?.gfm !== false, // Default to true
      breaks: options?.breaks || false,
    }

    // marked.parse returns Promise<string> in v17+
    const result = await marked.parse(markdown, markedOptions)
    return result
  }

  /**
   * Extract frontmatter from Markdown using gray-matter
   */
  private markdownToFrontmatter(markdown: string): FrontmatterResult {
    const { data, content } = matter(markdown)
    return {
      frontmatter: data,
      content: content.trim(),
    }
  }

  /**
   * Convert DOCX to Markdown using Mammoth (dynamic import)
   * Note: Mammoth doesn't have native markdown export, so we convert to HTML first
   * then use turndown to convert to markdown.
   */
  private async docxToMarkdown(
    arrayBuffer: ArrayBuffer,
    options?: ConvertConfig['mammoth']
  ): Promise<string> {
    // First convert DOCX to HTML
    const html = await this.docxToHtml(arrayBuffer, options)
    // Then convert HTML to Markdown using turndown
    return this.htmlToMarkdown(html)
  }

  /**
   * Convert DOCX to HTML using Mammoth (dynamic import)
   */
  private async docxToHtml(
    arrayBuffer: ArrayBuffer,
    _options?: ConvertConfig['mammoth']
  ): Promise<string> {
    // Validate input type
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error(
        'convert: DOCX input must be an ArrayBuffer (use storage operation to read the file)'
      )
    }

    if (arrayBuffer.byteLength === 0) {
      throw new Error('convert: empty DOCX file provided')
    }

    try {
      // Dynamic import to avoid loading mammoth unless needed
      const mammoth = await import('mammoth')
      const result = await mammoth.convertToHtml({ arrayBuffer })
      return result.value
    } catch (error) {
      if ((error as Error).message?.includes('Cannot find module')) {
        throw new Error(
          'convert: mammoth library not available. Ensure mammoth is installed for DOCX conversion.'
        )
      }
      throw new Error(`convert: DOCX conversion failed: ${(error as Error).message}`)
    }
  }

  /**
   * Extract text from PDF using unpdf (dynamic import)
   *
   * unpdf is designed specifically for Cloudflare Workers compatibility.
   * It's a serverless-friendly redistribution of PDF.js.
   */
  private async pdfToText(input: ArrayBuffer, options?: PdfOptions): Promise<string> {
    // Validate input type
    if (!(input instanceof ArrayBuffer)) {
      throw new Error(
        'convert: PDF input must be an ArrayBuffer (use storage operation to read the file)'
      )
    }

    if (input.byteLength === 0) {
      throw new Error('convert: empty PDF file provided')
    }

    try {
      // Dynamic import to avoid loading unpdf unless needed
      const { extractText, getDocumentProxy } = await import('unpdf')

      // Get the document
      const pdf = await getDocumentProxy(new Uint8Array(input))

      // Extract text from all pages
      const { text: pageTexts } = await extractText(pdf, { mergePages: false })

      // Merge pages or return as array
      const mergePages = options?.mergePages !== false // Default to true
      const pageSeparator = options?.pageSeparator ?? '\n\n'

      if (mergePages) {
        return pageTexts.join(pageSeparator)
      }

      // Return as joined text even if not merged (for string output type)
      return pageTexts.join(pageSeparator)
    } catch (error) {
      if ((error as Error).message?.includes('Cannot find module')) {
        throw new Error(
          'convert: unpdf library not available. Ensure unpdf is installed for PDF text extraction.'
        )
      }
      throw new Error(`convert: PDF extraction failed: ${(error as Error).message}`)
    }
  }
}
