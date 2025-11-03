# Durable Objects Implementation Plan

## Status: ✅ HIGH PRIORITY ITEMS COMPLETED

Durable Objects are **now implemented** in Conductor! This document outlines the implementation of ExecutionState and HITLState Durable Objects, which provide significant benefits over KV storage for async execution tracking and HITL resumption.

### ✅ Completed (High Priority)
- ExecutionState Durable Object for async execution tracking
- HITLState Durable Object for HITL resumption with alarm-based TTL
- Execution status API endpoints
- Webhook async mode integration with ExecutionState DO
- ResumptionManager migration to use HITLState DO
- Wrangler.toml configuration with DO bindings

---

## Current Storage Architecture

| Storage Type | Current Usage | Limitations |
|--------------|---------------|-------------|
| **KV** | Query cache, resumption tokens | Eventual consistency, no transactions, no WebSockets |
| **D1/Hyperdrive** | Structured data, analytics | Not real-time, no in-memory state |
| **R2** | Object storage, artifacts | Object storage only, no state |
| **Analytics Engine** | Telemetry, metrics | Write-only, no queries |

---

## Areas Requiring Durable Objects

### 1. **Async Execution State Tracking** ⭐ HIGH PRIORITY

**Current Issue:**
- Webhook async mode returns execution ID but no way to query status
- Line 89-98 in [src/api/routes/webhooks.ts](../../src/api/routes/webhooks.ts):
  ```typescript
  // Execute in background (no await)
  executor.executeEnsemble(ensemble, webhookData).then(result => {
    // Store result for retrieval
    // TODO: Implement result storage
    console.log('Webhook execution completed:', executionId, result);
  })
  ```

**Why Durable Objects:**
- **Strong consistency**: Guaranteed accurate status
- **Real-time updates**: WebSocket support for live progress
- **In-memory state**: Fast status queries without database hits
- **Transactional**: Atomic state updates

**Implementation:**
```typescript
export class ExecutionState extends DurableObject {
  state: ExecutionStatus;

  async updateProgress(step: string, output: any): Promise<void> {
    this.state.currentStep = step;
    this.state.outputs[step] = output;
    await this.ctx.storage.put('state', this.state);
    this.broadcast({ type: 'progress', step, output });
  }

  async getStatus(): Promise<ExecutionStatus> {
    return this.state;
  }

  // WebSocket support for live updates
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      return this.handleWebSocket(request);
    }
    return new Response('Expected WebSocket', { status: 426 });
  }
}
```

**Benefits:**
- Query execution status: `GET /api/v1/executions/:id/status`
- Stream progress: `WS /api/v1/executions/:id/stream`
- Cancel execution: `POST /api/v1/executions/:id/cancel`
- Retrieve results: `GET /api/v1/executions/:id/result`

**Files to Modify:**
- `src/api/routes/webhooks.ts` (lines 86-98)
- `src/api/routes/async.ts` (entire file)
- `src/runtime/executor.ts` (add progress callbacks)

---

### 2. **HITL Resumption State** ⭐ HIGH PRIORITY

**Current Implementation:**
- Using KV with resumption tokens ([src/runtime/resumption-manager.ts](../../src/runtime/resumption-manager.ts))
- Lines 162-200: Token-based resume with KV storage

**Why Durable Objects are Better:**
- **Stronger consistency**: No eventual consistency issues
- **Real-time notifications**: Notify approvers via WebSocket
- **Timeout handling**: Built-in alarm API for TTL
- **State transitions**: Atomic transitions (pending → approved → resumed)
- **Audit trail**: Built-in transaction log

**Implementation:**
```typescript
export class HITLState extends DurableObject {
  state: SuspendedState;
  approvers: WebSocket[];

  async suspend(state: SuspendedExecutionState, ttl: number): Promise<string> {
    this.state = state;
    await this.ctx.storage.put('state', state);

    // Set alarm for TTL
    await this.ctx.storage.setAlarm(Date.now() + ttl);

    return this.ctx.id.toString();
  }

  async approve(approvalData: any): Promise<void> {
    this.state.status = 'approved';
    this.state.approvalData = approvalData;
    await this.ctx.storage.put('state', this.state);

    // Trigger resume
    await this.resumeExecution();

    // Notify all connected approvers
    this.broadcast({ type: 'approved', data: approvalData });
  }

  async alarm(): Promise<void> {
    // TTL expired - mark as expired and clean up
    this.state.status = 'expired';
    await this.ctx.storage.put('state', this.state);
  }
}
```

**Benefits:**
- Real-time approval UI updates
- Better timeout handling with alarms
- Atomic state transitions
- Multi-approver coordination

**Files to Modify:**
- `src/runtime/resumption-manager.ts` (replace KV with DO)
- `src/api/routes/webhooks.ts` (integrate DO-based resumption)
- `src/members/built-in/hitl/hitl-member.ts` (add DO suspension)

---

### 3. **Distributed Locks & Coordination** 🔒 MEDIUM PRIORITY

**Current Issue:**
- No distributed locking mechanism
- Risk of concurrent state updates
- No coordination between parallel executions

**Why Durable Objects:**
- **Single-threaded guarantee**: One DO instance per ID
- **Atomic operations**: Built-in concurrency control
- **Coordination point**: Multiple workers can coordinate via DO

**Use Cases:**
1. **Member Execution Locks**: Prevent concurrent execution of expensive members
2. **State Update Locks**: Coordinate state updates across workers
3. **Catalog Locks**: Prevent concurrent catalog modifications
4. **Rate Limiting**: Accurate rate limiting (better than KV)

**Implementation:**
```typescript
export class DistributedLock extends DurableObject {
  locks: Map<string, { holder: string; expiresAt: number }>;

  async acquire(resourceId: string, holderId: string, ttl: number): Promise<boolean> {
    const existing = this.locks.get(resourceId);

    if (existing && existing.expiresAt > Date.now()) {
      return false; // Already locked
    }

    // Acquire lock
    this.locks.set(resourceId, {
      holder: holderId,
      expiresAt: Date.now() + ttl
    });

    await this.ctx.storage.put('locks', Array.from(this.locks));
    return true;
  }

  async release(resourceId: string, holderId: string): Promise<void> {
    const lock = this.locks.get(resourceId);
    if (lock && lock.holder === holderId) {
      this.locks.delete(resourceId);
      await this.ctx.storage.put('locks', Array.from(this.locks));
    }
  }
}
```

**Files to Create:**
- `src/runtime/distributed-lock.ts`
- `src/runtime/coordination-manager.ts`

---

### 4. **Real-Time Workflow Monitoring** 📊 MEDIUM PRIORITY

**Current Issue:**
- No live monitoring of ensemble execution
- Metrics only available after completion
- No visibility into long-running workflows

**Why Durable Objects:**
- **WebSocket support**: Real-time updates to UI
- **In-memory metrics**: Fast aggregation without database
- **Event streaming**: Stream execution events as they happen

**Implementation:**
```typescript
export class WorkflowMonitor extends DurableObject {
  connections: WebSocket[];
  metrics: ExecutionMetrics;

  async handleWebSocket(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair());

    this.ctx.acceptWebSocket(server);
    this.connections.push(server);

    // Send current state immediately
    server.send(JSON.stringify({
      type: 'initial_state',
      metrics: this.metrics
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async updateMetric(event: ExecutionEvent): Promise<void> {
    this.metrics.events.push(event);

    // Broadcast to all connected clients
    this.broadcast({
      type: 'metric_update',
      event
    });
  }
}
```

**Use Cases:**
- Live dashboard showing active executions
- Real-time scoring updates
- Step-by-step execution visualization
- Performance monitoring

**Files to Create:**
- `src/monitoring/workflow-monitor.ts`
- `src/api/routes/monitoring.ts`

---

### 5. **Stateful Members** 🤖 MEDIUM PRIORITY

**Current Issue:**
- Members are stateless between invocations
- No session/conversation history
- Can't maintain context across multiple calls

**Why Durable Objects:**
- **Persistent state**: Maintain state across invocations
- **Session management**: Natural fit for conversation history
- **Hot cache**: Keep frequently used data in memory

**Use Cases:**
1. **Conversational Members**: Maintain chat history
2. **Learning Members**: Adapt based on past executions
3. **Session Members**: Track user sessions across requests
4. **Cache Members**: Intelligent caching with eviction

**Implementation:**
```typescript
export class ConversationState extends DurableObject {
  history: Message[];
  context: Record<string, any>;

  async addMessage(message: Message): Promise<void> {
    this.history.push(message);
    await this.ctx.storage.put('history', this.history);

    // Keep only last N messages in memory
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }
  }

  async getContext(): Promise<ConversationContext> {
    return {
      history: this.history,
      context: this.context,
      summary: this.generateSummary()
    };
  }
}
```

**Files to Create:**
- `src/members/stateful-member-base.ts`
- `src/members/built-in/conversation/conversation-member.ts`

---

### 6. **Rate Limiting** 🚦 LOW PRIORITY

**Current Issue:**
- No rate limiting implemented
- KV-based rate limiting has race conditions
- Need accurate per-user/per-ensemble limits

**Why Durable Objects are Better:**
- **Accuracy**: No race conditions due to single-threaded model
- **Sliding window**: Easy to implement complex algorithms
- **Per-entity limits**: One DO per user/ensemble/API key

**Implementation:**
```typescript
export class RateLimiter extends DurableObject {
  requests: { timestamp: number }[];

  async checkLimit(limit: number, window: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const cutoff = now - window;

    // Remove old requests
    this.requests = this.requests.filter(r => r.timestamp > cutoff);

    if (this.requests.length >= limit) {
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    this.requests.push({ timestamp: now });
    await this.ctx.storage.put('requests', this.requests);

    return { allowed: true, remaining: limit - this.requests.length };
  }
}
```

**Files to Create:**
- `src/api/middleware/rate-limiter.ts`

---

### 7. **Multi-Agent Coordination** 🤝 FUTURE

**Current Issue:**
- No coordination between parallel agent executions
- Can't share state or synchronize actions
- No leader election or consensus

**Why Durable Objects:**
- **Coordination point**: Natural rendezvous for multiple agents
- **Message passing**: Agents can communicate via DO
- **Barrier synchronization**: Wait for all agents to complete

**Use Cases:**
1. **Parallel ensemble steps**: Coordinate parallel member execution
2. **Multi-agent workflows**: Agents collaborate on shared task
3. **Distributed decision making**: Consensus protocols
4. **Resource allocation**: Coordinate access to limited resources

**Files to Create:**
- `src/runtime/agent-coordinator.ts`
- `src/runtime/coordination-patterns.ts`

---

## Migration Strategy

### Phase 1: High Priority (Week 1-2)
1. ✅ Implement `ExecutionState` Durable Object
2. ✅ Update webhook async mode to use DO
3. ✅ Add execution status API endpoints
4. ✅ Migrate HITL resumption from KV to DO

### Phase 2: Medium Priority (Week 3-4)
1. ⏳ Implement `DistributedLock` Durable Object
2. ⏳ Add rate limiting with DO
3. ⏳ Implement real-time monitoring with WebSocket

### Phase 3: Future Enhancements
1. ⏳ Stateful members
2. ⏳ Multi-agent coordination
3. ⏳ Advanced consensus patterns

---

## Comparison: KV vs Durable Objects

| Feature | KV | Durable Objects |
|---------|-----|-----------------|
| **Consistency** | Eventual | Strong (single-threaded) |
| **Transactions** | ❌ No | ✅ Yes (atomic operations) |
| **WebSockets** | ❌ No | ✅ Yes (built-in) |
| **In-Memory State** | ❌ No | ✅ Yes |
| **Alarms/Timers** | ❌ No | ✅ Yes |
| **Cost** | $0.50/GB + ops | $0.15/GB + $0.02/million requests |
| **Latency** | ~5-50ms | <1ms (in-memory) |
| **Use Case** | Cache, simple KV | Stateful, real-time, coordination |

---

## Code Organization

```
src/
├── durable-objects/
│   ├── execution-state.ts         # Async execution tracking
│   ├── hitl-state.ts              # HITL resumption with DO
│   ├── distributed-lock.ts        # Distributed locking
│   ├── rate-limiter.ts            # Rate limiting
│   ├── workflow-monitor.ts        # Real-time monitoring
│   ├── conversation-state.ts      # Stateful conversations
│   └── index.ts                   # Export all DOs
├── api/
│   └── routes/
│       ├── executions.ts          # Execution status API (NEW)
│       └── monitoring.ts          # Real-time monitoring API (NEW)
└── runtime/
    └── coordination-manager.ts     # DO coordination utilities
```

---

## Wrangler Configuration

```toml
# wrangler.toml additions

[[durable_objects.bindings]]
name = "EXECUTION_STATE"
class_name = "ExecutionState"
script_name = "conductor"

[[durable_objects.bindings]]
name = "HITL_STATE"
class_name = "HITLState"
script_name = "conductor"

[[durable_objects.bindings]]
name = "DISTRIBUTED_LOCK"
class_name = "DistributedLock"
script_name = "conductor"

[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "conductor"

[[durable_objects.bindings]]
name = "WORKFLOW_MONITOR"
class_name = "WorkflowMonitor"
script_name = "conductor"

[[migrations]]
tag = "v1"
new_classes = ["ExecutionState", "HITLState", "DistributedLock", "RateLimiter", "WorkflowMonitor"]
```

---

## Benefits Summary

✅ **Stronger Consistency** - No eventual consistency issues
✅ **Real-Time Updates** - WebSocket support for live monitoring
✅ **Better Performance** - In-memory state, <1ms latency
✅ **Atomic Operations** - Transaction support
✅ **Coordination** - Distributed locks, consensus protocols
✅ **Timeout Handling** - Built-in alarm API
✅ **Cost Effective** - Lower cost than KV for stateful workloads

---

## Next Steps

1. **Prioritize**: Review this plan and prioritize features
2. **Prototype**: Start with `ExecutionState` DO for async execution
3. **Test**: Validate performance and cost vs KV
4. **Migrate**: Gradually migrate from KV to DO where beneficial
5. **Monitor**: Track DO usage and optimize

---

**Total Estimated Effort**: 3-4 weeks
**Priority Areas**: Execution State, HITL Resumption
**Immediate Action**: Implement ExecutionState DO for async webhooks
