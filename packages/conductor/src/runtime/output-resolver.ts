/**
 * Output Resolver
 *
 * Resolves conditional output blocks and builds HTTP responses.
 * Supports status codes, headers, redirects, and raw body responses.
 *
 * @module runtime/output-resolver
 */

import {
  type OutputBlock,
  type ResolvedOutput,
  type EnsembleOutput,
  type OutputFormat,
  normalizeOutput,
  getFormatContentType,
  getFormatType,
  getFormatExtract,
} from './output-types.js'
import { Parser } from './parser.js'

// Re-export types for convenience
export type { ResolvedOutput, EnsembleOutput, OutputBlock, OutputFormat } from './output-types.js'
export { getFormatContentType, getFormatType, getFormatExtract } from './output-types.js'

/**
 * Evaluation context for output resolution
 */
export interface OutputEvaluationContext {
  /** Input data */
  input?: unknown
  /** Agent outputs keyed by name */
  [agentName: string]: unknown
}

/**
 * Resolve output blocks against evaluation context
 *
 * Evaluates `when` conditions and returns the first matching block.
 * If no `when` clause is specified, the block always matches (default case).
 *
 * @param output - Output configuration (array of blocks or legacy object)
 * @param context - Evaluation context with agent outputs
 * @returns Resolved output with status, headers, body, etc.
 *
 * @example
 * ```typescript
 * const output = [
 *   { when: '${found}', status: 200, body: { data: '${result}' } },
 *   { status: 404, body: { error: 'not_found' } },
 * ]
 *
 * const resolved = resolveOutput(output, { found: true, result: 'data' })
 * // { status: 200, body: { data: 'data' } }
 * ```
 */
export function resolveOutput(
  output: EnsembleOutput | undefined,
  context: OutputEvaluationContext
): ResolvedOutput {
  // No output defined - return empty success
  if (!output) {
    return { status: 200 }
  }

  // Normalize to array format
  const blocks = normalizeOutput(output)

  // Find first matching block
  for (const block of blocks) {
    // No `when` clause means always match (default case)
    if (!block.when) {
      return resolveOutputBlock(block, context)
    }

    // Evaluate condition
    const condition = evaluateCondition(block.when, context)
    if (condition) {
      return resolveOutputBlock(block, context)
    }
  }

  // No match - return empty success
  return { status: 200 }
}

/**
 * Resolve a single output block by interpolating expressions
 *
 * @param block - Output block to resolve
 * @param context - Evaluation context
 * @returns Resolved output
 */
function resolveOutputBlock(block: OutputBlock, context: OutputEvaluationContext): ResolvedOutput {
  const resolved: ResolvedOutput = {
    status: block.status || 200,
  }

  // Resolve headers (interpolate values)
  if (block.headers) {
    resolved.headers = {}
    for (const [key, value] of Object.entries(block.headers)) {
      resolved.headers[key] = String(Parser.resolveInterpolation(value, context))
    }
  }

  // Handle redirect
  if (block.redirect) {
    // Interpolate status if it's a template string
    let redirectStatus: 301 | 302 | 307 | 308 | undefined = undefined
    if (block.redirect.status !== undefined) {
      const resolvedStatus = Parser.resolveInterpolation(block.redirect.status, context)
      const numStatus = typeof resolvedStatus === 'number' ? resolvedStatus : Number(resolvedStatus)
      if ([301, 302, 307, 308].includes(numStatus)) {
        redirectStatus = numStatus as 301 | 302 | 307 | 308
      }
    }

    resolved.redirect = {
      url: String(Parser.resolveInterpolation(block.redirect.url, context)),
      status: redirectStatus,
    }
    return resolved
  }

  // Handle raw body
  if (block.rawBody !== undefined) {
    resolved.rawBody = String(Parser.resolveInterpolation(block.rawBody, context))
    return resolved
  }

  // Handle JSON body
  if (block.body !== undefined) {
    resolved.body = Parser.resolveInterpolation(block.body, context)
  }

  // Pass through format for triggers (Execute API ignores this)
  if (block.format !== undefined) {
    resolved.format = block.format
  }

  return resolved
}

/**
 * Evaluate a condition expression
 *
 * Supports:
 * - Simple variable access: `${found}`
 * - Equality: `${status} == 'active'`
 * - Inequality: `${status} != 'deleted'`
 * - Boolean expressions: `${agent.output.success}`
 * - Comparisons: `${count} > 0`
 *
 * @param condition - Condition expression string
 * @param context - Evaluation context
 * @returns Boolean result
 */
function evaluateCondition(condition: string, context: OutputEvaluationContext): boolean {
  // Resolve interpolations in the condition
  const resolved = Parser.resolveInterpolation(condition, context)

  // If it's already a boolean, return it
  if (typeof resolved === 'boolean') {
    return resolved
  }

  // If it's a string that looks like a comparison, evaluate it
  if (typeof resolved === 'string') {
    // Handle "true" / "false" strings
    if (resolved === 'true') return true
    if (resolved === 'false') return false

    // Handle comparison operators
    const comparisonMatch = resolved.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/)
    if (comparisonMatch) {
      const [, left, op, right] = comparisonMatch
      return evaluateComparison(left.trim(), op, right.trim())
    }
  }

  // Truthy check
  return Boolean(resolved)
}

/**
 * Evaluate a comparison expression
 */
function evaluateComparison(left: string, op: string, right: string): boolean {
  // Parse values (handle strings, numbers, booleans)
  const leftVal = parseValue(left)
  const rightVal = parseValue(right)

  switch (op) {
    case '==':
      return leftVal === rightVal
    case '!=':
      return leftVal !== rightVal
    case '>':
      return Number(leftVal) > Number(rightVal)
    case '>=':
      return Number(leftVal) >= Number(rightVal)
    case '<':
      return Number(leftVal) < Number(rightVal)
    case '<=':
      return Number(leftVal) <= Number(rightVal)
    default:
      return false
  }
}

/**
 * Parse a string value to its typed form
 */
function parseValue(value: string): string | number | boolean {
  // Remove quotes
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1)
  }

  // Boolean
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return ''

  // Number
  const num = Number(value)
  if (!isNaN(num)) return num

  // String
  return value
}

/**
 * Build an HTTP Response from resolved output
 *
 * This function handles format-based serialization for trigger responses.
 * Execute API ignores the format field and always returns JSON.
 *
 * @param output - Resolved output
 * @param options - Options for response building
 * @param options.ignoreFormat - If true, always return JSON (used by Execute API)
 * @returns HTTP Response
 */
export function buildHttpResponse(
  output: ResolvedOutput,
  options?: { ignoreFormat?: boolean }
): Response {
  const headers = new Headers()

  // Apply custom headers
  if (output.headers) {
    for (const [key, value] of Object.entries(output.headers)) {
      headers.set(key, value)
    }
  }

  // Handle redirect
  if (output.redirect) {
    const status = output.redirect.status || 302
    headers.set('Location', output.redirect.url)
    return new Response(null, { status, headers })
  }

  // Handle raw body
  if (output.rawBody !== undefined) {
    // Set default content-type if not specified
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'text/plain')
    }
    return new Response(output.rawBody, { status: output.status, headers })
  }

  // Handle format-based response (only for triggers, not Execute API)
  if (output.format && !options?.ignoreFormat && output.body !== undefined) {
    return buildFormattedResponse(output, headers)
  }

  // Default: JSON body
  headers.set('Content-Type', 'application/json')
  const body = output.body !== undefined ? JSON.stringify(output.body) : '{}'
  return new Response(body, { status: output.status, headers })
}

/**
 * Build a response using the format specification
 *
 * Handles field extraction and Content-Type mapping based on format.
 */
function buildFormattedResponse(output: ResolvedOutput, headers: Headers): Response {
  const format = output.format!
  const body = output.body as Record<string, unknown>

  // Get Content-Type from format
  const contentType = getFormatContentType(format)

  // Get format type and extract field
  const formatType = getFormatType(format)
  const extractField = getFormatExtract(format)

  // Determine what content to return
  let content: unknown

  if (extractField) {
    // Extract specific field
    content = body[extractField]
    if (content === undefined) {
      // Field not found - return error
      headers.set('Content-Type', 'application/json')
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORMAT_EXTRACTION_FAILED',
            message: `Field '${extractField}' not found in body for format extraction.`,
          },
        }),
        { status: 500, headers }
      )
    }
  } else if (typeof body === 'object' && body !== null) {
    // No extract field - for non-JSON formats, try to find a single field
    const keys = Object.keys(body)
    if (keys.length === 1) {
      content = body[keys[0]]
    } else if (formatType !== 'json') {
      // Multiple fields without extract - error for non-JSON formats
      headers.set('Content-Type', 'application/json')
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FORMAT_EXTRACTION_FAILED',
            message: `Cannot extract single field for format '${formatType}': body has multiple fields (${keys.join(', ')}). Specify format.extract to indicate which field to use.`,
          },
        }),
        { status: 500, headers }
      )
    } else {
      // JSON format with multiple fields - just return the whole body
      content = body
    }
  } else {
    // Body is not an object - use directly
    content = body
  }

  // Serialize based on format type
  let serialized: string
  switch (formatType) {
    case 'json':
      serialized = JSON.stringify(content)
      break
    case 'yaml':
      // Simple YAML serialization for objects
      serialized = serializeToYaml(content)
      break
    case 'csv':
      // Simple CSV serialization
      serialized = serializeToCsv(content)
      break
    default:
      // text, html, xml, markdown, ics, rss, atom - use string value directly
      serialized = String(content)
  }

  // Set Content-Type (can be overridden by custom headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', contentType)
  }

  return new Response(serialized, { status: output.status, headers })
}

/**
 * Simple YAML serialization
 * For complex objects, this is a basic implementation
 */
function serializeToYaml(value: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent)

  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'string') {
    // Check if string needs quoting
    if (value.includes('\n') || value.includes(':') || value.includes('#')) {
      return `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value.map((item) => `${spaces}- ${serializeToYaml(item, indent + 1)}`).join('\n')
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    return entries
      .map(([key, val]) => {
        const serializedVal = serializeToYaml(val, indent + 1)
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return `${spaces}${key}:\n${serializedVal}`
        }
        return `${spaces}${key}: ${serializedVal}`
      })
      .join('\n')
  }

  return String(value)
}

/**
 * Simple CSV serialization
 * Handles arrays of objects or arrays of arrays
 */
function serializeToCsv(value: unknown): string {
  if (!Array.isArray(value)) {
    // Single value - just return it
    return String(value)
  }

  if (value.length === 0) {
    return ''
  }

  const first = value[0]

  // Array of objects - use keys as headers
  if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
    const headers = Object.keys(first)
    const headerRow = headers.map(escapeCsvField).join(',')
    const dataRows = value
      .map((row) => {
        const obj = row as Record<string, unknown>
        return headers.map((h) => escapeCsvField(String(obj[h] ?? ''))).join(',')
      })
      .join('\n')
    return `${headerRow}\n${dataRows}`
  }

  // Array of arrays
  if (Array.isArray(first)) {
    return value
      .map((row) => (row as unknown[]).map((cell) => escapeCsvField(String(cell))).join(','))
      .join('\n')
  }

  // Array of primitives - one per line
  return value.map((v) => escapeCsvField(String(v))).join('\n')
}

/**
 * Escape a CSV field
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Check if output indicates a redirect response
 */
export function isRedirectOutput(output: ResolvedOutput): boolean {
  return output.redirect !== undefined
}

/**
 * Check if output indicates a raw body response
 */
export function isRawBodyOutput(output: ResolvedOutput): boolean {
  return output.rawBody !== undefined
}
