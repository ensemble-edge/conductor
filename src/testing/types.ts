/**
 * Testing Types
 */

import type { MemberExecutionContext, MemberResponse } from '../members/base-member'
import type { EnsembleConfig } from '../runtime/parser'

/**
 * Options for creating a test conductor instance
 */
export interface TestConductorOptions {
  /** Path to the project directory */
  projectPath?: string
  /** Mock configurations */
  mocks?: TestMocks
  /** Environment variables override */
  env?: Record<string, unknown>
}

/**
 * Mock configurations for testing
 */
export interface TestMocks {
  /** Mock AI responses by member name */
  ai?: Record<string, unknown | Error>
  /** Mock database responses */
  database?: Record<string, unknown[]>
  /** Mock HTTP responses by URL */
  http?: Record<string, unknown>
  /** Mock Vectorize responses */
  vectorize?: Record<string, VectorSearchResult[]>
}

/**
 * Result of a test execution
 */
export interface TestExecutionResult {
  /** Whether execution succeeded */
  success: boolean
  /** Output from the execution */
  output?: unknown
  /** Error if execution failed */
  error?: Error
  /** Total execution time in milliseconds */
  executionTime: number
  /** Steps that were executed */
  stepsExecuted: ExecutedStep[]
  /** State history throughout execution */
  stateHistory: StateSnapshot[]
  /** AI calls made during execution */
  aiCalls: AICall[]
  /** Database queries made during execution */
  databaseQueries: DatabaseQuery[]
  /** HTTP requests made during execution */
  httpRequests: HTTPRequest[]
}

/**
 * Result of a test member execution
 */
export interface TestMemberResult {
  /** Member output/data */
  output: unknown
  /** Execution time in milliseconds */
  executionTime: number
  /** Any AI calls made */
  aiCalls?: AICall[]
}

/**
 * A step that was executed
 */
export interface ExecutedStep {
  /** Member name */
  member: string
  /** Step input */
  input: unknown
  /** Step output */
  output: unknown
  /** Duration in milliseconds */
  duration: number
  /** Whether step succeeded */
  success: boolean
  /** Error if step failed */
  error?: Error
}

/**
 * Snapshot of state at a point in time
 */
export interface StateSnapshot {
  /** Step number */
  step: number
  /** State at this point */
  state: Record<string, unknown>
  /** Timestamp */
  timestamp: number
}

/**
 * Record of an AI call
 */
export interface AICall {
  /** Member that made the call */
  member: string
  /** Model used */
  model: string
  /** Prompt sent */
  prompt: string
  /** Response received */
  response: string
  /** Token usage */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  /** Estimated cost in USD */
  estimatedCost?: number
  /** Duration in milliseconds */
  duration: number
}

/**
 * Record of a database query
 */
export interface DatabaseQuery {
  /** Table/collection queried */
  table: string
  /** Query operation */
  operation: 'select' | 'insert' | 'update' | 'delete'
  /** Query parameters */
  params?: unknown[]
  /** Number of rows affected */
  rowsAffected?: number
  /** Duration in milliseconds */
  duration: number
}

/**
 * Record of an HTTP request
 */
export interface HTTPRequest {
  /** Request method */
  method: string
  /** Request URL */
  url: string
  /** Request headers */
  headers?: Record<string, string>
  /** Request body */
  body?: unknown
  /** Response status */
  status?: number
  /** Response body */
  response?: unknown
  /** Duration in milliseconds */
  duration: number
}

/**
 * Vector search result for mocking
 */
export interface VectorSearchResult {
  /** Document ID */
  id: string
  /** Similarity score */
  score: number
  /** Document metadata */
  metadata: Record<string, unknown>
}

/**
 * Execution record for history
 */
export interface ExecutionRecord extends TestExecutionResult {
  /** Ensemble that was executed */
  ensemble: string
  /** Input provided */
  input: unknown
  /** Timestamp of execution */
  timestamp: number
}

/**
 * Project snapshot for testing
 */
export interface ProjectSnapshot {
  /** Loaded catalog */
  catalog: {
    ensembles: Map<string, EnsembleConfig>
    members: Map<string, unknown>
  }
  /** Current state */
  state: Record<string, unknown>
  /** Active mocks */
  mocks: Record<string, unknown>
}
