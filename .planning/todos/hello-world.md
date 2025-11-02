# Conductor V1 - Build Plan (Today)

## Vision
Build a working Cloudflare Workers-based orchestration engine that executes YAML-defined workflows. When someone starts a new conductor project, they get a baseline to build their own agents and ensembles.

## Cloudflare Stack
- **Workers** - Runtime for conductor
- **KV** - Caching layer
- **R2** - Large file storage
- **D1** - Structured data
- **AI Gateway** - LLM call management
- **Analytics Engine** - Telemetry
- **API Gateway** - Rate limiting, auth, routing

---

# Phase 1: Project Foundation (30 min)

## 1.1 Project Structure
```
conductor/
  src/
    index.js                 # Worker entry point
    runtime/
      executor.js            # Core execution engine
      state-manager.js       # State management
      parser.js              # YAML parser
    members/
      base-member.js         # Member base class
    utils/
      cache.js               # KV cache wrapper
      normalize.js           # Input normalization
  ensembles/
    hello-world.yaml         # Example ensemble
  members/
    example-agent/
      member.yaml            # Member definition
      index.js               # Member implementation
  wrangler.toml              # Cloudflare config
  package.json
  README.md
```

**Tasks:**
- [x] Read existing structure
- [ ] Create base folder structure
- [ ] Initialize package.json with dependencies
- [ ] Create wrangler.toml with bindings (KV, D1, AI Gateway)

---

# Phase 2: Core Runtime (1 hour)

## 2.1 YAML Parser (15 min)
**File:** `src/runtime/parser.js`

Parse ensemble YAML into executable format:
- Load YAML file
- Validate schema (name, flow, inputs, outputs)
- Return parsed ensemble object

**Schema Support:**
```yaml
name: string
description: string
state?: { schema, initial }
flow: Array<step>
output?: object
```

## 2.2 State Manager (15 min)
**File:** `src/runtime/state-manager.js`

Implement basic state management:
- `constructor(config)` - Initialize with schema
- `getStateForMember(memberName, config)` - Return subset for member
- `setStateFromMember(memberName, updates, config)` - Update state
- `getState()` - Get current state snapshot

## 2.3 Base Member (15 min)
**File:** `src/members/base-member.js`

Create member base class:
- `execute(input, context)` - Standard interface
- Response wrapping (success, data, timestamp, cached, executionTime)
- Error handling
- Cache key generation

## 2.4 Core Executor (15 min)
**File:** `src/runtime/executor.js`

Build execution engine:
- Load ensemble YAML
- Initialize state manager
- Execute flow steps sequentially
- Resolve input interpolations (${input.x}, ${state.y})
- Return standardized response

---

# Phase 3: Member Types (1 hour)

## 3.1 Think Member (15 min)
**File:** `src/members/think-member.js`

AI reasoning with Cloudflare AI Gateway:
- Call OpenAI/Anthropic via AI Gateway
- Support model, temperature, max_tokens config
- Structured output parsing
- Token usage tracking

## 3.2 Function Member (15 min)
**File:** `src/members/function-member.js`

Execute user-defined JavaScript:
- Load function from member directory
- Execute with input + context
- Return result
- Error boundary

## 3.3 Data Member (15 min)
**File:** `src/members/data-member.js`

Database operations:
- KV read/write operations
- D1 SQL queries
- R2 object storage
- Return structured results

## 3.4 API Member (15 min)
**File:** `src/members/api-member.js`

HTTP endpoint calls:
- fetch() wrapper
- Method, headers, body config
- Response parsing
- Timeout handling

---

# Phase 4: Caching Layer (30 min)

## 4.1 Cache Manager
**File:** `src/utils/cache.js`

KV-based caching:
- `generateKey(member, input)` - Create cache key with normalization
- `get(key)` - Retrieve from KV
- `set(key, value, ttl)` - Store with TTL
- `invalidate(key)` - Clear cache

## 4.2 Input Normalization
**File:** `src/utils/normalize.js`

Standardize inputs for cache consistency:
- `normalizeDomain(url)` - Extract domain
- `normalizeText(text)` - Trim, lowercase
- `normalizeObject(obj)` - Sort keys, stable stringify

---

# Phase 5: API Layer (45 min)

## 5.1 Worker Entry Point (15 min)
**File:** `src/index.js`

Cloudflare Worker request handler:
```javascript
export default {
  async fetch(request, env, ctx) {
    const router = new Router();

    // API routes
    router.post('/conductor/ensemble/:name', handleEnsemble);
    router.post('/conductor/member/:name', handleMember);
    router.get('/conductor/health', handleHealth);

    return router.handle(request, env, ctx);
  }
}
```

## 5.2 Route Handlers (15 min)
**File:** `src/api/handlers.js`

Implement route handlers:
- `handleEnsemble` - Load YAML, execute, return result
- `handleMember` - Execute single member
- `handleHealth` - Return status

## 5.3 Authentication (15 min)
**File:** `src/api/auth.js`

Static API key validation:
- Check `x-api-key` header
- Compare against env.API_KEYS (comma-separated)
- Return 401 if invalid
- Attach metadata to context

---

# Phase 6: Example Implementation (30 min)

## 6.1 Hello World Ensemble
**File:** `ensembles/hello-world.yaml`

Simple demonstration:
```yaml
name: hello-world
description: Basic ensemble example

flow:
  - member: greet
    input:
      name: ${input.name}
```

## 6.2 Example Member
**File:** `members/greet/member.yaml`

```yaml
name: greet
type: Function
description: Greet the user
schema:
  input:
    name: string
  output:
    message: string
```

**File:** `members/greet/index.js`

```javascript
export default async function greet({ input }) {
  return {
    message: `Hello, ${input.name}! Welcome to Conductor.`
  };
}
```

## 6.3 Company Intelligence Ensemble
**File:** `ensembles/company-intelligence.yaml`

Real-world example with state:
```yaml
name: company-intelligence
description: Analyze a company comprehensively

state:
  schema:
    companyData: object
    analysis: object

flow:
  - member: fetch-company-data
    state:
      set: [companyData]
    input:
      domain: ${input.domain}
    cache:
      ttl: 3600

  - member: analyze-company
    state:
      use: [companyData]
      set: [analysis]
    input:
      data: ${state.companyData}
```

---

# Phase 7: Development Tools (30 min)

## 7.1 CLI Commands
**File:** `package.json` scripts

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest",
    "validate": "node scripts/validate.js"
  }
}
```

## 7.2 Validation Script
**File:** `scripts/validate.js`

Validate all ensembles and members:
- Check YAML syntax
- Validate member references
- Check input/output schemas
- Report errors

## 7.3 Local Testing
**File:** `scripts/test-local.js`

Test ensembles locally:
- Load ensemble
- Execute with test inputs
- Display results
- No deployment needed

---

# Phase 8: Configuration (15 min)

## 8.1 Wrangler Config
**File:** `wrangler.toml`

```toml
name = "conductor"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "DB"
database_name = "conductor-db"
database_id = "your-db-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "conductor-storage"

[ai]
binding = "AI"

[[analytics_engine_datasets]]
binding = "ANALYTICS"

[vars]
ENVIRONMENT = "production"

[observability]
enabled = true
```

## 8.2 Environment Variables
**File:** `.dev.vars` (local development)

```
API_KEYS=dev-key-123,test-key-456
AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/...
OPENAI_API_KEY=sk-...
```

---

# Phase 9: Documentation (30 min)

## 9.1 README
**File:** `README.md`

- Quick start guide
- Project structure overview
- Creating members
- Creating ensembles
- Deployment instructions

## 9.2 Member Guide
**File:** `docs/members.md`

- Member types
- Schema definition
- Implementation patterns
- Testing members

## 9.3 Ensemble Guide
**File:** `docs/ensembles.md`

- YAML structure
- Flow control
- State management
- Input/output handling

---

# Phase 10: Testing & Deploy (30 min)

## 10.1 Integration Test
Test hello-world ensemble:
```bash
npm run dev
curl -X POST http://localhost:8787/conductor/ensemble/hello-world \
  -H "x-api-key: dev-key-123" \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "message": "Hello, World! Welcome to Conductor."
  },
  "timestamp": "2025-01-02T...",
  "cached": false,
  "executionTime": 45
}
```

## 10.2 Deploy to Cloudflare
```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"

# Create D1 database
wrangler d1 create conductor-db

# Create R2 bucket
wrangler r2 bucket create conductor-storage

# Deploy
npm run deploy
```

## 10.3 Production Test
```bash
curl -X POST https://your-worker.workers.dev/conductor/ensemble/hello-world \
  -H "x-api-key: prod-key-xyz" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production"}'
```

---

# Success Criteria

## Must Have (Today)
- [ ] Sequential flow execution
- [ ] State management (shared context)
- [ ] 4 member types (Think, Function, Data, API)
- [ ] KV caching with TTL
- [ ] API routes with auth
- [ ] Hello world working end-to-end
- [ ] Deployed to Cloudflare Workers

## Nice to Have (If Time)
- [ ] Parallel execution (basic Promise.all)
- [ ] Validation CLI command
- [ ] Error handling with retries
- [ ] Basic telemetry to Analytics Engine

## Explicitly NOT Today
- [ ] MCP integration
- [ ] Webhook support
- [ ] Scoring system
- [ ] n8n integration
- [ ] Advanced error handling
- [ ] Ensemble Cloud UI
- [ ] External auth (Unkey)

---

# Implementation Order (Optimized Path)

1. **Setup** (15 min)
   - Create folder structure
   - Initialize package.json
   - Configure wrangler.toml

2. **Core Runtime** (45 min)
   - YAML parser
   - State manager
   - Base executor
   - Base member class

3. **Member Types** (45 min)
   - Function member (simplest)
   - Think member (AI Gateway)
   - Data member (KV/D1)
   - API member (fetch)

4. **Caching** (20 min)
   - Cache manager
   - Input normalization

5. **API Layer** (30 min)
   - Worker entry point
   - Route handlers
   - Auth middleware

6. **Examples** (20 min)
   - Hello world ensemble
   - Greet member
   - Test locally

7. **Deploy** (15 min)
   - Create resources
   - Deploy to Cloudflare
   - Test in production

**Total: ~3 hours of focused work**

---

# Quick Reference

## Member Definition Template
```yaml
name: member-name
type: Function | Think | Data | API
description: What this member does

config:
  # Type-specific config

schema:
  input:
    param1: string
  output:
    result: string
```

## Ensemble Definition Template
```yaml
name: ensemble-name
description: What this ensemble does

state:
  schema:
    key1: string
  initial:
    key1: "default"

flow:
  - member: member-name
    state:
      use: [key1]
      set: [key1]
    input:
      param: ${input.value}
    cache:
      ttl: 3600
```

## Development Commands
```bash
# Local development
npm run dev

# Test ensemble
curl -X POST http://localhost:8787/conductor/ensemble/hello-world \
  -H "x-api-key: dev-key-123" \
  -d '{"name": "Test"}'

# Deploy
npm run deploy

# Validate all YAML files
npm run validate
```

---

# Next Steps (After Today)

Once basic functionality works, we can incrementally add:
1. Parallel execution (DAG-based)
2. Advanced error handling (fallbacks, circuit breakers)
3. Scoring system
4. Webhook support
5. MCP integration
6. CLI for ensemble management
7. Ensemble Cloud UI
8. Advanced auth (Unkey)
9. n8n integration
10. Advanced telemetry

**Philosophy:** Ship working v1 today, iterate rapidly.
