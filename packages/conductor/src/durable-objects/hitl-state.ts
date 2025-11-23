/**
 * HITLState Durable Object
 *
 * Manages HITL (Human-in-the-Loop) resumption state with alarm-based TTL.
 * Provides strong consistency for state transitions and real-time notifications.
 */

import { DurableObject } from 'cloudflare:workers'
import type { SuspendedExecutionState } from '../runtime/resumption-manager.js'

/**
 * HITL status types
 */
export type HITLStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'resumed'

/**
 * HITL event types
 */
export interface HITLEvent {
  type: 'suspended' | 'approved' | 'rejected' | 'expired' | 'resumed'
  timestamp: number
  actor?: string
  data?: unknown
}

/**
 * Stored HITL state
 */
export interface StoredHITLState {
  token: string
  status: HITLStatus
  suspendedState: SuspendedExecutionState
  suspendedAt: number
  expiresAt: number
  approvalData?: unknown
  rejectionReason?: string
  events: HITLEvent[]
}

/**
 * HITLState Durable Object
 *
 * Single-threaded, strongly consistent HITL state management with alarm-based TTL.
 */
export class HITLState extends DurableObject {
  private state: StoredHITLState | null = null
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
      // Handle WebSocket upgrade for live notifications
      if (request.headers.get('Upgrade') === 'websocket') {
        return this.handleWebSocket(request)
      }

      // GET /status - Get current HITL status
      if (request.method === 'GET' && path === '/status') {
        return this.handleGetStatus()
      }

      // POST /suspend - Suspend execution and create HITL state
      if (request.method === 'POST' && path === '/suspend') {
        const body = (await request.json()) as {
          token: string
          suspendedState: SuspendedExecutionState
          ttl: number
        }
        return this.handleSuspend(body)
      }

      // POST /approve - Approve and resume execution
      if (request.method === 'POST' && path === '/approve') {
        const body = (await request.json()) as {
          actor: string
          approvalData?: unknown
        }
        return this.handleApprove(body)
      }

      // POST /reject - Reject and cancel execution
      if (request.method === 'POST' && path === '/reject') {
        const body = (await request.json()) as {
          actor: string
          reason?: string
        }
        return this.handleReject(body)
      }

      // POST /resume - Mark as resumed (called after successful resumption)
      if (request.method === 'POST' && path === '/resume') {
        return this.handleMarkResumed()
      }

      // DELETE / - Delete HITL state
      if (request.method === 'DELETE' && path === '/') {
        return this.handleDelete()
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
   * Alarm handler for TTL expiration
   */
  async alarm(): Promise<void> {
    // Load state
    this.state = (await this.ctx.storage.get<StoredHITLState>('state')) || null

    if (!this.state) {
      return // No state to expire
    }

    // Check if already expired
    if (this.state.status !== 'pending') {
      return // Already processed
    }

    // Mark as expired
    this.state.status = 'expired'
    this.state.events.push({
      type: 'expired',
      timestamp: Date.now(),
    })

    await this.ctx.storage.put('state', this.state)

    // Notify all connected clients
    this.broadcast({
      type: 'expired',
      token: this.state.token,
      timestamp: Date.now(),
    })

    // Close all WebSocket connections
    for (const ws of this.connections) {
      ws.close()
    }
    this.connections.clear()
  }

  /**
   * Handle WebSocket connection for live notifications
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
          state: {
            token: this.state.token,
            status: this.state.status,
            suspendedAt: this.state.suspendedAt,
            expiresAt: this.state.expiresAt,
            events: this.state.events,
          },
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
   * Get current HITL status
   */
  private async handleGetStatus(): Promise<Response> {
    // Load state from storage if not in memory
    if (!this.state) {
      this.state = (await this.ctx.storage.get<StoredHITLState>('state')) || null
    }

    if (!this.state) {
      return new Response(JSON.stringify({ error: 'HITL state not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Return state without full suspended execution state (too large)
    return new Response(
      JSON.stringify({
        token: this.state.token,
        status: this.state.status,
        suspendedAt: this.state.suspendedAt,
        expiresAt: this.state.expiresAt,
        approvalData: this.state.approvalData,
        rejectionReason: this.state.rejectionReason,
        events: this.state.events,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  /**
   * Suspend execution and create HITL state
   */
  private async handleSuspend(body: {
    token: string
    suspendedState: SuspendedExecutionState
    ttl: number
  }): Promise<Response> {
    const expiresAt = Date.now() + body.ttl * 1000

    this.state = {
      token: body.token,
      status: 'pending',
      suspendedState: body.suspendedState,
      suspendedAt: Date.now(),
      expiresAt,
      events: [
        {
          type: 'suspended',
          timestamp: Date.now(),
        },
      ],
    }

    await this.ctx.storage.put('state', this.state)

    // Set alarm for TTL
    await this.ctx.storage.setAlarm(expiresAt)

    // Broadcast to connected clients
    this.broadcast({
      type: 'suspended',
      token: this.state.token,
      expiresAt,
      timestamp: Date.now(),
    })

    return new Response(
      JSON.stringify({
        success: true,
        token: this.state.token,
        expiresAt,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  /**
   * Approve and prepare for resumption
   */
  private async handleApprove(body: { actor: string; approvalData?: unknown }): Promise<Response> {
    if (!this.state) {
      this.state = (await this.ctx.storage.get<StoredHITLState>('state')) || null
    }

    if (!this.state) {
      return new Response(JSON.stringify({ error: 'HITL state not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (this.state.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Cannot approve: status is ${this.state.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update state
    this.state.status = 'approved'
    this.state.approvalData = body.approvalData
    this.state.events.push({
      type: 'approved',
      timestamp: Date.now(),
      actor: body.actor,
      data: body.approvalData,
    })

    await this.ctx.storage.put('state', this.state)

    // Delete alarm (no longer needed)
    await this.ctx.storage.deleteAlarm()

    // Broadcast to connected clients
    this.broadcast({
      type: 'approved',
      token: this.state.token,
      actor: body.actor,
      timestamp: Date.now(),
    })

    // Return suspended state for resumption
    return new Response(
      JSON.stringify({
        success: true,
        suspendedState: this.state.suspendedState,
        approvalData: body.approvalData,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  /**
   * Reject and cancel execution
   */
  private async handleReject(body: { actor: string; reason?: string }): Promise<Response> {
    if (!this.state) {
      this.state = (await this.ctx.storage.get<StoredHITLState>('state')) || null
    }

    if (!this.state) {
      return new Response(JSON.stringify({ error: 'HITL state not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (this.state.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Cannot reject: status is ${this.state.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update state
    this.state.status = 'rejected'
    this.state.rejectionReason = body.reason
    this.state.events.push({
      type: 'rejected',
      timestamp: Date.now(),
      actor: body.actor,
      data: { reason: body.reason },
    })

    await this.ctx.storage.put('state', this.state)

    // Delete alarm (no longer needed)
    await this.ctx.storage.deleteAlarm()

    // Broadcast to connected clients
    this.broadcast({
      type: 'rejected',
      token: this.state.token,
      actor: body.actor,
      reason: body.reason,
      timestamp: Date.now(),
    })

    // Close all WebSocket connections
    setTimeout(() => {
      for (const ws of this.connections) {
        ws.close()
      }
      this.connections.clear()
    }, 1000)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Execution rejected',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  /**
   * Mark as resumed (called after successful resumption)
   */
  private async handleMarkResumed(): Promise<Response> {
    if (!this.state) {
      this.state = (await this.ctx.storage.get<StoredHITLState>('state')) || null
    }

    if (!this.state) {
      return new Response(JSON.stringify({ error: 'HITL state not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update state
    this.state.status = 'resumed'
    this.state.events.push({
      type: 'resumed',
      timestamp: Date.now(),
    })

    await this.ctx.storage.put('state', this.state)

    // Broadcast to connected clients
    this.broadcast({
      type: 'resumed',
      token: this.state.token,
      timestamp: Date.now(),
    })

    // Close all WebSocket connections
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
   * Delete HITL state
   */
  private async handleDelete(): Promise<Response> {
    // Delete all state
    await this.ctx.storage.deleteAll()

    // Delete alarm if set
    await this.ctx.storage.deleteAlarm()

    // Close all WebSocket connections
    for (const ws of this.connections) {
      ws.close()
    }
    this.connections.clear()

    this.state = null

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
