/**
 * Transform Operation Types
 *
 * Type definitions for declarative data transformations.
 * The transform operation allows returning literal values, merging data,
 * parsing/formatting data formats, and applying simple transformations without writing code.
 */

/**
 * Supported parse/format types
 */
export type ParseFormatType = 'csv' | 'tsv' | 'xlsx' | 'jsonl'

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Field to sort by */
  by: string
  /** Sort order (default: 'asc') */
  order?: 'asc' | 'desc'
}

/**
 * Coercion types for data type conversion
 */
export type CoerceType = 'string' | 'number' | 'boolean' | 'date'

/**
 * Transform operation configuration
 *
 * Modes (mutually exclusive):
 * - `value`: Return a literal value (expressions already resolved by runtime)
 * - `input` + modifiers: Pass through input with optional pick/omit/defaults
 * - `merge`: Merge multiple objects/arrays together
 *
 * Phase 2.5 - Parse/Format:
 * - `parse`: Parse input string/buffer to array of objects
 * - `format`: Format array of objects to string/buffer
 * - `columns`: Select and order columns for output
 * - `rename`: Rename fields
 *
 * Phase 3 - Array Operations:
 * - `filter`: Filter by field truthiness
 * - `sort`: Sort by field
 * - `limit`/`offset`: Pagination
 * - `trim`: Trim whitespace from strings
 * - `compact`: Remove null/undefined values
 * - `dedupe`: Remove duplicates
 * - `coerce`: Convert field types
 */
export interface TransformConfig {
  // === INPUT ===
  /** Input data to transform (for passthrough mode) */
  input?: unknown

  // === MODES ===
  /** Return this literal value (expressions resolved by runtime) */
  value?: unknown
  /** Merge multiple objects/arrays together */
  merge?: unknown[]

  // === PARSE/FORMAT (Phase 2.5) ===
  /** Parse input from this format to array of objects */
  parse?: ParseFormatType
  /** Format output to this format from array of objects */
  format?: ParseFormatType
  /** For xlsx: which sheet to read/write (default: first sheet or "Sheet1") */
  sheet?: string
  /** Column selection and ordering for output */
  columns?: string[]

  // === MODIFIERS ===
  /** Pick only these fields from input */
  pick?: string[]
  /** Omit these fields from input */
  omit?: string[]
  /** Rename fields: { oldName: newName } */
  rename?: Record<string, string>
  /** Apply default values for missing fields */
  defaults?: Record<string, unknown>

  // === ARRAY OPERATIONS (Phase 3) ===
  /** Filter: keep only items where this field is truthy */
  filter?: string
  /** Sort by field */
  sort?: SortConfig
  /** Limit number of results */
  limit?: number
  /** Skip first N results */
  offset?: number

  // === DATA CLEANING (Phase 3) ===
  /** Trim whitespace from all string fields */
  trim?: boolean
  /** Remove null/undefined values from objects and arrays */
  compact?: boolean
  /** Remove duplicate items (true = by value, string = by field) */
  dedupe?: boolean | string
  /** Coerce field types: { fieldName: 'string' | 'number' | 'boolean' | 'date' } */
  coerce?: Record<string, CoerceType>
}

/**
 * Transform operation output
 * The output type depends on the config mode used
 */
export type TransformOutput = unknown
