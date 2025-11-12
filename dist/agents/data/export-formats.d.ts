/**
 * Data export format utilities
 *
 * Support for CSV, JSON, and Excel exports with streaming for large datasets
 */
/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'ndjson';
/**
 * Export options
 */
export interface ExportOptions {
    /** Export format */
    format: ExportFormat;
    /** Include headers (CSV/Excel) */
    headers?: boolean;
    /** Custom field names/order */
    fields?: string[];
    /** Pretty print JSON */
    pretty?: boolean;
    /** CSV delimiter */
    delimiter?: string;
    /** Excel sheet name */
    sheetName?: string;
    /** Streaming mode for large datasets */
    streaming?: boolean;
    /** Batch size for streaming */
    batchSize?: number;
}
/**
 * Export result
 */
export interface ExportResult {
    /** Exported data (string for non-streaming, ReadableStream for streaming) */
    data: string | ReadableStream<Uint8Array>;
    /** Content type */
    contentType: string;
    /** File extension */
    extension: string;
    /** Size in bytes (if known) */
    size?: number;
    /** Is streaming */
    streaming: boolean;
}
/**
 * Export data to specified format
 */
export declare function exportData(data: unknown[], options: ExportOptions): Promise<ExportResult>;
/**
 * Create streaming export
 */
export declare function createStreamingExport(dataSource: AsyncIterable<unknown[]>, options: ExportOptions): ExportResult;
//# sourceMappingURL=export-formats.d.ts.map