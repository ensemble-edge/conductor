/**
 * Execution History Storage
 *
 * Store and retrieve execution history for debugging.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import type { Result } from '../types/result.js'

/**
 * Execution record stored in history
 */
export interface ExecutionRecord {
  /** Unique execution ID */
  id: string

  /** Ensemble or agent name */
  name: string

  /** Execution type */
  type: 'ensemble' | 'agent'

  /** Input data */
  input: Record<string, unknown>

  /** Output data (if successful) */
  output?: unknown

  /** Error (if failed) */
  error?: {
    message: string
    code?: string
    stack?: string
  }

  /** Execution status */
  status: 'success' | 'failure'

  /** Start timestamp */
  startTime: number

  /** End timestamp */
  endTime: number

  /** Duration in milliseconds */
  duration: number

  /** Steps executed (for ensembles) */
  steps?: ExecutionStep[]

  /** State snapshots at each step */
  stateSnapshots?: StateSnapshot[]

  /** Logs generated during execution */
  logs?: LogEntry[]
}

/**
 * Execution step
 */
export interface ExecutionStep {
  /** Step name/agent */
  name: string

  /** Step status */
  status: 'success' | 'failure' | 'skipped'

  /** Start time */
  startTime: number

  /** End time */
  endTime: number

  /** Duration */
  duration: number

  /** Output */
  output?: unknown

  /** Error if failed */
  error?: string
}

/**
 * State snapshot at a point in time
 */
export interface StateSnapshot {
  /** Step index */
  stepIndex: number

  /** Step name */
  stepName: string

  /** Timestamp */
  timestamp: number

  /** State at this point */
  state: Record<string, unknown>
}

/**
 * Log entry
 */
export interface LogEntry {
  /** Timestamp */
  timestamp: number

  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error'

  /** Log message */
  message: string

  /** Additional context */
  context?: Record<string, unknown>

  /** Step name (if applicable) */
  step?: string
}

/**
 * Execution history manager
 */
export class ExecutionHistory {
  private storagePath: string

  constructor(storagePath: string = './.conductor/history') {
    this.storagePath = storagePath
  }

  /**
   * Initialize storage directory
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true })
  }

  /**
   * Store execution record
   */
  async store(record: ExecutionRecord): Promise<void> {
    await this.initialize()

    const filePath = path.join(this.storagePath, `${record.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8')
  }

  /**
   * Get execution record by ID
   */
  async get(executionId: string): Promise<ExecutionRecord | null> {
    try {
      const filePath = path.join(this.storagePath, `${executionId}.json`)
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content) as ExecutionRecord
    } catch {
      return null
    }
  }

  /**
   * List all execution records
   */
  async list(options?: {
    limit?: number
    type?: 'ensemble' | 'agent'
    status?: 'success' | 'failure'
  }): Promise<ExecutionRecord[]> {
    try {
      await this.initialize()

      const files = await fs.readdir(this.storagePath)
      const jsonFiles = files.filter((f) => f.endsWith('.json'))

      // Read all records
      const records = await Promise.all(
        jsonFiles.map(async (file) => {
          const content = await fs.readFile(path.join(this.storagePath, file), 'utf-8')
          return JSON.parse(content) as ExecutionRecord
        })
      )

      // Filter
      let filtered = records
      if (options?.type) {
        filtered = filtered.filter((r) => r.type === options.type)
      }
      if (options?.status) {
        filtered = filtered.filter((r) => r.status === options.status)
      }

      // Sort by timestamp (newest first)
      filtered.sort((a, b) => b.startTime - a.startTime)

      // Limit
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit)
      }

      return filtered
    } catch {
      return []
    }
  }

  /**
   * Get logs for an execution
   */
  async getLogs(executionId: string): Promise<LogEntry[]> {
    const record = await this.get(executionId)
    return record?.logs || []
  }

  /**
   * Get state snapshots for an execution
   */
  async getStateSnapshots(executionId: string): Promise<StateSnapshot[]> {
    const record = await this.get(executionId)
    return record?.stateSnapshots || []
  }

  /**
   * Delete old execution records
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const files = await fs.readdir(this.storagePath)
      const jsonFiles = files.filter((f) => f.endsWith('.json'))

      let deletedCount = 0
      const now = Date.now()

      for (const file of jsonFiles) {
        const filePath = path.join(this.storagePath, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const record = JSON.parse(content) as ExecutionRecord

        // Delete if older than maxAge
        if (now - record.endTime > maxAge) {
          await fs.unlink(filePath)
          deletedCount++
        }
      }

      return deletedCount
    } catch {
      return 0
    }
  }
}

/**
 * Generate unique execution ID
 */
export function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
