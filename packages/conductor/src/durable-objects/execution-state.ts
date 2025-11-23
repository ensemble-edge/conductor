/**
 * ExecutionState Durable Object
 *
 * Tracks async execution state with strong consistency.
 * Provides real-time status queries and optional WebSocket streaming.
 */

import { DurableObject } from 'cloudflare:workers'
import type { ExecutionMetrics } from '../runtime/executor.js'

/**
 * Execution status types
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Execution progress event
 */
export interface ExecutionProgressEvent {
  type: 'progress'
  executionId: string
  step: string
  stepIndex: number
  totalSteps: number
  output?: unknown
  timestamp: number
}

/**
 * Execution completion event
 */
export interface ExecutionCompletionEvent {
  type: 'completed' | 'failed' | 'cancelled'
  executionId: string
  result?: unknown
  error?: string
  timestamp: number
}

/**
 * Combined execution event
 */
export type ExecutionEvent = ExecutionProgressEvent | ExecutionCompletionEvent

/**
 * Stored execution state
 */
export interface StoredExecutionState {
  executionId: string
  ensembleName: string
  status: ExecutionStatus
  startedAt: number
  completedAt?: number
  currentStep?: string
  stepIndex?: number
  totalSteps?: number
  outputs: Record<string, unknown>
  metrics: ExecutionMetrics
  result?: unknown
  error?: string
  events: ExecutionEvent[]
}

/**
 * ExecutionState Durable Object
 *
 * Single-threaded, strongly consistent state tracking for async executions.
 */
export class ExecutionState extends DurableObject {
  private state: StoredExecutionState | null = null
  private connections: Set<WebSocket> = new Set()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
  }

  /**
   * HTTP handler for state queries and updates
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    try {
      // Handle WebSocket upgrade for live updates
      if (request.headers.get('Upgrade') === 'websocket') {
        return this.handleWebSocket(request)
      }

      // GET /status - Get current execution status
      if (request.method === 'GET' && path === '/status') {
        return this.handleGetStatus()
      }

      // POST /start - Start execution tracking
      if (request.method === 'POST' && path === '/start') {
        const body = (await request.json()) as {
          executionId: string
          ensembleName: string
          totalSteps: number
        }
        return this.handleStart(body)
      }

      // POST /progress - Update execution progress
      if (request.method === 'POST' && path === '/progress') {
        const body = (await request.json()) as {
          step: string
          stepIndex: number
          output?: unknown
        }
        return this.handleProgress(body)
      }

      // POST /complete - Mark execution as completed
      if (request.method === 'POST' && path === '/complete') {
        const body = (await request.json()) as {
          result: unknown
        }
        return this.handleComplete(body)
      }

      // POST /fail - Mark execution as failed
      if (request.method === 'POST' && path === '/fail') {
        const body = (await request.json()) as {
          error: string
        }
        return this.handleFail(body)
      }

      // POST /cancel - Cancel execution
      if (request.method === 'POST' && path === '/cancel') {
        return this.handleCancel()
      }

      return new Response('Not Found', { status: 404 })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  /**
   * Handle WebSocket connection for live updates
   */
  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    // Accept the WebSocket connection
    this.ctx.acceptWebSocket(server)
    this.connections.add(server)

    // Send current state immediately
    if (this.state) {
      server.send(
        JSON.stringify({
          type: 'initial_state',
          state: this.state,
        })
      )
    }

    // Handle close
    server.addEventListener('close', () => {
      this.connections.delete(server)
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  /**
   * Get current execution status
   */
  private async handleGetStatus(): Promise<Response> {
    // Load state from storage if not in memory
    if (!this.state) {
      this.state = (await this.ctx.storage.get<StoredExecutionState>('state')) || null
    }

    if (!this.state) {
      return new Response(JSON.stringify({ error: 'Execution not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(this.state), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Start execution tracking
   */
  private async handleStart(body: {
    executionId: string
    ensembleName: string
    totalSteps: number
  }): Promise<Response> {
    this.state = {
      executionId: body.executionId,
      ensembleName: body.ensembleName,
      status: 'running',
      startedAt: Date.now(),
      stepIndex: 0,
      totalSteps: body.totalSteps,
      outputs: {},
      metrics: {
        ensemble: body.ensembleName,
        totalDuration: 0,
        agents: [],
        cacheHits: 0,
      },
      events: [],
    }

    await this.ctx.storage.put('state', this.state)

    // Broadcast to connected clients
    this.broadcast({
      type: 'started',
      state: this.state,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Update execution progress
   */
  private async handleProgress(body: {
    step: string
    stepIndex: number
    output?: unknown
  }): Promise<Response> {
    if (!this.state) {
      return new Response(JSON.stringify({ error: 'Execution not started' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update state
    this.state.currentStep = body.step
    this.state.stepIndex = body.stepIndex
    if (body.output) {
      this.state.outputs[body.step] = body.output
    }

    // Create progress event
    const event: ExecutionProgressEvent = {
      type: 'progress',
      executionId: this.state.executionId,
      step: body.step,
      stepIndex: body.stepIndex,
      totalSteps: this.state.totalSteps || 0,
      output: body.output,
      timestamp: Date.now(),
    }

    this.state.events.push(event)

    await this.ctx.storage.put('state', this.state)

    // Broadcast to connected clients
    this.broadcast(event)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Mark execution as completed
   */
  private async handleComplete(body: { result: unknown }): Promise<Response> {
    if (!this.state) {
      return new Response(JSON.stringify({ error: 'Execution not started' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update state
    this.state.status = 'completed'
    this.state.completedAt = Date.now()
    this.state.result = body.result

    // Create completion event
    const event: ExecutionCompletionEvent = {
      type: 'completed',
      executionId: this.state.executionId,
      result: body.result,
      timestamp: Date.now(),
    }

    this.state.events.push(event)

    await this.ctx.storage.put('state', this.state)

    // Broadcast to connected clients
    this.broadcast(event)

    // Close all WebSocket connections after a delay
    setTimeout(() => {
      for (const ws of this.connections) {
        ws.close()
      }
      this.connections.clear()
    }, 1000)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Mark execution as failed
   */
  private async handleFail(body: { error: string }): Promise<Response> {
    if (!this.state) {
      return new Response(JSON.stringify({ error: 'Execution not started' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update state
    this.state.status = 'failed'
    this.state.completedAt = Date.now()
    this.state.error = body.error

    // Create failure event
    const event: ExecutionCompletionEvent = {
      type: 'failed',
      executionId: this.state.executionId,
      error: body.error,
      timestamp: Date.now(),
    }

    this.state.events.push(event)

    await this.ctx.storage.put('state', this.state)

    // Broadcast to connected clients
    this.broadcast(event)

    // Close all WebSocket connections after a delay
    setTimeout(() => {
      for (const ws of this.connections) {
        ws.close()
      }
      this.connections.clear()
    }, 1000)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Cancel execution
   */
  private async handleCancel(): Promise<Response> {
    if (!this.state) {
      return new Response(JSON.stringify({ error: 'Execution not started' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update state
    this.state.status = 'cancelled'
    this.state.completedAt = Date.now()

    // Create cancellation event
    const event: ExecutionCompletionEvent = {
      type: 'cancelled',
      executionId: this.state.executionId,
      timestamp: Date.now(),
    }

    this.state.events.push(event)

    await this.ctx.storage.put('state', this.state)

    // Broadcast to connected clients
    this.broadcast(event)

    // Close all WebSocket connections after a delay
    setTimeout(() => {
      for (const ws of this.connections) {
        ws.close()
      }
      this.connections.clear()
    }, 1000)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Broadcast event to all connected WebSocket clients
   */
  private broadcast(message: unknown): void {
    const payload = JSON.stringify(message)

    for (const ws of this.connections) {
      try {
        ws.send(payload)
      } catch (error) {
        // Remove failed connection
        this.connections.delete(ws)
      }
    }
  }
}
