/**
 * Convert Agent Types
 *
 * Configuration and output types for document format conversion.
 */

/**
 * Supported source formats
 */
export type ConvertFromFormat = 'html' | 'markdown' | 'docx' | 'pdf' | 'text'

/**
 * Supported target formats
 */
export type ConvertToFormat = 'html' | 'markdown' | 'text' | 'frontmatter'

/**
 * PDF extraction options (unpdf)
 */
export interface PdfOptions {
  /** Merge all page text into a single string (default: true) */
  mergePages?: boolean
  /** Separator between pages when merged (default: '\n\n') */
  pageSeparator?: string
}

/**
 * Turndown options for HTML to Markdown conversion
 */
export interface TurndownOptions {
  /** Heading style: 'setext' uses underlines, 'atx' uses # symbols (default: 'atx') */
  headingStyle?: 'setext' | 'atx'
  /** Code block style: 'indented' or 'fenced' with ``` (default: 'fenced') */
  codeBlockStyle?: 'indented' | 'fenced'
  /** Bullet list marker character (default: '-') */
  bulletListMarker?: '-' | '+' | '*'
  /** Emphasis delimiter (default: '_') */
  emDelimiter?: '_' | '*'
  /** Strong emphasis delimiter (default: '**') */
  strongDelimiter?: '__' | '**'
  /** Link style: 'inlined' or 'referenced' (default: 'inlined') */
  linkStyle?: 'inlined' | 'referenced'
  /** Enable GFM plugin for tables and strikethrough (default: true) */
  gfm?: boolean
}

/**
 * Marked options for Markdown to HTML conversion
 */
export interface MarkedOptions {
  /** Enable GitHub Flavored Markdown (default: true) */
  gfm?: boolean
  /** Convert newlines to <br> tags (default: false) */
  breaks?: boolean
  /** Add id attributes to heading tags (default: false) */
  headerIds?: boolean
  /** Mangle email addresses in autolinks (default: true) */
  mangle?: boolean
}

/**
 * Mammoth options for DOCX conversion
 */
export interface MammothOptions {
  /** Custom style mappings for Word styles */
  styleMap?: string[]
  /** Include default style mappings (default: true) */
  includeDefaultStyleMap?: boolean
}

/**
 * Convert agent configuration
 */
export interface ConvertConfig {
  /** Input content to convert */
  input?: unknown

  /** Source format */
  from?: ConvertFromFormat

  /** Target format */
  to?: ConvertToFormat

  /** Options for HTML to Markdown conversion (turndown) */
  turndown?: TurndownOptions

  /** Options for Markdown to HTML conversion (marked) */
  marked?: MarkedOptions

  /** Options for DOCX conversion (mammoth) */
  mammoth?: MammothOptions

  /** Options for PDF text extraction (unpdf) */
  pdf?: PdfOptions
}

/**
 * Frontmatter extraction result
 */
export interface FrontmatterResult {
  /** Parsed frontmatter data (YAML/JSON) */
  frontmatter: Record<string, unknown>
  /** Markdown content without frontmatter */
  content: string
}

/**
 * Convert agent output type
 * - String for text conversions (html, markdown, text)
 * - FrontmatterResult for frontmatter extraction
 */
export type ConvertOutput = string | FrontmatterResult
