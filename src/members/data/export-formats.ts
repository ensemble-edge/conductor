/**
 * Data export format utilities
 *
 * Support for CSV, JSON, and Excel exports with streaming for large datasets
 */

/**
 * Export format types
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'ndjson'

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat
  /** Include headers (CSV/Excel) */
  headers?: boolean
  /** Custom field names/order */
  fields?: string[]
  /** Pretty print JSON */
  pretty?: boolean
  /** CSV delimiter */
  delimiter?: string
  /** Excel sheet name */
  sheetName?: string
  /** Streaming mode for large datasets */
  streaming?: boolean
  /** Batch size for streaming */
  batchSize?: number
}

/**
 * Export result
 */
export interface ExportResult {
  /** Exported data (string for non-streaming, ReadableStream for streaming) */
  data: string | ReadableStream<Uint8Array>
  /** Content type */
  contentType: string
  /** File extension */
  extension: string
  /** Size in bytes (if known) */
  size?: number
  /** Is streaming */
  streaming: boolean
}

/**
 * Export data to specified format
 */
export async function exportData(data: unknown[], options: ExportOptions): Promise<ExportResult> {
  switch (options.format) {
    case 'csv':
      return exportToCSV(data, options)
    case 'json':
      return exportToJSON(data, options)
    case 'ndjson':
      return exportToNDJSON(data, options)
    case 'xlsx':
      return exportToExcel(data, options)
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

/**
 * Export to CSV
 */
function exportToCSV(data: unknown[], options: ExportOptions): ExportResult {
  const delimiter = options.delimiter || ','
  const includeHeaders = options.headers !== false

  if (data.length === 0) {
    return {
      data: '',
      contentType: 'text/csv',
      extension: 'csv',
      size: 0,
      streaming: false,
    }
  }

  // Get fields
  const fields = options.fields || Object.keys(data[0] as Record<string, unknown>)

  const lines: string[] = []

  // Headers
  if (includeHeaders) {
    lines.push(fields.map((f) => escapeCsvValue(f, delimiter)).join(delimiter))
  }

  // Rows
  for (const row of data) {
    const rowData = row as Record<string, unknown>
    const values = fields.map((field) => {
      const value = rowData[field]
      return escapeCsvValue(String(value ?? ''), delimiter)
    })
    lines.push(values.join(delimiter))
  }

  const csv = lines.join('\n')

  return {
    data: csv,
    contentType: 'text/csv',
    extension: 'csv',
    size: new Blob([csv]).size,
    streaming: false,
  }
}

/**
 * Export to JSON
 */
function exportToJSON(data: unknown[], options: ExportOptions): ExportResult {
  const json = options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)

  return {
    data: json,
    contentType: 'application/json',
    extension: 'json',
    size: new Blob([json]).size,
    streaming: false,
  }
}

/**
 * Export to NDJSON (newline-delimited JSON)
 */
function exportToNDJSON(data: unknown[], options: ExportOptions): ExportResult {
  const lines = data.map((item) => JSON.stringify(item))
  const ndjson = lines.join('\n')

  return {
    data: ndjson,
    contentType: 'application/x-ndjson',
    extension: 'ndjson',
    size: new Blob([ndjson]).size,
    streaming: false,
  }
}

/**
 * Export to Excel (simplified - just CSV with different content type)
 * In production, use a library like ExcelJS
 */
function exportToExcel(data: unknown[], options: ExportOptions): ExportResult {
  // For now, use CSV format with Excel content type
  // In production, implement proper XLSX generation
  const csv = exportToCSV(data, options)

  return {
    ...csv,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
  }
}

/**
 * Escape CSV value
 */
function escapeCsvValue(value: string, delimiter: string): string {
  // Quote if contains delimiter, newline, or quote
  if (value.includes(delimiter) || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Create streaming export
 */
export function createStreamingExport(
  dataSource: AsyncIterable<unknown[]>,
  options: ExportOptions
): ExportResult {
  let isFirst = true
  let fields: string[] = []

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const batch of dataSource) {
          if (batch.length === 0) continue

          // Get fields from first batch
          if (isFirst) {
            fields = options.fields || Object.keys(batch[0] as Record<string, unknown>)

            // Write headers for CSV
            if (options.format === 'csv' && options.headers !== false) {
              const delimiter = options.delimiter || ','
              const headerLine =
                fields.map((f) => escapeCsvValue(f, delimiter)).join(delimiter) + '\n'
              controller.enqueue(encoder.encode(headerLine))
            }

            // Write JSON array start
            if (options.format === 'json') {
              controller.enqueue(encoder.encode('[\n'))
            }

            isFirst = false
          }

          // Write batch
          const chunk = formatBatch(batch, fields, options, isFirst)
          controller.enqueue(encoder.encode(chunk))
        }

        // Write JSON array end
        if (options.format === 'json') {
          controller.enqueue(encoder.encode('\n]'))
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return {
    data: stream,
    contentType: getContentType(options.format),
    extension: getExtension(options.format),
    streaming: true,
  }
}

/**
 * Format batch for streaming
 */
function formatBatch(
  batch: unknown[],
  fields: string[],
  options: ExportOptions,
  isFirst: boolean
): string {
  switch (options.format) {
    case 'csv':
      return formatCsvBatch(batch, fields, options.delimiter || ',')

    case 'json':
      return formatJsonBatch(batch, isFirst)

    case 'ndjson':
      return formatNdjsonBatch(batch)

    default:
      return ''
  }
}

/**
 * Format CSV batch
 */
function formatCsvBatch(batch: unknown[], fields: string[], delimiter: string): string {
  const lines: string[] = []

  for (const row of batch) {
    const rowData = row as Record<string, unknown>
    const values = fields.map((field) => {
      const value = rowData[field]
      return escapeCsvValue(String(value ?? ''), delimiter)
    })
    lines.push(values.join(delimiter))
  }

  return lines.join('\n') + '\n'
}

/**
 * Format JSON batch
 */
function formatJsonBatch(batch: unknown[], isFirst: boolean): string {
  const items = batch.map((item, index) => {
    const json = JSON.stringify(item, null, 2)
    const prefix = isFirst && index === 0 ? '  ' : ',\n  '
    return prefix + json
  })

  return items.join('')
}

/**
 * Format NDJSON batch
 */
function formatNdjsonBatch(batch: unknown[]): string {
  return batch.map((item) => JSON.stringify(item)).join('\n') + '\n'
}

/**
 * Get content type for format
 */
function getContentType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv'
    case 'json':
      return 'application/json'
    case 'ndjson':
      return 'application/x-ndjson'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Get file extension for format
 */
function getExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    case 'ndjson':
      return 'ndjson'
    case 'xlsx':
      return 'xlsx'
    default:
      return 'bin'
  }
}
