/**
 * Transform Agent
 *
 * Declarative data transformation operation with:
 * - Return literal values (expressions already resolved by runtime)
 * - Pass through input with pick/omit/defaults modifiers
 * - Merge multiple objects/arrays
 * - Parse/format CSV, TSV, XLSX, JSONL (Phase 2.5)
 * - Filter, sort, limit, offset (Phase 3)
 * - Trim, compact, dedupe, coerce (Phase 3)
 *
 * Key insight: The `${}` expression interpolation is handled by the Conductor
 * runtime (Parser.resolveInterpolation) BEFORE the agent's run() method is called.
 * This means Phase 1 (value mode) is literally just returning config.value.
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'
import type { TransformConfig, TransformOutput, SortConfig, CoerceType } from './types/index.js'
import Papa from 'papaparse'

/**
 * Transform Agent for declarative data transformations
 *
 * @example Value mode (Phase 1)
 * ```yaml
 * - name: mock-data
 *   operation: transform
 *   config:
 *     value:
 *       - { id: 1, name: "Alice" }
 *       - { id: 2, name: "Bob" }
 * ```
 *
 * @example Passthrough with modifiers (Phase 2)
 * ```yaml
 * - name: clean-data
 *   operation: transform
 *   config:
 *     input: ${user.output}
 *     omit: [password, secret]
 *     defaults:
 *       status: "pending"
 * ```
 *
 * @example Parse CSV (Phase 2.5)
 * ```yaml
 * - name: parse-upload
 *   operation: transform
 *   config:
 *     input: ${storage.output}
 *     parse: csv
 * ```
 *
 * @example Format to CSV (Phase 2.5)
 * ```yaml
 * - name: export-csv
 *   operation: transform
 *   config:
 *     input: ${users.output}
 *     format: csv
 *     columns: [id, name, email]
 * ```
 *
 * @example Filter and sort (Phase 3)
 * ```yaml
 * - name: active-users
 *   operation: transform
 *   config:
 *     input: ${users.output}
 *     filter: active
 *     sort:
 *       by: createdAt
 *       order: desc
 *     limit: 10
 * ```
 */
export class TransformAgent extends BaseAgent {
  private transformConfig: TransformConfig

  constructor(config: AgentConfig) {
    super(config)
    this.transformConfig = (config.config || {}) as unknown as TransformConfig
  }

  /**
   * Execute the transform operation
   */
  protected async run(context: AgentExecutionContext): Promise<TransformOutput> {
    // Merge runtime config with static config (runtime takes precedence)
    const config: TransformConfig = {
      ...this.transformConfig,
      ...(context.config as Partial<TransformConfig>),
    }

    // Detect mode and execute
    if (config.value !== undefined) {
      return this.handleValueMode(config)
    }

    if (config.merge !== undefined) {
      return this.handleMergeMode(config)
    }

    if (config.input !== undefined || config.parse !== undefined) {
      return this.handleInputMode(config)
    }

    // No mode specified - error
    throw new Error(
      'transform operation requires one of: config.value, config.input, or config.merge'
    )
  }

  /**
   * Value mode: Return the literal value
   * Expressions are already resolved by the runtime before we get here
   */
  private handleValueMode(config: TransformConfig): TransformOutput {
    return config.value
  }

  /**
   * Input mode: Pass through input with optional modifiers
   */
  private async handleInputMode(config: TransformConfig): Promise<TransformOutput> {
    let result: unknown = config.input

    // Phase 2.5: Parse input if specified
    if (config.parse) {
      result = await this.parseInput(result, config)
    }

    // Handle array of objects - apply all transformations
    if (Array.isArray(result)) {
      let items: Record<string, unknown>[] = result as Record<string, unknown>[]

      // Phase 3: Apply filter first
      if (config.filter) {
        items = this.applyFilter(items, config.filter)
      }

      // Phase 3: Apply data cleaning
      if (config.trim || config.compact || config.coerce) {
        items = items.map((item: Record<string, unknown>) => this.applyDataCleaning(item, config))
      }

      // Apply field modifiers (pick, omit, rename, defaults)
      items = items.map((item: Record<string, unknown>) => this.applyModifiers(item, config))

      // Phase 3: Apply dedupe
      if (config.dedupe) {
        items = this.applyDedupe(items, config.dedupe)
      }

      // Phase 3: Apply sort
      if (config.sort) {
        items = this.applySort(items, config.sort)
      }

      // Phase 3: Apply pagination (offset then limit)
      if (config.offset !== undefined && config.offset > 0) {
        items = items.slice(config.offset)
      }
      if (config.limit !== undefined && config.limit > 0) {
        items = items.slice(0, config.limit)
      }

      result = items
    } else if (typeof result === 'object' && result !== null) {
      // Handle single object
      let obj = result as Record<string, unknown>
      if (config.trim || config.compact || config.coerce) {
        obj = this.applyDataCleaning(obj, config)
      }
      result = this.applyModifiers(obj, config)
    }

    // Phase 2.5: Format output if specified
    if (config.format) {
      result = await this.formatOutput(result, config)
    }

    return result
  }

  /**
   * Merge mode: Combine multiple objects or arrays
   */
  private handleMergeMode(config: TransformConfig): TransformOutput {
    const items = config.merge
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('transform merge mode requires a non-empty array')
    }

    // Check if we're merging arrays or objects
    const firstItem = items[0]

    if (Array.isArray(firstItem)) {
      // Concatenate arrays
      return items.flat()
    }

    if (typeof firstItem === 'object' && firstItem !== null) {
      // Merge objects (later items override earlier)
      return items.reduce((acc, item) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return { ...(acc as Record<string, unknown>), ...(item as Record<string, unknown>) }
        }
        return acc
      }, {})
    }

    // Not mergeable, return first item
    return firstItem
  }

  /**
   * Parse input from a format to array of objects (Phase 2.5)
   */
  private async parseInput(
    input: unknown,
    config: TransformConfig
  ): Promise<Record<string, unknown>[]> {
    const format = config.parse
    const inputStr = typeof input === 'string' ? input : ''

    switch (format) {
      case 'csv':
        return this.parseCsv(inputStr, ',')

      case 'tsv':
        return this.parseCsv(inputStr, '\t')

      case 'jsonl':
        return this.parseJsonl(inputStr)

      case 'xlsx':
        return this.parseXlsx(input, config.sheet)

      default:
        throw new Error(`transform: unsupported parse format '${format}'`)
    }
  }

  /**
   * Format output to a specific format (Phase 2.5)
   */
  private async formatOutput(data: unknown, config: TransformConfig): Promise<unknown> {
    const format = config.format
    const items = Array.isArray(data) ? data : [data]

    switch (format) {
      case 'csv':
        return this.formatCsv(items as Record<string, unknown>[], ',', config.columns)

      case 'tsv':
        return this.formatCsv(items as Record<string, unknown>[], '\t', config.columns)

      case 'jsonl':
        return this.formatJsonl(items as Record<string, unknown>[])

      case 'xlsx':
        return this.formatXlsx(items as Record<string, unknown>[], config.sheet, config.columns)

      default:
        throw new Error(`transform: unsupported format '${format}'`)
    }
  }

  /**
   * Parse CSV/TSV using papaparse
   */
  private parseCsv(input: string, delimiter: string): Record<string, unknown>[] {
    if (!input.trim()) return []

    const result = Papa.parse(input, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      dynamicTyping: true,
    })

    if (result.errors.length > 0) {
      const firstError = result.errors[0]
      throw new Error(`transform: CSV parse error at row ${firstError.row}: ${firstError.message}`)
    }

    return result.data as Record<string, unknown>[]
  }

  /**
   * Format to CSV/TSV using papaparse
   */
  private formatCsv(
    data: Record<string, unknown>[],
    delimiter: string,
    columns?: string[]
  ): string {
    if (data.length === 0) return ''

    // If columns specified, reorder/filter fields
    let outputData = data
    if (columns && columns.length > 0) {
      outputData = data.map((row) => {
        const newRow: Record<string, unknown> = {}
        for (const col of columns) {
          newRow[col] = row[col]
        }
        return newRow
      })
    }

    return Papa.unparse(outputData, {
      delimiter,
      header: true,
    })
  }

  /**
   * Parse JSONL (newline-delimited JSON)
   */
  private parseJsonl(input: string): Record<string, unknown>[] {
    if (!input.trim()) return []

    const lines = input.split('\n').filter((line) => line.trim())
    return lines.map((line, index) => {
      try {
        return JSON.parse(line) as Record<string, unknown>
      } catch {
        throw new Error(`transform: JSONL parse error at line ${index + 1}: Invalid JSON`)
      }
    })
  }

  /**
   * Format to JSONL
   */
  private formatJsonl(data: Record<string, unknown>[]): string {
    return data.map((row) => JSON.stringify(row)).join('\n')
  }

  /**
   * Parse XLSX file (dynamic import to keep bundle lean)
   */
  private async parseXlsx(input: unknown, sheetName?: string): Promise<Record<string, unknown>[]> {
    // Dynamic import to avoid loading xlsx unless needed
    const XLSX = await import('xlsx')

    // Handle ArrayBuffer or base64 string
    let workbook
    if (input instanceof ArrayBuffer) {
      workbook = XLSX.read(input, { type: 'array' })
    } else if (typeof input === 'string') {
      // Assume base64 encoded
      workbook = XLSX.read(input, { type: 'base64' })
    } else {
      throw new Error('transform: XLSX input must be an ArrayBuffer or base64 string')
    }

    // Get sheet
    const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]]

    if (!sheet) {
      throw new Error(`transform: XLSX sheet '${sheetName || 'first'}' not found`)
    }

    return XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
  }

  /**
   * Format to XLSX (returns base64 string for storage)
   */
  private async formatXlsx(
    data: Record<string, unknown>[],
    sheetName?: string,
    columns?: string[]
  ): Promise<string> {
    const XLSX = await import('xlsx')

    // If columns specified, reorder/filter fields
    let outputData = data
    if (columns && columns.length > 0) {
      outputData = data.map((row) => {
        const newRow: Record<string, unknown> = {}
        for (const col of columns) {
          newRow[col] = row[col]
        }
        return newRow
      })
    }

    const worksheet = XLSX.utils.json_to_sheet(outputData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Sheet1')

    // Return as base64 string
    const buffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
    return buffer as string
  }

  /**
   * Apply pick/omit/rename/defaults modifiers to an object
   */
  private applyModifiers(
    obj: Record<string, unknown>,
    config: TransformConfig
  ): Record<string, unknown> {
    let result = { ...obj }

    // Apply defaults first (so pick/omit can filter them)
    if (config.defaults) {
      result = { ...config.defaults, ...result }
    }

    // Apply rename
    if (config.rename) {
      const renamed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(result)) {
        const newKey = config.rename[key] || key
        renamed[newKey] = value
      }
      result = renamed
    }

    // Apply pick (include only these fields)
    if (config.pick && config.pick.length > 0) {
      const picked: Record<string, unknown> = {}
      for (const key of config.pick) {
        if (key in result) {
          picked[key] = result[key]
        }
      }
      result = picked
    }

    // Apply omit (exclude these fields)
    if (config.omit && config.omit.length > 0) {
      for (const key of config.omit) {
        delete result[key]
      }
    }

    return result
  }

  /**
   * Apply data cleaning operations (Phase 3)
   */
  private applyDataCleaning(
    obj: Record<string, unknown>,
    config: TransformConfig
  ): Record<string, unknown> {
    let result = { ...obj }

    // Trim: trim whitespace from all string values
    if (config.trim) {
      for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'string') {
          result[key] = value.trim()
        }
      }
    }

    // Compact: remove null/undefined values
    if (config.compact) {
      const compacted: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(result)) {
        if (value !== null && value !== undefined) {
          compacted[key] = value
        }
      }
      result = compacted
    }

    // Coerce: convert field types
    if (config.coerce) {
      for (const [field, targetType] of Object.entries(config.coerce)) {
        if (field in result) {
          result[field] = this.coerceValue(result[field], targetType)
        }
      }
    }

    return result
  }

  /**
   * Coerce a value to a specific type
   */
  private coerceValue(value: unknown, targetType: CoerceType): unknown {
    if (value === null || value === undefined) return value

    switch (targetType) {
      case 'string':
        return String(value)

      case 'number': {
        const num = Number(value)
        return isNaN(num) ? 0 : num
      }

      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          const lower = value.toLowerCase()
          return lower === 'true' || lower === '1' || lower === 'yes'
        }
        return Boolean(value)

      case 'date':
        if (value instanceof Date) return value
        const date = new Date(value as string | number)
        return isNaN(date.getTime()) ? null : date

      default:
        return value
    }
  }

  /**
   * Filter array by field truthiness (Phase 3)
   */
  private applyFilter(items: unknown[], filterField: string): Record<string, unknown>[] {
    return items.filter((item) => {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>
        return Boolean(obj[filterField])
      }
      return false
    }) as Record<string, unknown>[]
  }

  /**
   * Sort array by field (Phase 3)
   */
  private applySort(
    items: Record<string, unknown>[],
    sortConfig: SortConfig
  ): Record<string, unknown>[] {
    const { by, order = 'asc' } = sortConfig
    const multiplier = order === 'desc' ? -1 : 1

    return [...items].sort((a, b) => {
      const aVal = a[by]
      const bVal = b[by]

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1 * multiplier
      if (bVal === null || bVal === undefined) return -1 * multiplier

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        return (aVal.getTime() - bVal.getTime()) * multiplier
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier
      }

      // Handle strings
      return String(aVal).localeCompare(String(bVal)) * multiplier
    })
  }

  /**
   * Remove duplicates (Phase 3)
   */
  private applyDedupe(
    items: Record<string, unknown>[],
    dedupe: boolean | string
  ): Record<string, unknown>[] {
    if (typeof dedupe === 'string') {
      // Dedupe by specific field
      const seen = new Set<unknown>()
      return items.filter((item) => {
        const key = item[dedupe]
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    // Dedupe by full value (JSON stringified)
    const seen = new Set<string>()
    return items.filter((item) => {
      const key = JSON.stringify(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}
