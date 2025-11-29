# Cloudflare Workers Platform Reference for Claude Code

> **Purpose**: This document is a technical reference for Claude Code when working on TypeScript projects designed for Cloudflare Workers. It covers all primitives, capabilities, limitations, and compatibility information as of November 2025.

---

## Table of Contents

1. [Runtime Environment](#runtime-environment)
2. [Core Compute Primitives](#core-compute-primitives)
3. [Storage Primitives](#storage-primitives)
4. [Database Primitives](#database-primitives)
5. [Messaging & Orchestration](#messaging--orchestration)
6. [AI & Vector Primitives](#ai--vector-primitives)
7. [Network & Connectivity](#network--connectivity)
8. [Observability & Analytics](#observability--analytics)
9. [Node.js Compatibility](#nodejs-compatibility)
10. [What Does NOT Work on Workers](#what-does-not-work-on-workers)
11. [Bindings Reference](#bindings-reference)
12. [Configuration Reference](#configuration-reference)
13. [Announced But Not Yet Available](#announced-but-not-yet-available)

---

## Runtime Environment

### V8 Isolate Architecture
- Workers run on V8 isolates (same engine as Chrome/Node.js)
- NOT containers - isolates are lightweight, ~100x faster startup than Node containers
- Each isolate is stateless and ephemeral
- Global scope exists but is not guaranteed to persist between requests
- Isolates may be evicted under memory pressure or at runtime discretion

### Memory Limits
- **128 MB** per isolate
- Out-of-memory is handled gracefully - in-flight requests complete, new isolate spawned
- Use streaming APIs (`TransformStream`, `node:stream`) to avoid buffering large objects

### CPU Time Limits
- **Default**: 30 seconds CPU time
- **Maximum**: 5 minutes (300,000ms) with `cpu_ms` configuration
- CPU time ≠ wall clock time - waiting on I/O does not count
- Most Workers use <1-2ms CPU time per request

### Worker Size Limits
| Plan | Compressed (gzip) | Uncompressed |
|------|-------------------|--------------|
| Free | 1 MB | N/A |
| Paid | 10 MB | N/A |

### Subrequest Limits
- **50 subrequests** per request (Free plan)
- **1000 subrequests** per request (Paid plan)
- **32 Worker invocations** per request (Service Bindings chain limit)

### Environment Variables & Secrets
- Accessed via `env` object passed to handlers
- With `nodejs_compat` and compatibility date `2025-04-01+`, also available on `process.env`
- `process.env` values are always strings (Node.js behavior)
- Use Cloudflare Secrets Store for enhanced secret management

---

## Core Compute Primitives

### Workers
**What it is**: Stateless JavaScript/TypeScript functions running on Cloudflare's global network.

**Key characteristics**:
- Executes in V8 isolate at nearest data center
- Fresh isolate per request (may reuse warm isolate)
- ES Modules syntax is standard
- Supports JavaScript, TypeScript, Python, Rust (via WASM)

**Handler types**:
```typescript
export default {
  // HTTP request handler
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {},
  
  // Cron trigger handler
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {},
  
  // Queue consumer handler
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {},
  
  // Email handler
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {},
  
  // Tail worker handler
  async tail(events: TraceItem[], env: Env, ctx: ExecutionContext): Promise<void> {},
}
```

**Compatibility flags** (critical for TypeScript projects):
```jsonc
// wrangler.jsonc
{
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

---

### Durable Objects
**What it is**: Single, globally-routed, stateful compute instances bound to a unique ID.

**Key characteristics**:
- Exactly ONE instance per ID globally
- All requests for an ID route to same instance
- Co-located compute + storage (zero-latency to storage)
- Supports WebSockets with hibernation
- Strong consistency guarantees

**Storage backends**:
1. **SQLite** (RECOMMENDED for all new classes)
   - 10 GB per object
   - SQL queries via `ctx.storage.sql`
   - Point-in-time recovery (30 days)
   - Full-text search (FTS5), JSON functions
   - KV API also available

2. **Key-Value** (Legacy)
   - 128 KB value limit
   - Only for backwards compatibility

**Configuration**:
```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "MY_DO", "class_name": "MyDurableObject" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["MyDurableObject"] }
  ]
}
```

**TypeScript pattern**:
```typescript
import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject {
  sql: SqlStorage;
  
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
  }
  
  async fetch(request: Request): Promise<Response> {
    // Handle request
  }
  
  // Alarm API
  async alarm(): Promise<void> {
    // Scheduled wake-up
  }
}
```

**Accessing from Worker**:
```typescript
const id = env.MY_DO.idFromName("user-123");
const stub = env.MY_DO.get(id);
const response = await stub.fetch(request);
// Or via RPC:
const result = await stub.myMethod(args);
```

**WebSocket Hibernation**: Reduces costs during inactive periods while preserving state.

---

### Containers (Public Beta - June 2025)
**What it is**: Full OCI containers running alongside Workers.

**Key characteristics**:
- Built on Durable Objects architecture
- Controlled/orchestrated by Workers
- 3 instance sizes: dev (256MB), basic (1GB), standard (4GB)
- Sleep timeout for cost optimization
- Global deployment ("Region: Earth")
- R2 FUSE mounts supported

**Use cases**:
- User-generated code execution
- FFmpeg/media processing
- CLI tools requiring full Linux environment
- Porting existing Docker apps

**Configuration**:
```jsonc
{
  "containers": [{
    "class_name": "MyContainer",
    "image": "./Dockerfile",
    "max_instances": 5
  }],
  "durable_objects": {
    "bindings": [
      { "name": "MY_CONTAINER", "class_name": "MyContainer" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["MyContainer"] }
  ]
}
```

**Limitations (Beta)**:
- No autoscaling yet (manual via DO `get()`)
- No latency-aware routing yet
- 40 GiB memory / 40 vCPU total concurrent limit

---

### Workflows (GA - April 2025)
**What it is**: Durable execution engine for multi-step, long-running applications.

**Key characteristics**:
- Automatic retries
- State persistence (minutes to weeks)
- Built on Durable Objects
- Supports TypeScript and Python
- `waitForEvent` API for event-driven steps

**Configuration**:
```jsonc
{
  "workflows": [{
    "name": "my-workflow",
    "binding": "MY_WORKFLOW",
    "class_name": "MyWorkflow"
  }]
}
```

**TypeScript pattern**:
```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const result1 = await step.do("step-1", async () => {
      // Step logic - automatically retried on failure
      return { data: "processed" };
    });
    
    await step.sleep("wait", "30 minutes");
    
    const externalEvent = await step.waitForEvent<EventType>("wait-for-approval", {
      type: "approval-event",
      timeout: "1 hour"
    });
    
    await step.sleepUntil("schedule", new Date("2025-12-01"));
  }
}
```

**Pricing**:
- CPU time based (not wall time)
- Storage: 1 GB included, then per-GB
- State expires: 3 days (Free), 30 days (Paid)

---

## Storage Primitives

### R2 (Object Storage)
**What it is**: S3-compatible object storage with zero egress fees.

**Key characteristics**:
- S3 API compatible
- No egress fees
- Globally cached reads
- Storage location pinned
- Multipart uploads

**Configuration**:
```jsonc
{
  "r2_buckets": [{
    "binding": "MY_BUCKET",
    "bucket_name": "my-bucket"
  }]
}
```

**TypeScript API**:
```typescript
// Write
await env.MY_BUCKET.put("key", data, {
  httpMetadata: { contentType: "application/json" },
  customMetadata: { userId: "123" }
});

// Read
const object = await env.MY_BUCKET.get("key");
const data = await object.text(); // or .json(), .arrayBuffer(), .body (stream)

// List
const listed = await env.MY_BUCKET.list({ prefix: "folder/", limit: 100 });

// Delete
await env.MY_BUCKET.delete("key");

// Multipart
const upload = await env.MY_BUCKET.createMultipartUpload("large-file");
const part1 = await upload.uploadPart(1, chunk1);
await upload.complete([part1]);
```

**Limits**:
- Object size: 5 TB max
- Metadata: 2 KB
- No limit on total storage (paid accounts)

---

### Workers KV
**What it is**: Globally distributed key-value store with eventual consistency.

**Key characteristics**:
- Read-optimized (cached at edge)
- Eventually consistent (writes propagate asynchronously)
- Best for: session data, config, API keys, rarely-changed data
- NOT for real-time or strong consistency needs

**Configuration**:
```jsonc
{
  "kv_namespaces": [{
    "binding": "MY_KV",
    "id": "abc123"
  }]
}
```

**TypeScript API**:
```typescript
// Write (1 write/sec per key limit)
await env.MY_KV.put("key", value, {
  expiration: 1700000000, // Unix timestamp
  expirationTtl: 3600,    // Seconds from now
  metadata: { userId: "123" }
});

// Read
const value = await env.MY_KV.get("key"); // string
const json = await env.MY_KV.get("key", { type: "json" });
const withMeta = await env.MY_KV.getWithMetadata("key");

// List
const list = await env.MY_KV.list({ prefix: "user:", limit: 100 });

// Delete
await env.MY_KV.delete("key");
```

**Limits**:
- Key size: 512 bytes
- Value size: 25 MB
- Metadata: 1024 bytes
- Write rate: 1 write/sec per key

**Architecture Update (2025)**: KV now stores all data on Cloudflare infrastructure with dual-provider redundancy. Large objects automatically route to R2 backend.

---

## Database Primitives

### D1 (Serverless SQLite)
**What it is**: Serverless SQL database built on SQLite.

**Key characteristics**:
- Read replicas for global performance
- SQLite dialect
- 10 GB max per database
- Automatic backups
- Smart Placement aware

**Configuration**:
```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "my-db",
    "database_id": "xxx"
  }]
}
```

**TypeScript API**:
```typescript
// Query
const { results } = await env.DB.prepare(
  "SELECT * FROM users WHERE id = ?"
).bind(userId).all();

// Single row
const user = await env.DB.prepare(
  "SELECT * FROM users WHERE id = ?"
).bind(userId).first();

// Execute (INSERT/UPDATE/DELETE)
const { success, meta } = await env.DB.prepare(
  "INSERT INTO users (name, email) VALUES (?, ?)"
).bind(name, email).run();

// Batch
const results = await env.DB.batch([
  env.DB.prepare("INSERT INTO logs (msg) VALUES (?)").bind("log1"),
  env.DB.prepare("INSERT INTO logs (msg) VALUES (?)").bind("log2"),
]);

// Raw (no prepared statement)
const { results } = await env.DB.exec("SELECT 1");
```

**When to use D1 vs SQLite in Durable Objects**:
- **D1**: Traditional architecture, HTTP API access, managed observability, query insights
- **DO SQLite**: Co-located compute+storage, per-user/per-entity databases, distributed systems

---

### Hyperdrive
**What it is**: Connection pooler and query accelerator for external PostgreSQL/MySQL databases.

**Key characteristics**:
- Eliminates connection overhead (7 round trips → 1)
- Global connection pooling
- Query caching for reads
- Transaction mode pooling
- Supports: Postgres, MySQL, PlanetScale, Neon, CockroachDB, Timescale

**Configuration**:
```jsonc
{
  "hyperdrive": [{
    "binding": "HYPERDRIVE",
    "id": "xxx",
    "localConnectionString": "postgres://..."
  }]
}
```

**TypeScript usage** (with any Postgres driver):
```typescript
import postgres from "postgres";

export default {
  async fetch(request: Request, env: Env) {
    const sql = postgres(env.HYPERDRIVE.connectionString);
    const results = await sql`SELECT * FROM users`;
    return Response.json(results);
  }
}
```

**MySQL usage**:
```typescript
import { createConnection } from "mysql2/promise";

const connection = await createConnection({
  host: env.HYPERDRIVE.host,
  user: env.HYPERDRIVE.user,
  password: env.HYPERDRIVE.password,
  database: env.HYPERDRIVE.database,
  port: env.HYPERDRIVE.port,
});
```

**Key improvement (March 2025)**: Connection pools now placed near your database, reducing uncached query latency by up to 90%.

---

## Messaging & Orchestration

### Queues
**What it is**: Guaranteed message delivery queue for async processing.

**Key characteristics**:
- At-least-once delivery
- Batching (configurable)
- Retries with backoff
- No egress charges
- Pull-based consumers available

**Configuration**:
```jsonc
{
  "queues": {
    "producers": [{
      "binding": "MY_QUEUE",
      "queue": "my-queue"
    }],
    "consumers": [{
      "queue": "my-queue",
      "max_batch_size": 10,
      "max_batch_timeout": 60,
      "max_retries": 3,
      "dead_letter_queue": "my-dlq"
    }]
  }
}
```

**Producer API**:
```typescript
// Single message
await env.MY_QUEUE.send({ userId: "123", action: "process" });

// Batch
await env.MY_QUEUE.sendBatch([
  { body: { id: 1 } },
  { body: { id: 2 }, delaySeconds: 60 }
]);
```

**Consumer handler**:
```typescript
export default {
  async queue(batch: MessageBatch<MyMessage>, env: Env) {
    for (const message of batch.messages) {
      try {
        await processMessage(message.body);
        message.ack();
      } catch (e) {
        message.retry({ delaySeconds: 60 });
      }
    }
  }
}
```

---

### Pipelines (Beta - 2025)
**What it is**: Streaming data ingestion service built on Arroyo.

**Key characteristics**:
- HTTP or Worker binding ingestion
- SQL-based transformations
- Sinks to R2 (JSON, Parquet) or R2 Data Catalog (Iceberg)
- ~100,000 records/sec per pipeline
- Exactly-once delivery

**CLI Creation**:
```bash
npx wrangler@latest pipelines create my-pipeline --r2-bucket my-bucket
```

---

### Event Notifications (R2)
**What it is**: Event-driven triggers on R2 bucket operations.

**Use cases**:
- Process uploads asynchronously
- Update search indexes
- Trigger Workflows on data changes

---

## AI & Vector Primitives

### Workers AI
**What it is**: Serverless AI inference on Cloudflare's GPU network.

**Key characteristics**:
- Serverless GPUs
- Popular models: Llama 3.3, Mistral, Stable Diffusion, Whisper
- Automatic model placement near users
- Speculative decoding, prefix caching (2-4x faster)
- Batch/async API for non-latency-sensitive workloads

**Configuration**:
```jsonc
{
  "ai": { "binding": "AI" }
}
```

**TypeScript API**:
```typescript
// Text generation
const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
  messages: [{ role: "user", content: "Hello" }],
  stream: true
});

// Embeddings
const embeddings = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
  text: ["Hello world", "Another text"]
});

// Image generation
const image = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
  prompt: "A cat"
});

// Speech to text
const transcription = await env.AI.run("@cf/openai/whisper", {
  audio: audioArrayBuffer
});
```

---

### Vectorize
**What it is**: Globally distributed vector database.

**Key characteristics**:
- Pairs with Workers AI for RAG
- Bring your own embeddings (OpenAI, etc.)
- Semantic search, recommendations, classification

**Configuration**:
```jsonc
{
  "vectorize": [{
    "binding": "VECTORIZE",
    "index_name": "my-index"
  }]
}
```

**TypeScript API**:
```typescript
// Upsert vectors
await env.VECTORIZE.upsert([
  { id: "doc1", values: embeddings[0], metadata: { title: "Doc 1" } }
]);

// Query
const results = await env.VECTORIZE.query(queryVector, {
  topK: 10,
  returnValues: true,
  returnMetadata: true,
  filter: { category: "tech" }
});
```

---

### AI Gateway
**What it is**: Observability, caching, and rate limiting for AI applications.

**Features**:
- Analytics and logging
- Response caching
- Rate limiting
- Model fallback
- Works with Workers AI + external providers (OpenAI, etc.)

---

### Agents SDK
**What it is**: Framework for building AI agents on Workers.

**Key features**:
- State management with Durable Objects
- MCP (Model Context Protocol) server/client support
- WebSocket support for real-time
- OAuth integration for MCP auth
- Hibernation for cost optimization

**MCP Server example**:
```typescript
import { MCPAgent } from "agents";

export class MyMCPServer extends MCPAgent {
  // Define tools, resources, prompts
}
```

---

## Network & Connectivity

### Service Bindings (Worker-to-Worker)
**What it is**: Private, direct Worker-to-Worker communication.

**Key characteristics**:
- No public Internet exposure
- Zero-latency (same thread often)
- RPC support (JavaScript-native)
- Type-safe with TypeScript

**Configuration**:
```jsonc
{
  "services": [{
    "binding": "AUTH_SERVICE",
    "service": "auth-worker"
  }]
}
```

**HTTP mode**:
```typescript
const response = await env.AUTH_SERVICE.fetch(request);
```

**RPC mode** (requires `rpc` compatibility flag):
```typescript
// Target worker exports WorkerEntrypoint
const result = await env.AUTH_SERVICE.validateToken(token);
```

---

### Workers VPC (Coming Late 2025)
**What it is**: Private connectivity from Workers to external cloud VPCs.

**Status**: Early preview planned for late 2025.

**Use case**: Access databases and APIs in AWS/GCP/Azure VPCs without public Internet.

---

### Browser Rendering
**What it is**: Serverless headless Chromium instances.

**Key characteristics**:
- Puppeteer and Playwright support
- Session reuse with Durable Objects
- REST API for simple operations

**Configuration**:
```jsonc
{
  "browser": { "binding": "BROWSER" }
}
```

**TypeScript (Puppeteer)**:
```typescript
import puppeteer from "@cloudflare/puppeteer";

const browser = await puppeteer.launch(env.BROWSER);
const page = await browser.newPage();
await page.goto("https://example.com");
const screenshot = await page.screenshot();
await browser.close();
```

**Limits**:
- Free: 10 minutes/day
- Paid: Higher limits, multiple concurrent sessions

---

## Observability & Analytics

### Workers Logs
**What it is**: Structured logging with correlation.

**Configuration**:
```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1.0
  }
}
```

**Usage**:
```typescript
console.log("Info message");
console.error("Error message");
```

---

### Analytics Engine
**What it is**: Time-series analytics for custom metrics.

**Key characteristics**:
- Unlimited cardinality
- SQL queries
- Low-latency reporting
- 90-day retention

**Configuration**:
```jsonc
{
  "analytics_engine_datasets": [{
    "binding": "ANALYTICS",
    "dataset": "my-metrics"
  }]
}
```

**Write data**:
```typescript
env.ANALYTICS.writeDataPoint({
  blobs: ["user-123", "us-west"],
  doubles: [latencyMs],
  indexes: ["api-endpoint"]
});
```

**Query** (SQL API):
```sql
SELECT 
  toStartOfInterval(timestamp, INTERVAL 5 MINUTE) as interval,
  AVG(double1) as avg_latency
FROM my-metrics
WHERE timestamp > NOW() - INTERVAL 1 DAY
GROUP BY interval
```

---

### Tail Workers
**What it is**: Workers that receive logs from other Workers.

**Use case**: Send logs to external services, custom analytics.

---

## Node.js Compatibility

### Enabling Node.js APIs
```jsonc
{
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

### Fully Supported Node.js Modules
- `node:assert`
- `node:async_hooks` (AsyncLocalStorage)
- `node:buffer`
- `node:crypto`
- `node:diagnostics_channel`
- `node:dns`
- `node:events`
- `node:http` / `node:https` (client + server with compat date 2025-09-01+)
- `node:net`
- `node:path`
- `node:process`
- `node:querystring`
- `node:stream` / `node:stream/web`
- `node:string_decoder`
- `node:timers`
- `node:tls`
- `node:url`
- `node:util`
- `node:zlib` (includes Brotli)

### process.env
- Available with `nodejs_compat` and compatibility date `2025-04-01+`
- All values are strings
- Accessible globally (including in third-party libraries)

### Polyfilled Modules
With `nodejs_compat_v2` (auto-enabled for dates >= 2024-09-23):
- Many modules polyfilled via `unenv`
- Calling unsupported methods throws descriptive errors
- Allows importing packages that use these modules

### Working NPM Packages (confirmed)
- `postgres` / `pg` (via Hyperdrive)
- `mysql2` (via Hyperdrive)
- `mongodb`
- `body-parser`
- `jsonwebtoken`
- `got`
- `passport`
- `knex`
- `csv-stringify`
- `mammoth`
- Many more...

---

## What Does NOT Work on Workers

### Fundamental Limitations

1. **No persistent global state between requests**
   - Isolates may be evicted
   - Use Durable Objects or KV for persistence

2. **No file system**
   - `node:fs` throws errors
   - Use R2 or KV for storage
   - Containers available if true filesystem needed

3. **Cannot reuse connections across requests**
   ```typescript
   // BAD - Will fail with "Cannot perform I/O on behalf of a different request"
   const globalClient = postgres(connectionString);
   
   // GOOD - Create per-request
   export default {
     async fetch(request, env) {
       const client = postgres(env.HYPERDRIVE.connectionString);
       // use client
     }
   }
   ```

4. **No raw TCP/UDP sockets** (except via Connect API for specific use cases)

5. **No child processes / spawn**

6. **No native addons / binary Node modules**

7. **localStorage / sessionStorage NOT available**
   - Use KV, R2, or Durable Objects instead

### Node.js APIs NOT Supported

- `node:child_process` - No spawning processes
- `node:cluster` - No clustering
- `node:fs` - No filesystem (polyfill throws)
- `node:inspector` - No debugging protocol
- `node:os` - Limited/stubbed
- `node:perf_hooks` - Partial
- `node:readline` - No stdin
- `node:repl` - No REPL
- `node:tty` - No TTY
- `node:v8` - No V8 access
- `node:vm` - Security restrictions
- `node:worker_threads` - Use Workers architecture instead

### Common Package Gotchas

1. **XMLHttpRequest** - Not available
   - Use `fetch()` instead

2. **eval()** - Restricted
   - Use alternatives or request allowlist

3. **Long-running connections**
   - WebSockets: Use Durable Objects
   - Database: Use Hyperdrive

4. **Packages requiring native bindings**
   - bcrypt → use `bcryptjs`
   - sharp → use Cloudflare Images or Workers AI
   - puppeteer → use `@cloudflare/puppeteer`

5. **Packages using unsupported Node APIs**
   - Check error messages for specific API
   - Use module aliasing to provide alternatives

### Module Aliasing for Incompatible Packages
```jsonc
// wrangler.jsonc
{
  "alias": {
    "node-fetch": "./fetch-shim.js"
  }
}
```

```typescript
// fetch-shim.js
export default fetch;
export { fetch };
```

---

## Bindings Reference

### All Binding Types
```jsonc
{
  // Environment variables
  "vars": {
    "API_KEY": "value",
    "CONFIG": { "nested": "object" }
  },
  
  // KV Namespaces
  "kv_namespaces": [{ "binding": "KV", "id": "xxx" }],
  
  // R2 Buckets
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "xxx" }],
  
  // D1 Databases
  "d1_databases": [{ "binding": "DB", "database_name": "xxx", "database_id": "xxx" }],
  
  // Durable Objects
  "durable_objects": {
    "bindings": [{ "name": "DO", "class_name": "MyDO" }]
  },
  
  // Service Bindings
  "services": [{ "binding": "SERVICE", "service": "worker-name" }],
  
  // Queues
  "queues": {
    "producers": [{ "binding": "QUEUE", "queue": "queue-name" }],
    "consumers": [{ "queue": "queue-name" }]
  },
  
  // Hyperdrive
  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "xxx" }],
  
  // Workers AI
  "ai": { "binding": "AI" },
  
  // Vectorize
  "vectorize": [{ "binding": "VECTORIZE", "index_name": "xxx" }],
  
  // Analytics Engine
  "analytics_engine_datasets": [{ "binding": "ANALYTICS", "dataset": "xxx" }],
  
  // Browser Rendering
  "browser": { "binding": "BROWSER" },
  
  // Workflows
  "workflows": [{ "name": "xxx", "binding": "WORKFLOW", "class_name": "MyWorkflow" }],
  
  // Containers
  "containers": [{ "class_name": "MyContainer", "image": "./Dockerfile" }],
  
  // Secrets Store
  "secrets_store": { "binding": "SECRETS", "store_id": "xxx" },
  
  // Assets
  "assets": { "directory": "./dist", "binding": "ASSETS" }
}
```

### Accessing env from Anywhere
```typescript
import { env } from "cloudflare:workers";

// Now accessible in any module without prop drilling
const value = env.MY_KV.get("key");
```

---

## Configuration Reference

### wrangler.jsonc Complete Template
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  
  // CPU limit (ms)
  "cpu_ms": 30000, // default, max 300000
  
  // Cron triggers
  "triggers": {
    "crons": ["0 * * * *", "*/30 * * * *"]
  },
  
  // Routes
  "routes": [
    { "pattern": "example.com/*", "zone_name": "example.com" }
  ],
  
  // Smart Placement
  "placement": { "mode": "smart" },
  
  // Observability
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1.0
  },
  
  // Migrations for DO
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["MyDO"] }
  ]
}
```

### Compatibility Date Milestones
| Date | Notable Changes |
|------|-----------------|
| 2024-09-23 | `nodejs_compat_v2` auto-enabled |
| 2025-04-01 | `process.env` available |
| 2025-05-05 | `FinalizationRegistry` available |
| 2025-09-01 | `node:http` server modules |
| 2025-09-15 | Enhanced `process` module |

---

## Announced But Not Yet Available

### Workers VPC (Late 2025)
- Private connectivity to external cloud VPCs
- Bidirectional traffic support planned

### Container Autoscaling
- `autoscale = true` configuration
- Latency-aware routing

### Additional Container Features
- `exec` command for shell access
- HTTP handlers from container to Worker

### Enhanced MCP Features
- Resumability for long-running operations
- Cancellability
- Enhanced session management

---

## Quick Decision Guide

### Storage Selection
| Need | Use |
|------|-----|
| Large files, S3 compatibility | R2 |
| Config, sessions, cache | KV |
| Relational data, global | D1 |
| Per-user/entity SQL, strong consistency | DO SQLite |
| External Postgres/MySQL | Hyperdrive |
| Time-series metrics | Analytics Engine |
| Vector embeddings | Vectorize |

### Compute Selection
| Need | Use |
|------|-----|
| Stateless request handling | Workers |
| Stateful, per-ID coordination | Durable Objects |
| Multi-step, long-running tasks | Workflows |
| Full Linux/Docker | Containers |
| AI inference | Workers AI |
| Browser automation | Browser Rendering |

### Messaging Selection
| Need | Use |
|------|-----|
| Guaranteed delivery, retries | Queues |
| High-volume data ingestion | Pipelines |
| Event triggers on storage | Event Notifications |
| Real-time bidirectional | WebSockets (via DO) |
| Worker-to-Worker | Service Bindings |

---

## Version Information

**Document Version**: November 2025
**Key Sources**: 
- Cloudflare Developer Docs
- Cloudflare Blog (Builder Day 2024, Developer Week 2025, Birthday Week 2025)
- Cloudflare Changelog

**When referencing this document, always verify against latest Cloudflare docs for breaking changes.**