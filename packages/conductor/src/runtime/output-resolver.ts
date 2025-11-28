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
  normalizeOutput,
} from './output-types.js'
import { Parser } from './parser.js'

// Re-export types for convenience
export type { ResolvedOutput, EnsembleOutput, OutputBlock } from './output-types.js'

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
    resolved.redirect = {
      url: String(Parser.resolveInterpolation(block.redirect.url, context)),
      status: block.redirect.status,
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
 * @param output - Resolved output
 * @param c - Hono context (optional, for redirect helper)
 * @returns HTTP Response
 */
export function buildHttpResponse(output: ResolvedOutput): Response {
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

  // Handle JSON body
  headers.set('Content-Type', 'application/json')
  const body = output.body !== undefined ? JSON.stringify(output.body) : '{}'
  return new Response(body, { status: output.status, headers })
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
