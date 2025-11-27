/**
 * Output Types for Ensemble Response Handling
 *
 * Defines types for conditional outputs, custom status codes,
 * redirects, custom headers, and raw body responses.
 *
 * @module runtime/output-types
 */
import { z } from 'zod';
/**
 * HTTP redirect configuration
 */
export interface RedirectOutput {
    /** Target URL to redirect to */
    url: string;
    /** HTTP status code (301, 302, 307, 308) */
    status?: 301 | 302 | 307 | 308;
}
/**
 * Single output block with optional condition
 */
export interface OutputBlock {
    /** Condition expression - if omitted, block always matches (default case) */
    when?: string;
    /** HTTP status code (default: 200) */
    status?: number;
    /** Response headers */
    headers?: Record<string, string>;
    /** JSON body (will be serialized) */
    body?: unknown;
    /** Raw string body (bypasses JSON serialization) */
    rawBody?: string;
    /** HTTP redirect (mutually exclusive with body/rawBody) */
    redirect?: RedirectOutput;
}
/**
 * Resolved output after condition evaluation
 */
export interface ResolvedOutput {
    /** HTTP status code */
    status: number;
    /** Response headers */
    headers?: Record<string, string>;
    /** JSON body */
    body?: unknown;
    /** Raw string body */
    rawBody?: string;
    /** Redirect configuration */
    redirect?: RedirectOutput;
}
/**
 * Schema for redirect output
 */
export declare const RedirectOutputSchema: z.ZodObject<{
    url: z.ZodString;
    status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>]>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    status?: 301 | 302 | 307 | 308 | undefined;
}, {
    url: string;
    status?: 301 | 302 | 307 | 308 | undefined;
}>;
/**
 * Schema for a single output block
 */
export declare const OutputBlockSchema: z.ZodObject<{
    when: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNumber>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodUnknown>;
    rawBody: z.ZodOptional<z.ZodString>;
    redirect: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>]>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    }, {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    } | undefined;
}, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    } | undefined;
}>;
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
export declare const EnsembleOutputSchema: z.ZodUnion<[z.ZodArray<z.ZodObject<{
    when: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNumber>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodUnknown>;
    rawBody: z.ZodOptional<z.ZodString>;
    redirect: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>]>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    }, {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    } | undefined;
}, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: 301 | 302 | 307 | 308 | undefined;
    } | undefined;
}>, "many">, z.ZodRecord<z.ZodString, z.ZodUnknown>]>;
/**
 * Type for ensemble output (union of array and legacy object)
 */
export type EnsembleOutput = OutputBlock[] | Record<string, unknown>;
/**
 * Check if output is in the new conditional format (array of blocks)
 */
export declare function isConditionalOutput(output: EnsembleOutput): output is OutputBlock[];
/**
 * Normalize legacy output format to conditional format
 *
 * Converts `{ result: ${foo} }` to `[{ body: { result: ${foo} } }]`
 */
export declare function normalizeOutput(output: EnsembleOutput): OutputBlock[];
//# sourceMappingURL=output-types.d.ts.map