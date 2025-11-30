/**
 * Output Types for Ensemble Response Handling
 *
 * Defines types for conditional outputs, custom status codes,
 * redirects, custom headers, raw body responses, and output formats.
 *
 * @module runtime/output-types
 */
import { z } from 'zod';
/**
 * Supported output format types with their default Content-Type mappings
 */
export declare const FORMAT_CONTENT_TYPES: Record<string, string>;
/**
 * Valid format type strings
 */
export type FormatType = keyof typeof FORMAT_CONTENT_TYPES;
/**
 * Extended format configuration object
 */
export interface FormatConfig {
    /** Format type (determines default Content-Type) */
    type: FormatType;
    /** Field to extract from body (for multi-field bodies) */
    extract?: string;
    /** Override default Content-Type */
    contentType?: string;
}
/**
 * Output format - either a string shorthand or full config object
 */
export type OutputFormat = FormatType | FormatConfig;
/**
 * Get Content-Type for a format specification
 */
export declare function getFormatContentType(format: OutputFormat): string;
/**
 * Get the format type from a format specification
 */
export declare function getFormatType(format: OutputFormat): FormatType;
/**
 * Get the extract field from a format specification
 */
export declare function getFormatExtract(format: OutputFormat): string | undefined;
/**
 * Zod schema for format type strings
 */
export declare const FormatTypeSchema: z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>;
/**
 * Zod schema for format config object
 */
export declare const FormatConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>;
    extract: z.ZodOptional<z.ZodString>;
    contentType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
    contentType?: string | undefined;
    extract?: string | undefined;
}, {
    type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
    contentType?: string | undefined;
    extract?: string | undefined;
}>;
/**
 * Zod schema for output format (string or object)
 */
export declare const OutputFormatSchema: z.ZodUnion<[z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>, z.ZodObject<{
    type: z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>;
    extract: z.ZodOptional<z.ZodString>;
    contentType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
    contentType?: string | undefined;
    extract?: string | undefined;
}, {
    type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
    contentType?: string | undefined;
    extract?: string | undefined;
}>]>;
/**
 * HTTP redirect configuration
 */
export interface RedirectOutput {
    /** Target URL to redirect to */
    url: string;
    /** HTTP status code (301, 302, 307, 308) or template string that evaluates to one */
    status?: 301 | 302 | 307 | 308 | string;
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
    /**
     * Output format for triggers (determines Content-Type and serialization)
     *
     * String shorthand: 'text', 'html', 'xml', 'json', etc.
     * Object form: { type: 'html', extract: 'content' } for field extraction
     *
     * Note: format is ONLY used by triggers. Execute API always returns JSON.
     */
    format?: OutputFormat;
}
/**
 * Resolved redirect configuration (after interpolation)
 */
export interface ResolvedRedirectOutput {
    /** Target URL to redirect to */
    url: string;
    /** HTTP status code (301, 302, 307, 308) - resolved from template */
    status?: 301 | 302 | 307 | 308;
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
    /** Redirect configuration (after interpolation) */
    redirect?: ResolvedRedirectOutput;
    /** Output format for triggers (passed through from OutputBlock) */
    format?: OutputFormat;
}
/**
 * Schema for redirect output
 *
 * Note: `status` can be a literal number OR a template string that evaluates to a number.
 * Template strings (e.g., "${{ agent.output.statusCode }}") are interpolated at runtime.
 */
export declare const RedirectOutputSchema: z.ZodObject<{
    url: z.ZodString;
    status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    status?: string | 301 | 302 | 307 | 308 | undefined;
}, {
    url: string;
    status?: string | 301 | 302 | 307 | 308 | undefined;
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
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>, z.ZodString]>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    }, {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    }>>;
    format: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>, z.ZodObject<{
        type: z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>;
        extract: z.ZodOptional<z.ZodString>;
        contentType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
    }, {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
    }>]>>;
}, "strip", z.ZodTypeAny, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    } | undefined;
    format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
    } | undefined;
}, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    } | undefined;
    format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
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
        status: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<301>, z.ZodLiteral<302>, z.ZodLiteral<307>, z.ZodLiteral<308>, z.ZodString]>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    }, {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    }>>;
    format: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>, z.ZodObject<{
        type: z.ZodEnum<["json", "text", "html", "xml", "csv", "markdown", "yaml", "ics", "rss", "atom"]>;
        extract: z.ZodOptional<z.ZodString>;
        contentType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
    }, {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
    }>]>>;
}, "strip", z.ZodTypeAny, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    } | undefined;
    format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
    } | undefined;
}, {
    status?: number | undefined;
    when?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: unknown;
    rawBody?: string | undefined;
    redirect?: {
        url: string;
        status?: string | 301 | 302 | 307 | 308 | undefined;
    } | undefined;
    format?: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom" | {
        type: "json" | "html" | "text" | "xml" | "csv" | "markdown" | "yaml" | "ics" | "rss" | "atom";
        contentType?: string | undefined;
        extract?: string | undefined;
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
export declare function normalizeOutput(output: EnsembleOutput): OutputBlock[];
//# sourceMappingURL=output-types.d.ts.map