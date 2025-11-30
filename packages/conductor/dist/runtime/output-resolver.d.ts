/**
 * Output Resolver
 *
 * Resolves conditional output blocks and builds HTTP responses.
 * Supports status codes, headers, redirects, and raw body responses.
 *
 * @module runtime/output-resolver
 */
import { type ResolvedOutput, type EnsembleOutput } from './output-types.js';
export type { ResolvedOutput, EnsembleOutput, OutputBlock, OutputFormat } from './output-types.js';
export { getFormatContentType, getFormatType, getFormatExtract } from './output-types.js';
/**
 * Evaluation context for output resolution
 */
export interface OutputEvaluationContext {
    /** Input data */
    input?: unknown;
    /** Agent outputs keyed by name */
    [agentName: string]: unknown;
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
export declare function resolveOutput(output: EnsembleOutput | undefined, context: OutputEvaluationContext): ResolvedOutput;
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
export declare function buildHttpResponse(output: ResolvedOutput, options?: {
    ignoreFormat?: boolean;
}): Response;
/**
 * Check if output indicates a redirect response
 */
export declare function isRedirectOutput(output: ResolvedOutput): boolean;
/**
 * Check if output indicates a raw body response
 */
export declare function isRawBodyOutput(output: ResolvedOutput): boolean;
//# sourceMappingURL=output-resolver.d.ts.map