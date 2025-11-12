/**
 * Agent Type Definitions
 *
 * Core types for defining agents in the Conductor framework.
 * Agents are the fundamental building blocks that perform operations.
 */

import type { AgentName } from './branded.js'
import type { Operation } from './operation.js'
import type { BaseCacheConfig } from './cache.js'

/**
 * Agent status
 */
export type AgentStatus = 'active' | 'inactive' | 'error' | 'suspended'

/**
 * Agent execution priority
 */
export type AgentPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Base Agent configuration
 *
 * Defines the core properties that all agents must have.
 */
export interface AgentConfig {
  /** Unique agent name */
  name: AgentName

  /** Operation type this agent performs */
  operation: Operation

  /** Human-readable description */
  description?: string

  /** Agent version */
  version?: string

  /** Agent tags for categorization */
  tags?: string[]

  /** Cache configuration */
  cache?: BaseCacheConfig

  /** Retry configuration */
  retry?: {
    /** Maximum number of retries */
    maxAttempts?: number
    /** Backoff strategy */
    backoff?: 'linear' | 'exponential'
    /** Initial delay in milliseconds */
    initialDelay?: number
    /** Maximum delay in milliseconds */
    maxDelay?: number
  }

  /** Timeout configuration in milliseconds */
  timeout?: number

  /** Execution priority */
  priority?: AgentPriority

  /** Whether this agent is enabled */
  enabled?: boolean

  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * Agent runtime instance
 *
 * Represents an agent with runtime state and capabilities.
 */
export interface AgentInstance {
  /** Agent configuration */
  config: AgentConfig

  /** Current agent status */
  status: AgentStatus

  /** Creation timestamp */
  createdAt: Date

  /** Last updated timestamp */
  updatedAt: Date

  /** Last execution timestamp */
  lastExecutedAt?: Date

  /** Execution count */
  executionCount: number

  /** Error count */
  errorCount: number

  /** Success rate (0-1) */
  successRate: number

  /** Average execution time in milliseconds */
  averageExecutionTime?: number
}

/**
 * Agent execution context
 *
 * Context passed to an agent during execution.
 */
export interface AgentExecutionContext {
  /** Execution ID */
  executionId: string

  /** Parent execution ID (for nested calls) */
  parentExecutionId?: string

  /** Agent name being executed */
  agentName: AgentName

  /** Input data for the agent */
  input: unknown

  /** Environment variables */
  env: Record<string, string>

  /** Platform bindings (KV, D1, R2, etc.) */
  bindings: Record<string, unknown>

  /** Request headers */
  headers: Record<string, string>

  /** Request metadata */
  requestMetadata?: {
    /** Request ID */
    requestId?: string
    /** User ID */
    userId?: string
    /** Correlation ID for tracing */
    correlationId?: string
    /** Source of the request */
    source?: string
  }

  /** Execution start time */
  startTime: Date

  /** Timeout deadline */
  deadline?: Date
}

/**
 * Agent execution result
 *
 * Result of an agent execution.
 */
export interface AgentExecutionResult<T = unknown> {
  /** Whether execution was successful */
  success: boolean

  /** Output data */
  data?: T

  /** Error information */
  error?: {
    /** Error message */
    message: string
    /** Error code */
    code?: string
    /** Error stack trace */
    stack?: string
    /** Additional error details */
    details?: Record<string, unknown>
  }

  /** Execution metrics */
  metrics?: {
    /** Execution duration in milliseconds */
    duration: number
    /** Number of retries */
    retries: number
    /** Tokens used (for AI operations) */
    tokensUsed?: number
    /** Cost in USD (for paid operations) */
    cost?: number
  }

  /** Output metadata */
  metadata?: Record<string, unknown>
}

/**
 * Agent definition for registration
 *
 * Complete agent definition including handler.
 */
export interface AgentDefinition<TInput = unknown, TOutput = unknown> {
  /** Agent configuration */
  config: AgentConfig

  /** Agent execution handler */
  handler: AgentHandler<TInput, TOutput>

  /** Validation function for input */
  validateInput?: (input: unknown) => boolean

  /** Schema for input validation */
  inputSchema?: Record<string, unknown>

  /** Output schema */
  outputSchema?: Record<string, unknown>
}

/**
 * Agent handler function type
 */
export type AgentHandler<TInput = unknown, TOutput = unknown> = (
  context: AgentExecutionContext,
  input: TInput
) => Promise<TOutput>

/**
 * Agent registry entry
 */
export interface AgentRegistryEntry {
  /** Agent definition */
  definition: AgentDefinition

  /** Agent instance */
  instance: AgentInstance

  /** Registration timestamp */
  registeredAt: Date
}

/**
 * Agent query options
 */
export interface AgentQueryOptions {
  /** Filter by operation type */
  operation?: Operation

  /** Filter by status */
  status?: AgentStatus

  /** Filter by tags */
  tags?: string[]

  /** Filter by enabled state */
  enabled?: boolean

  /** Sort field */
  sortBy?: 'name' | 'createdAt' | 'executionCount' | 'successRate'

  /** Sort direction */
  sortDirection?: 'asc' | 'desc'

  /** Limit results */
  limit?: number

  /** Offset for pagination */
  offset?: number
}

/**
 * Type guard to check if a value is a valid AgentStatus
 */
export const isAgentStatus = (value: string): value is AgentStatus => {
  return ['active', 'inactive', 'error', 'suspended'].includes(value)
}

/**
 * Type guard to check if a value is a valid AgentPriority
 */
export const isAgentPriority = (value: string): value is AgentPriority => {
  return ['low', 'normal', 'high', 'critical'].includes(value)
}

/**
 * Create default agent config
 */
export const createDefaultAgentConfig = (
  name: AgentName,
  operation: Operation
): AgentConfig => {
  return {
    name,
    operation,
    priority: 'normal',
    enabled: true,
    timeout: 30000, // 30 seconds
    retry: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 10000,
    },
  }
}
