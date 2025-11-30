/**
 * Output Types for Ensemble Response Handling
 *
 * Defines types for conditional outputs, custom status codes,
 * redirects, custom headers, raw body responses, and output formats.
 *
 * @module runtime/output-types
 */

import { z } from 'zod'

// ============================================================================
// Output Format Types
// ============================================================================

/**
 * Supported output format types with their default Content-Type mappings
 */
export const FORMAT_CONTENT_TYPES: Record<string, string> = {
  json: 'application/json',
  text: 'text/plain',
  html: 'text/html',
  xml: 'application/xml',
  csv: 'text/csv',
  markdown: 'text/markdown',
  yaml: 'application/x-yaml',
  ics: 'text/calendar',
  rss: 'application/rss+xml',
  atom: 'application/atom+xml',
}

/**
 * Valid format type strings
 */
export type FormatType = keyof typeof FORMAT_CONTENT_TYPES

/**
 * Extended format configuration object
 */
export interface FormatConfig {
  /** Format type (determines default Content-Type) */
  type: FormatType
  /** Field to extract from body (for multi-field bodies) */
  extract?: string
  /** Override default Content-Type */
  contentType?: string
}

/**
 * Output format - either a string shorthand or full config object
 */
export type OutputFormat = FormatType | FormatConfig

/**
 * Get Content-Type for a format specification
 */
export function getFormatContentType(format: OutputFormat): string {
  if (typeof format === 'string') {
    return FORMAT_CONTENT_TYPES[format] ?? 'application/octet-stream'
  }
  return format.contentType ?? FORMAT_CONTENT_TYPES[format.type] ?? 'application/octet-stream'
}

/**
 * Get the format type from a format specification
 */
export function getFormatType(format: OutputFormat): FormatType {
  if (typeof format === 'string') {
    return format as FormatType
  }
  return format.type as FormatType
}

/**
 * Get the extract field from a format specification
 */
export function getFormatExtract(format: OutputFormat): string | undefined {
  if (typeof format === 'string') {
    return undefined
  }
  return format.extract
}

// ============================================================================
// Output Format Schemas
// ============================================================================

/**
 * Zod schema for format type strings
 */
export const FormatTypeSchema = z.enum([
  'json',
  'text',
  'html',
  'xml',
  'csv',
  'markdown',
  'yaml',
  'ics',
  'rss',
  'atom',
])

/**
 * Zod schema for format config object
 */
export const FormatConfigSchema = z.object({
  type: FormatTypeSchema,
  extract: z.string().optional(),
  contentType: z.string().optional(),
})

/**
 * Zod schema for output format (string or object)
 */
export const OutputFormatSchema = z.union([FormatTypeSchema, FormatConfigSchema])

// ============================================================================
// Redirect Types
// ============================================================================

/**
 * HTTP redirect configuration
 */
export interface RedirectOutput {
  /** Target URL to redirect to */
  url: string
  /** HTTP status code (301, 302, 307, 308) or template string that evaluates to one */
  status?: 301 | 302 | 307 | 308 | string
}

/**
 * Single output block with optional condition
 */
export interface OutputBlock {
  /** Condition expression - if omitted, block always matches (default case) */
  when?: string

  /** HTTP status code (default: 200) */
  status?: number

  /** Response headers */
  headers?: Record<string, string>

  /** JSON body (will be serialized) */
  body?: unknown

  /** Raw string body (bypasses JSON serialization) */
  rawBody?: string

  /** HTTP redirect (mutually exclusive with body/rawBody) */
  redirect?: RedirectOutput

  /**
   * Output format for triggers (determines Content-Type and serialization)
   *
   * String shorthand: 'text', 'html', 'xml', 'json', etc.
   * Object form: { type: 'html', extract: 'content' } for field extraction
   *
   * Note: format is ONLY used by triggers. Execute API always returns JSON.
   */
  format?: OutputFormat
}

/**
 * Resolved redirect configuration (after interpolation)
 */
export interface ResolvedRedirectOutput {
  /** Target URL to redirect to */
  url: string
  /** HTTP status code (301, 302, 307, 308) - resolved from template */
  status?: 301 | 302 | 307 | 308
}

/**
 * Resolved output after condition evaluation
 */
export interface ResolvedOutput {
  /** HTTP status code */
  status: number

  /** Response headers */
  headers?: Record<string, string>

  /** JSON body */
  body?: unknown

  /** Raw string body */
  rawBody?: string

  /** Redirect configuration (after interpolation) */
  redirect?: ResolvedRedirectOutput

  /** Output format for triggers (passed through from OutputBlock) */
  format?: OutputFormat
}

/**
 * Schema for redirect output
 *
 * Note: `status` can be a literal number OR a template string that evaluates to a number.
 * Template strings (e.g., "${{ agent.output.statusCode }}") are interpolated at runtime.
 */
export const RedirectOutputSchema = z.object({
  url: z.string(),
  status: z
    .union([
      // Literal redirect status codes
      z.literal(301),
      z.literal(302),
      z.literal(307),
      z.literal(308),
      // Template string that evaluates to a status code at runtime
      z.string(),
    ])
    .optional(),
})

/**
 * Schema for a single output block
 */
export const OutputBlockSchema = z.object({
  when: z.string().optional(),
  status: z.number().int().min(100).max(599).optional(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  rawBody: z.string().optional(),
  redirect: RedirectOutputSchema.optional(),
  format: OutputFormatSchema.optional(),
})

/**
 * Schema for the output field - supports both legacy object and new array format
 *
 * Legacy format (still supported):
 * ```yaml
 * output:
 *   result: ${agent.output}
 * ```
 *
 * New conditional format:
 * ```yaml
 * output:
 *   - when: ${found}
 *     status: 200
 *     body: { data: ${result} }
 *   - status: 404
 *     body: { error: "not_found" }
 * ```
 */
export const EnsembleOutputSchema = z.union([
  // New: Array of conditional output blocks
  z.array(OutputBlockSchema),
  // Legacy: Simple object output (will be wrapped as body)
  z.record(z.unknown()),
])

/**
 * Type for ensemble output (union of array and legacy object)
 */
export type EnsembleOutput = OutputBlock[] | Record<string, unknown>

/**
 * Check if output is in the new conditional format (array of blocks)
 */
export function isConditionalOutput(output: EnsembleOutput): output is OutputBlock[] {
  return Array.isArray(output)
}

/**
 * Known OutputBlock keys - used to detect if an object is an OutputBlock
 */
const OUTPUT_BLOCK_KEYS = new Set(['when', 'status', 'headers', 'body', 'rawBody', 'redirect', 'format'])

/**
 * Check if an object looks like an OutputBlock (has OutputBlock-specific keys)
 *
 * Returns true if the object has at least one key that is specific to OutputBlock
 * and no keys that aren't valid OutputBlock keys.
 */
function isOutputBlockLike(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj)
  if (keys.length === 0) return false

  // Must have at least one OutputBlock-specific key
  const hasOutputBlockKey = keys.some((k) => OUTPUT_BLOCK_KEYS.has(k))
  if (!hasOutputBlockKey) return false

  // All keys must be valid OutputBlock keys
  return keys.every((k) => OUTPUT_BLOCK_KEYS.has(k))
}

/**
 * Normalize legacy output format to conditional format
 *
 * Supports three formats:
 * 1. Array format: [{ status: 200, body: {...} }] - returned as-is
 * 2. Single OutputBlock format: { status: 200, body: {...} } - wrapped in array
 * 3. Legacy format: { result: ${foo} } - wrapped as body in a single block
 *
 * @example
 * // Array format (returned as-is)
 * normalizeOutput([{ status: 200, body: { ok: true } }])
 * // => [{ status: 200, body: { ok: true } }]
 *
 * @example
 * // Single OutputBlock format (wrapped in array)
 * normalizeOutput({ status: 200, body: { pong: true } })
 * // => [{ status: 200, body: { pong: true } }]
 *
 * @example
 * // Legacy format (wrapped as body)
 * normalizeOutput({ result: '${foo}' })
 * // => [{ body: { result: '${foo}' } }]
 */
export function normalizeOutput(output: EnsembleOutput): OutputBlock[] {
  if (isConditionalOutput(output)) {
    return output
  }

  // Check if this looks like a single OutputBlock (has body, status, headers, etc.)
  if (isOutputBlockLike(output)) {
    return [output as OutputBlock]
  }

  // Legacy format - wrap as body in a single block
  return [{ body: output }]
}
