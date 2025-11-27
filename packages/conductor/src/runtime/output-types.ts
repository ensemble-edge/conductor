/**
 * Output Types for Ensemble Response Handling
 *
 * Defines types for conditional outputs, custom status codes,
 * redirects, custom headers, and raw body responses.
 *
 * @module runtime/output-types
 */

import { z } from 'zod'

/**
 * HTTP redirect configuration
 */
export interface RedirectOutput {
  /** Target URL to redirect to */
  url: string
  /** HTTP status code (301, 302, 307, 308) */
  status?: 301 | 302 | 307 | 308
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

  /** Redirect configuration */
  redirect?: RedirectOutput
}

/**
 * Schema for redirect output
 */
export const RedirectOutputSchema = z.object({
  url: z.string(),
  status: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).optional(),
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
 * Normalize legacy output format to conditional format
 *
 * Converts `{ result: ${foo} }` to `[{ body: { result: ${foo} } }]`
 */
export function normalizeOutput(output: EnsembleOutput): OutputBlock[] {
  if (isConditionalOutput(output)) {
    return output
  }

  // Legacy format - wrap as body in a single block
  return [{ body: output }]
}
