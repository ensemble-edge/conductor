/**
 * Resumption Manager
 *
 * Handles storing and retrieving suspended execution state for workflow resumption.
 * Uses HITLState Durable Object with alarm-based TTL for strong consistency.
 */

import type { EnsembleConfig } from './parser.js'
import type { StateManager } from './state-manager.js'
import { Result, type AsyncResult } from '../types/result.js'
import { Errors, type ConductorError } from '../errors/error-types.js'
import { TTL } from '../config/constants.js'
import type { MemberMetric } from './executor.js'
import type { ScoringState } from './scoring/types.js'

/**
 * HITL State response from Durable Object
 */
interface HITLStateResponse {
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  suspendedState?: SuspendedExecutionState
  suspendedAt?: number
  expiresAt?: number
  rejectionReason?: string
}

/**
 * Error response from Durable Object
 */
interface DOErrorResponse {
  error: string
}

/**
 * Suspended execution state
 */
export interface SuspendedExecutionState {
  /**
   * Resumption token (unique ID)
   */
  token: string

  /**
   * Ensemble configuration
   */
  ensemble: EnsembleConfig

  /**
   * Current execution context
   */
  executionContext: Record<string, unknown>

  /**
   * State manager snapshot (if state is enabled)
   */
  stateSnapshot?: Record<string, unknown>

  /**
   * Scoring state snapshot (if scoring is enabled)
   */
  scoringSnapshot?: ScoringState

  /**
   * Current flow step index (where to resume from)
   */
  resumeFromStep: number

  /**
   * Metrics accumulated so far
   */
  metrics: {
    startTime: number
    members: MemberMetric[]
    cacheHits: number
  }

  /**
   * Suspension metadata
   */
  metadata: {
    suspendedAt: number
    suspendedBy: string // Member name that triggered suspension (e.g., 'hitl')
    reason?: string
    expiresAt: number
  }
}

/**
 * Resumption options
 */
export interface ResumptionOptions {
  /**
   * TTL for resumption token (seconds)
   * @default 86400 (24 hours)
   */
  ttl?: number

  /**
   * Additional metadata to store
   */
  metadata?: Record<string, unknown>
}

/**
 * Resumption Manager
 * Handles HITLState Durable Object-based storage for suspended execution state
 */
export class ResumptionManager {
  private readonly namespace: DurableObjectNamespace

  constructor(namespace: DurableObjectNamespace) {
    this.namespace = namespace
  }

  /**
   * Generate a cryptographically secure unique resumption token
   */
  static generateToken(): string {
    // Use crypto.randomUUID() for cryptographically secure random tokens
    // Format: resume_<uuid> for easy identification and secure randomness
    return `resume_${crypto.randomUUID()}`
  }

  /**
   * Suspend execution and store state in HITLState DO
   */
  async suspend(
    ensemble: EnsembleConfig,
    executionContext: Record<string, unknown>,
    resumeFromStep: number,
    suspendedBy: string,
    metrics: { startTime: number; members: MemberMetric[]; cacheHits: number },
    options: ResumptionOptions = {}
  ): AsyncResult<string, ConductorError> {
    try {
      const token = ResumptionManager.generateToken()
      const ttl = options.ttl || TTL.RESUMPTION_TOKEN

      const suspendedState: SuspendedExecutionState = {
        token,
        ensemble,
        executionContext,
        stateSnapshot: executionContext.state as Record<string, unknown> | undefined,
        scoringSnapshot: executionContext.scoring as ScoringState | undefined,
        resumeFromStep,
        metrics: {
          startTime: metrics.startTime || Date.now(),
          members: metrics.members || [],
          cacheHits: metrics.cacheHits || 0,
        },
        metadata: {
          suspendedAt: Date.now(),
          suspendedBy,
          reason: options.metadata?.reason as string | undefined,
          expiresAt: Date.now() + ttl * 1000,
          ...options.metadata,
        },
      }

      // Get HITLState DO stub
      const id = this.namespace.idFromName(token)
      const stub = this.namespace.get(id)

      // Suspend execution in DO
      const response = await stub.fetch(
        new Request('http://do/suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            suspendedState,
            ttl,
          }),
        })
      )

      if (!response.ok) {
        const error = (await response.json()) as DOErrorResponse
        return Result.err(
          Errors.internal(`Failed to suspend execution: ${error.error || 'Unknown error'}`)
        )
      }

      return Result.ok(token)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `Failed to suspend execution: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Resume execution by loading state from HITLState DO
   */
  async resume(token: string): AsyncResult<SuspendedExecutionState, ConductorError> {
    try {
      // Get HITLState DO stub
      const id = this.namespace.idFromName(token)
      const stub = this.namespace.get(id)

      // Get status from DO
      const response = await stub.fetch(
        new Request('http://do/status', {
          method: 'GET',
        })
      )

      if (!response.ok) {
        return Result.err(Errors.storageNotFound(token, 'hitl-state-do'))
      }

      const state = (await response.json()) as HITLStateResponse

      // Check if already expired
      if (state.status === 'expired') {
        return Result.err(Errors.storageNotFound(token, 'hitl-state-do (expired)'))
      }

      // Check if already approved (ready to resume)
      if (state.status === 'approved') {
        if (!state.suspendedState) {
          return Result.err(Errors.internal('Suspended state not found in approved HITL request'))
        }
        return Result.ok(state.suspendedState)
      }

      // If still pending, return error
      if (state.status === 'pending') {
        return Result.err(Errors.internal('Execution still pending approval'))
      }

      // If rejected, return error
      if (state.status === 'rejected') {
        return Result.err(
          Errors.internal(`Execution rejected: ${state.rejectionReason || 'No reason provided'}`)
        )
      }

      return Result.err(Errors.internal(`Invalid HITL state: ${state.status}`))
    } catch (error) {
      return Result.err(
        Errors.internal(
          `Failed to resume execution: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Cancel a resumption token (delete from HITLState DO)
   */
  async cancel(token: string): AsyncResult<void, ConductorError> {
    try {
      // Get HITLState DO stub
      const id = this.namespace.idFromName(token)
      const stub = this.namespace.get(id)

      // Delete DO state
      const response = await stub.fetch(
        new Request('http://do/', {
          method: 'DELETE',
        })
      )

      if (!response.ok) {
        const error = (await response.json()) as DOErrorResponse
        return Result.err(
          Errors.internal(`Failed to cancel resumption token: ${error.error || 'Unknown error'}`)
        )
      }

      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `Failed to cancel resumption token: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Get resumption token metadata (without full state)
   */
  async getMetadata(
    token: string
  ): AsyncResult<SuspendedExecutionState['metadata'], ConductorError> {
    try {
      // Get HITLState DO stub
      const id = this.namespace.idFromName(token)
      const stub = this.namespace.get(id)

      // Get status from DO
      const response = await stub.fetch(
        new Request('http://do/status', {
          method: 'GET',
        })
      )

      if (!response.ok) {
        return Result.err(Errors.storageNotFound(token, 'hitl-state-do'))
      }

      const state = (await response.json()) as HITLStateResponse

      // Return metadata from suspended state
      if (state.suspendedState) {
        return Result.ok(state.suspendedState.metadata)
      }

      // Construct metadata from HITL state
      return Result.ok({
        suspendedAt: state.suspendedAt || Date.now(),
        suspendedBy: 'hitl',
        expiresAt: state.expiresAt || Date.now(),
      })
    } catch (error) {
      return Result.err(
        Errors.internal(
          `Failed to get resumption metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Approve a HITL request
   * Approves the suspended execution and marks it ready for resumption
   */
  async approve(
    token: string,
    actor: string,
    approvalData?: unknown
  ): AsyncResult<void, ConductorError> {
    try {
      // Get HITLState DO stub
      const id = this.namespace.idFromName(token)
      const stub = this.namespace.get(id)

      // Send approve request
      const response = await stub.fetch(
        new Request('http://do/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, approvalData }),
        })
      )

      if (!response.ok) {
        const error = (await response.json()) as DOErrorResponse
        return Result.err(
          Errors.internal(`Failed to approve HITL request: ${error.error || 'Unknown error'}`)
        )
      }

      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `Failed to approve HITL request: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }

  /**
   * Reject a HITL request
   * Rejects the suspended execution and cancels it
   */
  async reject(token: string, actor: string, reason?: string): AsyncResult<void, ConductorError> {
    try {
      // Get HITLState DO stub
      const id = this.namespace.idFromName(token)
      const stub = this.namespace.get(id)

      // Send reject request
      const response = await stub.fetch(
        new Request('http://do/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor, reason }),
        })
      )

      if (!response.ok) {
        const error = (await response.json()) as DOErrorResponse
        return Result.err(
          Errors.internal(`Failed to reject HITL request: ${error.error || 'Unknown error'}`)
        )
      }

      return Result.ok(undefined)
    } catch (error) {
      return Result.err(
        Errors.internal(
          `Failed to reject HITL request: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      )
    }
  }
}
