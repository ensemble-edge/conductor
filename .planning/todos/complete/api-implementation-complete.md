# API Implementation: World-Class REST API for Conductor

**Status:** 🔴 Critical Gap - src/api/ is empty
**Priority:** P0 - Required for production deployments
**Philosophy:** Edge-first, developer-friendly, production-ready API inspired by Stripe, Vercel, and OpenAI

---

## Executive Summary

Conductor needs a world-class REST API that enables users to deploy their AI agent projects to production. The API should be:
- **Edge-native** - Optimized for Cloudflare Workers
- **Developer-friendly** - Excellent DX with auto-generated docs
- **Production-ready** - Authentication, rate limiting, observability
- **Streaming-capable** - SSE for real-time Think member responses
- **Multi-tenant** - Support multiple projects/workspaces
- **Type-safe** - Auto-generated SDKs from OpenAPI spec

**Inspiration:**
- Stripe API - Excellent error handling, SDK generation
- Vercel API - Edge-native, multi-tenant
- OpenAI API - Streaming responses, async patterns
- GitHub API - Comprehensive, well-documented

---

## Core API Architecture

### 1. Request Flow

```
Client Request
  ↓
Edge Router (Cloudflare Workers)
  ↓
Authentication Middleware
  ↓
Rate Limiting Middleware
  ↓
Request Validation (Zod)
  ↓
API Handler (Ensemble Executor)
  ↓
Response Formatter
  ↓
Client Response (JSON/SSE)
```

### 2. Directory Structure

```
src/api/
├── routes/
│   ├── ensembles/
│   │   ├── execute.ts         # POST /v1/ensembles/:name/execute
│   │   ├── stream.ts          # POST /v1/ensembles/:name/stream (SSE)
│   │   ├── status.ts          # GET /v1/executions/:id
│   │   └── cancel.ts          # POST /v1/executions/:id/cancel
│   ├── members/
│   │   ├── list.ts            # GET /v1/members
│   │   ├── get.ts             # GET /v1/members/:name
│   │   └── validate.ts        # POST /v1/members/:name/validate
│   ├── projects/
│   │   ├── list.ts            # GET /v1/projects
│   │   ├── get.ts             # GET /v1/projects/:id
│   │   └── deploy.ts          # POST /v1/projects (deploy new)
│   └── health.ts              # GET /health
├── middleware/
│   ├── auth.ts                # API key validation
│   ├── rate-limit.ts          # Rate limiting
│   ├── cors.ts                # CORS headers
│   ├── validate.ts            # Request validation
│   ├── error-handler.ts       # Standardized errors
│   └── telemetry.ts           # OpenTelemetry tracing
├── schemas/
│   ├── execute-request.ts     # Zod schemas for validation
│   ├── execute-response.ts
│   ├── error-response.ts
│   └── openapi.ts             # OpenAPI spec generation
├── client/
│   ├── sdk-generator.ts       # Auto-generate TypeScript SDK
│   └── examples/              # SDK usage examples
├── webhooks/
│   ├── webhook-manager.ts     # Webhook delivery
│   └── webhook-events.ts      # Event types
└── router.ts                  # Main API router
```

---

## API Endpoints

### Core Execution Endpoints

#### 1. Execute Ensemble (Synchronous)
```http
POST /v1/ensembles/:name/execute
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "input": {
    "domain": "tesla.com",
    "context": "Analyze for investment"
  },
  "config": {
    "timeout": 30000,
    "cache": true,
    "verbose": false
  }
}

Response (200 OK):
{
  "id": "exec_abc123",
  "ensemble": "domain-profile",
  "status": "completed",
  "result": {
    "profile": "# Tesla, Inc.\n\n...",
    "confidence": 0.95
  },
  "metadata": {
    "duration_ms": 2450,
    "cached_steps": 2,
    "total_steps": 5,
    "cost_usd": 0.012
  },
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:02.45Z"
}
```

#### 2. Execute Ensemble (Streaming)
```http
POST /v1/ensembles/:name/stream
Authorization: Bearer sk_live_...
Accept: text/event-stream
Content-Type: application/json

{
  "input": {...},
  "config": {...}
}

Response (200 OK):
Content-Type: text/event-stream

event: execution.started
data: {"id":"exec_abc123","ensemble":"chat-agent","status":"running"}

event: step.started
data: {"step":"scrape","member":"scrape","status":"running"}

event: step.completed
data: {"step":"scrape","status":"completed","duration_ms":450,"cached":false}

event: step.started
data: {"step":"analyze","member":"think","status":"running"}

event: chunk
data: {"step":"analyze","content":"Tesla","partial":true}

event: chunk
data: {"step":"analyze","content":" is an","partial":true}

event: step.completed
data: {"step":"analyze","status":"completed","duration_ms":1800}

event: execution.completed
data: {"id":"exec_abc123","status":"completed","result":{...},"duration_ms":2450}
```

#### 3. Execute Ensemble (Async)
```http
POST /v1/ensembles/:name/execute?async=true
Authorization: Bearer sk_live_...

Response (202 Accepted):
{
  "id": "exec_abc123",
  "ensemble": "domain-profile",
  "status": "running",
  "status_url": "https://api.conductor.dev/v1/executions/exec_abc123",
  "webhook_url": "https://your-app.com/webhooks/conductor",
  "created_at": "2024-01-15T10:30:00Z"
}

# Later: Check status
GET /v1/executions/exec_abc123

Response (200 OK):
{
  "id": "exec_abc123",
  "status": "completed",
  "result": {...},
  "completed_at": "2024-01-15T10:32:00Z"
}
```

---

### Member Endpoints

#### 4. List Members
```http
GET /v1/members
Authorization: Bearer sk_live_...

Response (200 OK):
{
  "members": [
    {
      "name": "scrape",
      "type": "Browser",
      "built_in": true,
      "description": "3-tier web scraping with bot protection",
      "version": "1.0.0"
    },
    {
      "name": "domain-classifier",
      "type": "Think",
      "built_in": false,
      "description": "Classify domains as investor or company",
      "version": "2.1.0"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "per_page": 10
  }
}
```

#### 5. Get Member Details
```http
GET /v1/members/:name
Authorization: Bearer sk_live_...

Response (200 OK):
{
  "name": "scrape",
  "type": "Browser",
  "built_in": true,
  "description": "3-tier web scraping with bot protection",
  "version": "1.0.0",
  "config_schema": {
    "strategy": {
      "type": "string",
      "enum": ["fast", "balanced", "aggressive"],
      "default": "balanced"
    },
    "returnFormat": {
      "type": "string",
      "enum": ["markdown", "html", "text"],
      "default": "markdown"
    }
  },
  "input_schema": {
    "url": {
      "type": "string",
      "format": "uri",
      "required": true
    }
  }
}
```

#### 6. Validate Member Input
```http
POST /v1/members/:name/validate
Authorization: Bearer sk_live_...

{
  "input": {
    "url": "not-a-valid-url"
  }
}

Response (400 Bad Request):
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input for member 'scrape'",
    "details": [
      {
        "field": "input.url",
        "message": "Must be a valid URL",
        "received": "not-a-valid-url"
      }
    ]
  }
}
```

---

### Project Management Endpoints

#### 7. List Projects
```http
GET /v1/projects
Authorization: Bearer sk_live_...

Response (200 OK):
{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "domain-intelligence",
      "description": "Domain analysis and classification",
      "members_count": 8,
      "ensembles_count": 3,
      "created_at": "2024-01-10T00:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### 8. Deploy Project
```http
POST /v1/projects
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "name": "domain-intelligence",
  "description": "Domain analysis and classification",
  "repository": "github.com/user/domain-intelligence",
  "branch": "main",
  "auto_deploy": true
}

Response (201 Created):
{
  "id": "proj_abc123",
  "name": "domain-intelligence",
  "status": "deploying",
  "deployment_url": "https://domain-intelligence.conductor.app",
  "api_key": "sk_live_...",
  "webhook_secret": "whsec_..."
}
```

---

### Health & Status Endpoints

#### 9. Health Check
```http
GET /health

Response (200 OK):
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": "ok",
    "cache": "ok",
    "ai_providers": {
      "anthropic": "ok",
      "openai": "ok"
    }
  }
}
```

---

## Authentication & Authorization

### API Key Types

1. **Secret Keys** (`sk_live_...`, `sk_test_...`)
   - Full access to all API endpoints
   - Used server-side only
   - Rate limit: 1000 req/min

2. **Publishable Keys** (`pk_live_...`, `pk_test_...`)
   - Read-only access (list members, get schemas)
   - Can be exposed in frontend code
   - Rate limit: 100 req/min

3. **Webhook Secrets** (`whsec_...`)
   - Used to verify webhook signatures
   - HMAC-SHA256 signature validation

### Authentication Middleware

```typescript
// src/api/middleware/auth.ts
export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new APIError('Missing or invalid Authorization header', 401);
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer '

  // Validate API key format
  if (!apiKey.match(/^sk_(live|test)_[a-zA-Z0-9]{32}$/)) {
    throw new APIError('Invalid API key format', 401);
  }

  // Look up API key in KV or D1
  const keyData = await env.API_KEYS.get(`key:${apiKey}`);

  if (!keyData) {
    throw new APIError('Invalid API key', 401);
  }

  const key = JSON.parse(keyData);

  // Check if key is active
  if (key.status !== 'active') {
    throw new APIError('API key is inactive', 401);
  }

  // Check key permissions
  return {
    projectId: key.project_id,
    keyType: key.type,
    permissions: key.permissions,
    rateLimit: key.rate_limit
  };
}
```

---

## Rate Limiting

### Strategy: Token Bucket + Cloudflare Durable Objects

```typescript
// src/api/middleware/rate-limit.ts
export async function rateLimitRequest(
  request: Request,
  authContext: AuthContext,
  env: Env
): Promise<void> {
  const rateLimitKey = `ratelimit:${authContext.projectId}`;

  // Use Cloudflare Durable Objects for distributed rate limiting
  const durableObjectId = env.RATE_LIMITER.idFromName(rateLimitKey);
  const rateLimiter = env.RATE_LIMITER.get(durableObjectId);

  const response = await rateLimiter.fetch(request);
  const result = await response.json<{
    allowed: boolean;
    remaining: number;
    reset_at: number;
  }>();

  if (!result.allowed) {
    throw new APIError('Rate limit exceeded', 429, {
      remaining: result.remaining,
      reset_at: result.reset_at
    });
  }

  // Add rate limit headers to response
  request.headers.set('X-RateLimit-Limit', authContext.rateLimit.toString());
  request.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  request.headers.set('X-RateLimit-Reset', result.reset_at.toString());
}
```

### Rate Limit Tiers

| Plan | Requests/Min | Concurrent | Burst |
|------|-------------|------------|-------|
| Free | 10 | 1 | 20 |
| Pro | 100 | 5 | 200 |
| Team | 1000 | 20 | 2000 |
| Enterprise | Custom | Custom | Custom |

---

## Error Handling

### Standardized Error Response

```typescript
// src/api/schemas/error-response.ts
interface APIErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: any;          // Additional error details
    request_id?: string;    // For debugging
    documentation_url?: string; // Link to docs
  };
}

// Error codes
enum ErrorCode {
  // Authentication (401)
  INVALID_API_KEY = 'invalid_api_key',
  MISSING_AUTHENTICATION = 'missing_authentication',

  // Authorization (403)
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  // Validation (400)
  VALIDATION_ERROR = 'validation_error',
  INVALID_REQUEST = 'invalid_request',

  // Resources (404)
  ENSEMBLE_NOT_FOUND = 'ensemble_not_found',
  MEMBER_NOT_FOUND = 'member_not_found',
  EXECUTION_NOT_FOUND = 'execution_not_found',

  // Execution (422, 500)
  EXECUTION_FAILED = 'execution_failed',
  MEMBER_ERROR = 'member_error',
  TIMEOUT = 'timeout',

  // Server (500, 503)
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}
```

### Error Examples

```http
# Validation Error (400)
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input for ensemble 'domain-profile'",
    "details": [
      {
        "field": "input.domain",
        "message": "Required field 'domain' is missing",
        "type": "missing_field"
      }
    ],
    "request_id": "req_abc123",
    "documentation_url": "https://docs.conductor.dev/errors#validation_error"
  }
}

# Rate Limit (429)
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded: 1000 requests per minute",
    "details": {
      "limit": 1000,
      "remaining": 0,
      "reset_at": 1705320600
    },
    "request_id": "req_abc123",
    "documentation_url": "https://docs.conductor.dev/rate-limits"
  }
}

# Execution Failed (422)
{
  "error": {
    "code": "execution_failed",
    "message": "Ensemble execution failed at step 'analyze'",
    "details": {
      "execution_id": "exec_abc123",
      "failed_step": "analyze",
      "member": "think",
      "member_error": "AI provider rate limit exceeded",
      "steps_completed": 2,
      "steps_total": 5
    },
    "request_id": "req_abc123"
  }
}
```

---

## OpenAPI Specification

### Auto-Generated Docs

```typescript
// src/api/schemas/openapi.ts
import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Conductor API',
    version: '1.0.0',
    description: 'World-class REST API for AI agent orchestration on the edge',
    contact: {
      name: 'Conductor Support',
      url: 'https://conductor.dev/support',
      email: 'support@conductor.dev'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://api.conductor.dev/v1',
      description: 'Production'
    },
    {
      url: 'https://api-staging.conductor.dev/v1',
      description: 'Staging'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key'
      }
    },
    schemas: {
      ExecuteRequest: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            type: 'object',
            description: 'Input data for ensemble execution',
            additionalProperties: true
          },
          config: {
            type: 'object',
            properties: {
              timeout: {
                type: 'number',
                description: 'Execution timeout in milliseconds',
                default: 30000
              },
              cache: {
                type: 'boolean',
                description: 'Enable caching for this execution',
                default: true
              },
              verbose: {
                type: 'boolean',
                description: 'Return verbose metadata',
                default: false
              }
            }
          }
        }
      },
      ExecuteResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ensemble: { type: 'string' },
          status: {
            type: 'string',
            enum: ['completed', 'failed', 'cancelled']
          },
          result: { type: 'object' },
          metadata: { $ref: '#/components/schemas/ExecutionMetadata' }
        }
      },
      // ... more schemas
    }
  },
  paths: {
    '/ensembles/{name}/execute': {
      post: {
        summary: 'Execute an ensemble',
        description: 'Execute an ensemble synchronously and return the result',
        operationId: 'executeEnsemble',
        tags: ['Ensembles'],
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Name of the ensemble to execute'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExecuteRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful execution',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExecuteResponse' }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
    // ... more paths
  }
};
```

### SDK Generation

```bash
# Generate TypeScript SDK from OpenAPI spec
npm run generate-sdk

# Generated SDK usage:
import { Conductor } from '@conductor/sdk';

const conductor = new Conductor({
  apiKey: process.env.CONDUCTOR_API_KEY
});

// Type-safe API calls
const result = await conductor.ensembles.execute('domain-profile', {
  input: {
    domain: 'tesla.com'
  }
});

// Streaming
const stream = await conductor.ensembles.stream('chat-agent', {
  input: { message: 'Hello' }
});

for await (const event of stream) {
  if (event.type === 'chunk') {
    console.log(event.content);
  }
}
```

---

## Webhooks

### Webhook Events

```typescript
// src/api/webhooks/webhook-events.ts
enum WebhookEvent {
  // Execution events
  EXECUTION_STARTED = 'execution.started',
  EXECUTION_COMPLETED = 'execution.completed',
  EXECUTION_FAILED = 'execution.failed',

  // Step events
  STEP_STARTED = 'step.started',
  STEP_COMPLETED = 'step.completed',
  STEP_FAILED = 'step.failed',

  // Project events
  PROJECT_DEPLOYED = 'project.deployed',
  PROJECT_UPDATED = 'project.updated',

  // Member events
  MEMBER_CREATED = 'member.created',
  MEMBER_UPDATED = 'member.updated'
}

interface WebhookPayload {
  id: string;                    // Event ID
  type: WebhookEvent;           // Event type
  created_at: string;           // ISO 8601 timestamp
  data: any;                    // Event-specific data
  project_id: string;           // Project that triggered event
}
```

### Webhook Delivery

```http
POST https://your-app.com/webhooks/conductor
Content-Type: application/json
X-Conductor-Signature: t=1705320600,v1=abc123...
X-Conductor-Event: execution.completed
X-Conductor-Delivery: evt_abc123

{
  "id": "evt_abc123",
  "type": "execution.completed",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "execution_id": "exec_abc123",
    "ensemble": "domain-profile",
    "status": "completed",
    "result": {...},
    "duration_ms": 2450
  },
  "project_id": "proj_abc123"
}
```

### Webhook Signature Verification

```typescript
// Verify webhook signature
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const [timestamp, hash] = signature.split(',').map(s => s.split('=')[1]);

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedHash)
  );
}
```

---

## Caching Strategy

### Response Caching

```typescript
// Cache-Control headers for different endpoints
const CACHE_HEADERS = {
  // Member schemas (rarely change)
  '/v1/members/:name': {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'CDN-Cache-Control': 'public, max-age=86400'
  },

  // Execution results (cache based on input hash)
  '/v1/ensembles/:name/execute': {
    'Cache-Control': 'private, max-age=300',
    'Vary': 'Authorization, Content-Type'
  },

  // Health check (short cache)
  '/health': {
    'Cache-Control': 'public, max-age=60'
  }
};
```

### Cloudflare Cache API

```typescript
// Use Cloudflare Cache API for ensemble executions
const cacheKey = new Request(
  `https://cache.conductor.dev/ensemble/${ensembleName}/${inputHash}`,
  request
);

const cache = caches.default;
let response = await cache.match(cacheKey);

if (!response) {
  // Execute ensemble
  const result = await executeEnsemble(ensembleName, input);

  response = new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });

  await cache.put(cacheKey, response.clone());
}

return response;
```

---

## Observability

### OpenTelemetry Integration

```typescript
// src/api/middleware/telemetry.ts
import { trace, context } from '@opentelemetry/api';

export function telemetryMiddleware(handler: Handler): Handler {
  return async (request, env, ctx) => {
    const tracer = trace.getTracer('conductor-api');

    return await tracer.startActiveSpan('http.request', async (span) => {
      span.setAttributes({
        'http.method': request.method,
        'http.url': request.url,
        'http.route': getRoute(request),
        'conductor.project_id': authContext.projectId
      });

      try {
        const response = await handler(request, env, ctx);
        span.setStatus({ code: SpanStatusCode.OK });
        span.setAttribute('http.status_code', response.status);
        return response;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  };
}
```

### Logging

```typescript
// Structured logging for Cloudflare Workers
interface LogEvent {
  level: 'info' | 'warn' | 'error';
  message: string;
  request_id: string;
  project_id: string;
  duration_ms?: number;
  error?: any;
  metadata?: Record<string, any>;
}

function log(event: LogEvent) {
  console.log(JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
    service: 'conductor-api'
  }));
}
```

---

## Deployment

### Cloudflare Workers Deployment

```toml
# wrangler.toml
name = "conductor-api"
main = "src/api/index.ts"
compatibility_date = "2024-01-15"

[env.production]
route = "api.conductor.dev/*"
vars = { ENVIRONMENT = "production" }

[env.staging]
route = "api-staging.conductor.dev/*"
vars = { ENVIRONMENT = "staging" }

# Bindings
[[env.production.kv_namespaces]]
binding = "API_KEYS"
id = "..."

[[env.production.d1_databases]]
binding = "DB"
database_id = "..."

[[env.production.durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
```

### Multi-Region Deployment

```typescript
// Edge routing with regional failover
const REGIONS = {
  'us-east': 'https://us-east.conductor.dev',
  'us-west': 'https://us-west.conductor.dev',
  'eu-west': 'https://eu-west.conductor.dev',
  'ap-south': 'https://ap-south.conductor.dev'
};

// Route request to nearest region
function getRegion(request: Request): string {
  const cfData = request.cf as IncomingRequestCfProperties;
  const country = cfData.country;

  if (country.startsWith('US')) {
    return cfData.longitude > -100 ? 'us-east' : 'us-west';
  }
  if (country.startsWith('EU')) {
    return 'eu-west';
  }
  return 'ap-south';
}
```

---

## Implementation Roadmap

### Phase 1: Core API (Weeks 1-3)
**Goal:** Basic REST API with authentication

1. **Week 1: Foundation**
   - API router and middleware framework
   - Authentication (API key validation)
   - Error handling and standardization
   - Basic execution endpoint

2. **Week 2: Core Endpoints**
   - Execute ensemble (sync)
   - List members
   - Get member details
   - Health check

3. **Week 3: Validation & Docs**
   - Request validation (Zod schemas)
   - OpenAPI spec generation
   - Auto-generated TypeScript SDK

### Phase 2: Production Features (Weeks 4-6)
**Goal:** Rate limiting, caching, observability

4. **Week 4: Rate Limiting**
   - Durable Objects for distributed rate limiting
   - Rate limit tiers
   - Response headers

5. **Week 5: Caching**
   - Cloudflare Cache API integration
   - Cache-Control headers
   - Input hash-based caching

6. **Week 6: Observability**
   - OpenTelemetry tracing
   - Structured logging
   - Request ID propagation

### Phase 3: Advanced Features (Weeks 7-9)
**Goal:** Streaming, async, webhooks

7. **Week 7: Streaming**
   - SSE endpoint for ensemble streaming
   - Chunk-by-chunk responses
   - Connection management

8. **Week 8: Async Execution**
   - Async execute endpoint
   - Durable Objects for long-running workflows
   - Status polling endpoint

9. **Week 9: Webhooks**
   - Webhook event system
   - Signature verification
   - Delivery retry logic

### Phase 4: Multi-Tenancy (Weeks 10-12)
**Goal:** Project management, deployment

10. **Week 10: Project API**
    - List projects
    - Project CRUD
    - API key management

11. **Week 11: Deployment**
    - Deploy from Git repository
    - Auto-deploy on push
    - Deployment status tracking

12. **Week 12: Polish**
    - SDK examples and docs
    - API reference documentation
    - Load testing and optimization

---

## Success Metrics

### Developer Experience
- **Time to First API Call:** < 5 minutes (signup → API call)
- **SDK Coverage:** TypeScript, Python, Go clients
- **API Uptime:** 99.99% (edge deployment)

### Performance
- **p50 Latency:** < 50ms (non-ensemble endpoints)
- **p99 Latency:** < 200ms
- **Streaming TTI:** < 100ms (time to first chunk)

### Documentation
- **OpenAPI Coverage:** 100% of endpoints
- **Example Coverage:** Every endpoint has curl + SDK example
- **Error Documentation:** Every error code documented

---

## Reference Implementations

### Stripe-Inspired Error Handling
```typescript
// Clear, actionable error messages
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input: 'domain' must be a valid domain name",
    "param": "input.domain",
    "type": "invalid_request_error",
    "documentation_url": "https://docs.conductor.dev/api#domain-validation"
  }
}
```

### OpenAI-Inspired Streaming
```typescript
// SSE with structured events
event: execution.started
data: {"id":"exec_123","status":"running"}

event: chunk
data: {"content":"Hello","partial":true}

event: execution.completed
data: {"id":"exec_123","status":"completed","result":{...}}
```

### Vercel-Inspired Edge Deployment
```typescript
// Edge-first, globally distributed
export default {
  async fetch(request, env, ctx) {
    // Auto-routes to nearest region
    // No cold starts
    // Infinite scale
  }
}
```

---

## Summary

**Critical Components:**
1. ✅ **REST API Router** - Hono or itty-router for Cloudflare Workers
2. ✅ **Authentication** - API key validation with KV storage
3. ✅ **Rate Limiting** - Durable Objects for distributed limiting
4. ✅ **Error Handling** - Standardized error responses
5. ✅ **OpenAPI Spec** - Auto-generated documentation
6. ✅ **SDK Generation** - TypeScript client from OpenAPI
7. ✅ **Streaming** - SSE for real-time responses
8. ✅ **Webhooks** - Event delivery with signature verification
9. ✅ **Observability** - OpenTelemetry + structured logging
10. ✅ **Caching** - Cloudflare Cache API for performance

**NOT Included (Separate Systems):**
- Admin dashboard (separate Next.js app)
- Billing system (Stripe integration)
- Analytics dashboard (separate service)

**Next Steps:**
1. Choose API framework (Hono recommended for Workers)
2. Implement core router + authentication
3. Build OpenAPI spec generator
4. Create TypeScript SDK generator
5. Deploy to Cloudflare Workers

---

**Built to provide world-class API for Conductor deployments**
