# Conductor Release Testing Agent Prompt

**Purpose**: Test first-time user experience and generate actionable fix recommendations
**Agent**: AI Release Tester
**Package Manager**: pnpm
**Output**: Release report with recommended fixes

---

## 🎯 Mission

You are testing the **first-time user experience** of Conductor. Your goal is to ensure a new developer can install Conductor and have a working agent/ensemble running in under 5 minutes.

**Critical Mindset**:
- Pretend you know NOTHING about Conductor internals
- Follow only the documented steps
- If something fails or is confusing, **DON'T SKIP IT**
- Every friction point must be documented with a recommended fix
- The goal is "zero-friction onboarding"

---

## 📋 Test Environment Setup

```bash
# Navigate to test project (use any clean directory)
cd /tmp/conductor-release-test

# Create fresh directory if needed
rm -rf /tmp/conductor-release-test && mkdir -p /tmp/conductor-release-test
cd /tmp/conductor-release-test

# Verify clean
ls -la  # Should be empty
```

---

## 🔧 CLI Architecture Notes

**Unified CLI**: All Conductor commands go through the `ensemble` CLI:
- `ensemble conductor init` - Initialize projects (templates bundled in CLI)
- `ensemble conductor dev` - Passthrough to `wrangler dev`
- `ensemble conductor deploy` - Passthrough to `wrangler deploy`
- `ensemble conductor validate` - Validate YAML/TS configurations

**Non-Interactive Mode**: Use `--yes` (or `-y`) to skip all prompts:
- Skips Cloudflare authentication check (`--skip-auth`)
- Skips AI provider setup (`--skip-secrets`)
- Essential for CI/CD and automated testing

**Templates**: Project templates are now **bundled** with the `@ensemble-edge/ensemble` package (not fetched from `@ensemble-edge/conductor`). This means:
- Faster initialization (no npm pack required)
- Works offline after CLI is installed
- Template version tied to CLI version

---

## 🧪 Phase 1: Installation (Target: 60 seconds)

### 1.1 Install Ensemble CLI and Initialize Project

```bash
# Install the unified CLI globally (if not already installed)
npm install -g @ensemble-edge/ensemble

# Verify CLI is installed
ensemble --version

# Initialize project with non-interactive mode
ensemble conductor init . --force --yes
```

**Check for issues**:
- [ ] Command completes without errors
- [ ] Clear success message shown
- [ ] File structure created correctly

**If it fails**: Document the error message exactly. Try to identify the root cause.

### 1.2 Install Dependencies

```bash
pnpm install
```

**Check for issues**:
- [ ] No peer dependency warnings
- [ ] No deprecated package warnings
- [ ] Install completes in < 30 seconds

### 1.3 Verify package.json

```bash
cat package.json | grep conductor
```

**Check for issues**:
- [ ] Dependency is `"^X.X.X"` format (NOT `"file:..."`)
- [ ] Version matches the release being tested

**Known Issue Pattern**: If you see `"file:../../../../"`, this is a template bug.

### 1.4 Run Tests

```bash
pnpm test
```

**Check for issues**:
- [ ] All tests pass (expect 45+ tests)
- [ ] No TypeScript errors
- [ ] Test output is clear and readable

### 1.5 Build

```bash
pnpm run build
```

**Check for issues**:
- [ ] Build completes successfully
- [ ] No warnings about missing types
- [ ] Output shows `dist/index.mjs` created

**Known Issue Pattern**: If `wrangler.toml` has `main = "dist/index.js"`, change to `main = "dist/index.mjs"`.

### 1.6 Verify Cloudflare Compatibility

```bash
# Check nodejs_compat flag is present
grep "nodejs_compat" wrangler.toml

# Expected: compatibility_flags = ["nodejs_compat"]
```

**Check for issues**:
- [ ] `nodejs_compat` flag is present in wrangler.toml
- [ ] No Cloudflare Worker compatibility errors during build

---

## 🧪 Phase 2: Start Dev Server (Target: 30 seconds)

```bash
npx wrangler dev --port 9999 --ip 0.0.0.0 --local-protocol http
```

**Check for issues**:
- [ ] Server starts without errors
- [ ] Shows "Ready on http://..." message
- [ ] No warnings about missing bindings

### 2.1 Test Default Endpoints

```bash
# In a new terminal
curl http://localhost:9999/health
curl http://localhost:9999/
curl http://localhost:9999/api/v1/agents
```

**Expected**:
- `/health` → `{"status":"ok"}` or similar
- `/` → HTML homepage
- `/api/v1/agents` → JSON list of agents

**Check for issues**:
- [ ] All endpoints respond with 200
- [ ] Response format is correct
- [ ] No 500 errors in server logs

---

## 🧪 Phase 3: Create First Agent (Target: 2 minutes)

This tests the core "create an agent" workflow.

### 3.1 Create Agent Directory and YAML

```bash
mkdir -p agents/greeting

cat > agents/greeting/agent.yaml << 'EOF'
name: greeting
operation: code
description: Returns a personalized greeting

schema:
  input:
    name: string
  output:
    message: string
    timestamp: string
EOF
```

### 3.2 Create Agent Code

```bash
cat > agents/greeting/index.ts << 'EOF'
import type { AgentExecutionContext } from '@ensemble-edge/conductor';

export default function({ input, logger }: AgentExecutionContext) {
  const { name } = input as { name: string };

  // Test logging is working
  logger.info('Greeting agent executing', { inputName: name });

  return {
    message: `Hello, ${name}! Welcome to Conductor.`,
    timestamp: new Date().toISOString()
  };
}
EOF
```

### 3.3 Rebuild and Test

```bash
pnpm run build
pnpm test
```

**Check for issues**:
- [ ] Build succeeds with new agent
- [ ] Tests discover the new agent
- [ ] Agent test passes

### 3.4 Verify Agent Discovery

```bash
curl http://localhost:9999/api/v1/agents | jq '.agents[] | select(.name == "greeting")'
```

**Expected**: Agent appears in the list with correct schema.

**Check for issues**:
- [ ] Agent is auto-discovered
- [ ] Schema shows correct input/output types
- [ ] Description is present

---

## 🧪 Phase 4: Create First Ensemble (Target: 2 minutes)

### 4.1 Create Ensemble with HTTP Trigger

```bash
mkdir -p ensembles

cat > ensembles/hello-world.yaml << 'EOF'
name: hello-world
description: Simple greeting ensemble with logging test

trigger:
  - type: http
    path: /hello
    methods: [GET, POST]
    public: true
    middleware:
      - logger

flow:
  - agent: greeting
    input:
      name: ${input.name ?? "World"}

output:
  greeting: ${greeting.output.message}
  timestamp: ${greeting.output.timestamp}
EOF
```

### 4.2 Rebuild

```bash
pnpm run build
```

### 4.3 Test Ensemble via HTTP

```bash
# Test GET
curl "http://localhost:9999/hello?name=Developer"

# Test POST
curl -X POST http://localhost:9999/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "Developer"}'
```

**Expected**:
```json
{
  "greeting": "Hello, Developer! Welcome to Conductor.",
  "timestamp": "2025-..."
}
```

**Check for issues**:
- [ ] HTTP trigger works
- [ ] Query params parsed correctly
- [ ] JSON body parsed correctly
- [ ] Output interpolation works
- [ ] **LOGGING**: Check server console shows log from agent

---

## 🧪 Phase 5: Logging Verification Test

This is critical for production readiness.

### 5.1 Create Logging Test Agent

```bash
mkdir -p agents/logging-test

cat > agents/logging-test/agent.yaml << 'EOF'
name: logging-test
operation: code
description: Verifies logging works correctly in agents

schema:
  input:
    testId: string
  output:
    success: boolean
    logLevels: array
EOF

cat > agents/logging-test/index.ts << 'EOF'
import type { AgentExecutionContext } from '@ensemble-edge/conductor';

export default function({ input, logger }: AgentExecutionContext) {
  const { testId } = input as { testId: string };

  // Test all log levels
  logger.debug('Debug level test', { testId, level: 'debug' });
  logger.info('Info level test', { testId, level: 'info' });
  logger.warn('Warn level test', { testId, level: 'warn' });
  logger.error('Error level test (not a real error)', { testId, level: 'error' });

  // Test structured logging with context
  logger.info('Structured log test', {
    testId,
    metadata: {
      timestamp: Date.now(),
      environment: 'test'
    }
  });

  return {
    success: true,
    logLevels: ['debug', 'info', 'warn', 'error']
  };
}
EOF
```

### 5.2 Create Logging Test Ensemble

```bash
cat > ensembles/test-logging.yaml << 'EOF'
name: test-logging
description: Tests that logging works in ensembles

trigger:
  - type: http
    path: /test-logging
    methods: [POST]
    public: true
    middleware:
      - logger

flow:
  - agent: logging-test
    input:
      testId: ${input.testId ?? "default-test"}

output:
  success: ${logging-test.output.success}
  testedLevels: ${logging-test.output.logLevels}
EOF
```

### 5.3 Run Logging Test

```bash
pnpm run build

# Trigger the logging test
curl -X POST http://localhost:9999/test-logging \
  -H "Content-Type: application/json" \
  -d '{"testId": "release-test-001"}'
```

### 5.4 Verify Logs in Console

**CRITICAL CHECK**: Look at the wrangler dev server console output.

**Expected log entries** (should see in server console):
```
[INFO] Debug level test {"testId":"release-test-001","level":"debug"}
[INFO] Info level test {"testId":"release-test-001","level":"info"}
[WARN] Warn level test {"testId":"release-test-001","level":"warn"}
[ERROR] Error level test (not a real error) {"testId":"release-test-001","level":"error"}
[INFO] Structured log test {"testId":"release-test-001","metadata":{...}}
```

**Check for issues**:
- [ ] All log levels appear in console
- [ ] Context data (testId) is included
- [ ] Structured data is formatted correctly
- [ ] No "[object Object]" in output
- [ ] requestId/executionId context is present

---

## 🧪 Phase 6: Execute API Test

Test the programmatic execution API.

```bash
curl -X POST http://localhost:9999/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "ensemble": "hello-world",
    "input": {"name": "API User"}
  }' | jq .
```

**Check for issues**:
- [ ] Returns 200 with result
- [ ] Output matches expected format
- [ ] Execution ID is returned
- [ ] No errors in server logs

---

## 🧪 Phase 7: Documentation Endpoints

**Important**: Conductor provides two types of endpoints for agent/ensemble information:
- `/docs/*` routes return **HTML** pages for human-readable documentation (browser viewing)
- `/api/v1/*` routes return **JSON** for programmatic access

### 7.1 All Documentation Routes (Complete Test)

Run this comprehensive test of all documentation endpoints:

```bash
echo "=== Testing all docs routes ==="

# 1. Landing Page
echo "--- /docs (Landing Page) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs | head -5

# 2. Agents List
echo "--- /docs/agents (Agents List) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/agents | head -5

# 3. Agent Detail (use a known agent like 'docs' or 'greeting')
echo "--- /docs/agents/:name (Agent Detail) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/agents/greeting | head -5

# 4. Ensembles List
echo "--- /docs/ensembles (Ensembles List) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/ensembles | head -5

# 5. Ensemble Detail (use a known ensemble)
echo "--- /docs/ensembles/:name (Ensemble Detail) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/ensembles/hello-world | head -5

# 6. API Reference (Stoplight Elements UI)
echo "--- /docs/api (API Reference UI) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/api | head -5

# 7. OpenAPI JSON Spec
echo "--- /docs/openapi.json (OpenAPI Spec) ---"
curl -s http://localhost:9999/docs/openapi.json | jq '.info, .paths | keys | length'

# 8. OpenAPI YAML Spec
echo "--- /docs/openapi.yaml (OpenAPI YAML) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/openapi.yaml | head -10

# 9. Markdown Doc Page (if docs/ directory has .md files)
echo "--- /docs/:slug (Markdown Page) ---"
curl -s -w "\nHTTP: %{http_code}\n" http://localhost:9999/docs/getting-started | head -5
```

### 7.2 Expected Results Table

| Route | Action | Expected Status | Content |
|-------|--------|-----------------|---------|
| `/docs` | render-landing | 200 | HTML landing page |
| `/docs/agents` | render-agents | 200 | `<h1>Agents</h1>` |
| `/docs/agents/:name` | render-agent-detail | 200 | Agent detail page |
| `/docs/ensembles` | render-ensembles | 200 | `<h1>Ensembles</h1>` |
| `/docs/ensembles/:name` | render-ensemble-detail | 200 | Ensemble detail page |
| `/docs/api` | render-api | 200 | Stoplight Elements UI |
| `/docs/openapi.json` | generate-openapi | 200 | Valid JSON spec |
| `/docs/openapi.yaml` | generate-openapi | 200 | Valid YAML spec |
| `/docs/:slug` | render-page | 200 | Rendered markdown |

### 7.3 Check for Issues

- [ ] All routes return HTTP 200 (not 404 or 500)
- [ ] `/docs` returns HTML landing page with navigation
- [ ] `/docs/agents` lists all discovered agents
- [ ] `/docs/agents/:name` shows agent schema and description
- [ ] `/docs/ensembles` lists all discovered ensembles
- [ ] `/docs/ensembles/:name` shows ensemble flow and triggers
- [ ] `/docs/api` loads Stoplight Elements API documentation UI
- [ ] `/docs/openapi.json` returns valid JSON with paths
- [ ] `/docs/openapi.yaml` returns valid YAML format
- [ ] `/docs/:slug` renders markdown files from `docs/` directory
- [ ] Custom agents/ensembles appear in documentation

### 7.4 JSON API (Programmatic Access)

```bash
# Agent list API - returns JSON array
curl http://localhost:9999/api/v1/agents | jq '.agents[].name'

# Ensemble list API - returns JSON array
curl http://localhost:9999/api/v1/ensembles | jq '.ensembles[].name'

# Single agent details
curl http://localhost:9999/api/v1/agents/greeting | jq .
```

**Check for issues**:
- [ ] `/api/v1/agents` returns JSON with agents array
- [ ] `/api/v1/ensembles` returns JSON with ensembles array
- [ ] Custom agents/ensembles appear in JSON endpoints

---

## 🧪 Phase 8: Trigger Authentication Testing

This tests the unified auth bridge between trigger YAML config and the auth provider system.

### 8.1 Create Protected Ensemble with Bearer Auth

```bash
cat > ensembles/protected-bearer.yaml << 'EOF'
name: protected-bearer
description: Tests bearer token authentication on triggers

trigger:
  - type: http
    path: /api/protected
    methods: [GET, POST]
    auth:
      type: bearer
      secret: ${env.API_SECRET}

flow:
  - agent: greeting
    input:
      name: ${input.name ?? "Authenticated User"}

output:
  greeting: ${greeting.output.message}
  authenticated: true
EOF
```

### 8.2 Set Up Environment Secret

```bash
# Add to .dev.vars
echo 'API_SECRET=test-secret-12345' >> .dev.vars
```

### 8.3 Rebuild and Test Auth

```bash
pnpm run build

# Test WITHOUT token (should fail with 401)
curl -i http://localhost:9999/api/protected

# Expected: 401 Unauthorized
# {"error":"invalid_token","message":"Missing or invalid Authorization header..."}

# Test WITH correct token (should succeed)
curl -i http://localhost:9999/api/protected \
  -H "Authorization: Bearer test-secret-12345"

# Expected: 200 OK with greeting response

# Test WITH wrong token (should fail with 401)
curl -i http://localhost:9999/api/protected \
  -H "Authorization: Bearer wrong-token"

# Expected: 401 Unauthorized
# {"error":"invalid_token","message":"Invalid bearer token"}
```

**Check for issues**:
- [ ] Missing token returns 401
- [ ] Wrong token returns 401
- [ ] Correct token returns 200
- [ ] Error messages are clear and helpful
- [ ] No stack traces in error responses

### 8.4 Create Protected Ensemble with Basic Auth

```bash
cat > ensembles/protected-basic.yaml << 'EOF'
name: protected-basic
description: Tests HTTP Basic authentication on triggers

trigger:
  - type: http
    path: /api/admin
    methods: [GET]
    auth:
      type: basic
      secret: ${env.ADMIN_CREDENTIALS}
      realm: "Admin Area"

flow:
  - agent: greeting
    input:
      name: "Admin"

output:
  greeting: ${greeting.output.message}
  role: admin
EOF

# Add credentials to .dev.vars
echo 'ADMIN_CREDENTIALS=admin:supersecret' >> .dev.vars
```

### 8.5 Test Basic Auth

```bash
pnpm run build

# Test WITHOUT credentials (should fail with 401 + WWW-Authenticate header)
curl -i http://localhost:9999/api/admin

# Expected: 401 with WWW-Authenticate: Basic realm="Admin Area"

# Test WITH correct credentials
curl -i http://localhost:9999/api/admin \
  -u admin:supersecret

# Expected: 200 OK

# Test WITH wrong credentials
curl -i http://localhost:9999/api/admin \
  -u admin:wrongpassword

# Expected: 401 Unauthorized
```

**Check for issues**:
- [ ] WWW-Authenticate header present on 401
- [ ] Realm is correct ("Admin Area")
- [ ] Correct credentials work
- [ ] Wrong credentials rejected

### 8.6 Create Webhook with Signature Auth (GitHub-style)

```bash
cat > ensembles/webhook-github.yaml << 'EOF'
name: webhook-github
description: Tests signature authentication (GitHub webhook style)

trigger:
  - type: http
    path: /webhooks/github
    methods: [POST]
    auth:
      type: signature
      secret: ${env.GITHUB_WEBHOOK_SECRET}
      preset: github

flow:
  - agent: greeting
    input:
      name: "GitHub Webhook"

output:
  received: true
  event: ${input.event ?? "unknown"}
EOF

# Add webhook secret
echo 'GITHUB_WEBHOOK_SECRET=whsec_testsecret123' >> .dev.vars
```

### 8.7 Test Signature Auth

```bash
pnpm run build

# Create a test payload
PAYLOAD='{"event":"push","repository":"test/repo"}'

# Generate HMAC signature (GitHub style: sha256=...)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "whsec_testsecret123" | cut -d' ' -f2)

# Test WITH correct signature
curl -i -X POST http://localhost:9999/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"

# Expected: 200 OK

# Test WITHOUT signature
curl -i -X POST http://localhost:9999/webhooks/github \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# Expected: 401 Unauthorized

# Test WITH wrong signature
curl -i -X POST http://localhost:9999/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=wrongsignature" \
  -d "$PAYLOAD"

# Expected: 401 Unauthorized
```

**Check for issues**:
- [ ] Valid signature accepted
- [ ] Missing signature rejected
- [ ] Invalid signature rejected
- [ ] Correct header name used (X-Hub-Signature-256)

### 8.8 Test Auth Context Propagation

Create an agent that uses auth context:

```bash
mkdir -p agents/auth-info

cat > agents/auth-info/agent.yaml << 'EOF'
name: auth-info
operation: code
description: Returns authentication context information

schema:
  input: {}
  output:
    authenticated: boolean
    method: string?
    hasContext: boolean
EOF

cat > agents/auth-info/index.ts << 'EOF'
import type { AgentExecutionContext } from '@ensemble-edge/conductor';

export default function({ input, context, logger }: AgentExecutionContext) {
  // Auth context should be available via context
  const auth = context?.auth;

  logger.info('Auth context received', {
    hasAuth: !!auth,
    method: auth?.method
  });

  return {
    authenticated: auth?.authenticated ?? false,
    method: auth?.method ?? null,
    hasContext: !!auth
  };
}
EOF

cat > ensembles/auth-context-test.yaml << 'EOF'
name: auth-context-test
description: Tests auth context propagation to agents

trigger:
  - type: http
    path: /api/auth-info
    methods: [GET]
    auth:
      type: bearer
      secret: ${env.API_SECRET}

flow:
  - agent: auth-info

output:
  authenticated: ${auth-info.output.authenticated}
  method: ${auth-info.output.method}
  hasContext: ${auth-info.output.hasContext}
EOF

pnpm run build

# Test auth context is passed to agent
curl http://localhost:9999/api/auth-info \
  -H "Authorization: Bearer test-secret-12345" | jq .

# Expected:
# {
#   "authenticated": true,
#   "method": "bearer",
#   "hasContext": true
# }
```

**Check for issues**:
- [ ] Auth context available in agent
- [ ] Method correctly identified
- [ ] Authenticated flag is true
- [ ] Logger can access auth context

---

## 🧪 Phase 9: HITL Callback Routes Testing

This tests the Human-In-The-Loop (HITL) callback endpoints used for workflow approval/rejection. These are critical for workflows that pause for human approval.

### Background

The HITL system uses **token-based authentication** - the callback URL itself IS the auth (like a password reset link). No API key is required for these endpoints.

**Simplified Design (v0.4.6+)**:
- `POST /callback/:token` - Resume with body `{ approved: true/false, ... }`
- `GET /callback/:token` - Get token metadata (without consuming it)

### 9.1 Verify Callback Route Structure

```bash
# Test that POST endpoint exists (should return 500 - no HITL_STATE binding in dev)
curl -i -X POST http://localhost:9999/callback/test-token-123 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Expected: 500 with {"error":"HITLState Durable Object not configured",...}
# NOT 404 (route exists) and NOT 401 (no auth required)

# Test that GET endpoint exists
curl -i http://localhost:9999/callback/test-token-123

# Expected: 500 with same error (route exists, no binding)
```

**Check for issues**:
- [ ] POST route returns 500 (not 404) - route exists
- [ ] GET route returns 500 (not 404) - route exists
- [ ] No 401 Unauthorized - token-based auth, not API key auth
- [ ] Error message mentions "HITL_STATE" binding

### 9.2 Test Token-Based Auth (No API Key Required)

```bash
# Callback routes should NOT require API key authentication
# This is by design - the token IS the auth

# Test without any auth headers (should reach handler, not get 401)
curl -i -X POST http://localhost:9999/callback/some-token \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 500 (no binding), NOT 401 (unauthorized)
# The error should be about HITL_STATE, not about credentials
```

**Check for issues**:
- [ ] No "Invalid credentials" error
- [ ] No "Unauthorized" response
- [ ] Reaches callback handler (gets HITL_STATE error)

### 9.3 Test Request Body Parsing

```bash
# Test approval with feedback
curl -i -X POST http://localhost:9999/callback/test-token \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "feedback": "Looks good!",
    "approver": "jane@example.com"
  }'

# Test rejection with reason
curl -i -X POST http://localhost:9999/callback/test-token \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "reason": "Needs revision",
    "feedback": "Please fix the formatting"
  }'

# Test empty body (should default to approved)
curl -i -X POST http://localhost:9999/callback/test-token \
  -H "Content-Type: application/json"

# All should return 500 (HITL_STATE not configured), not 400 (bad request)
```

**Check for issues**:
- [ ] All body formats accepted (no 400 errors)
- [ ] Empty body works (defaults to approved)
- [ ] JSON parsing doesn't fail

### 9.4 Test Nested Paths Return 404

```bash
# The simplified design only supports /callback/:token (single segment)
# Nested paths like /callback/approve/token should 404

curl -i -X POST http://localhost:9999/callback/approve/some-token \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Expected: 404 Not Found
# (Legacy /callback/approve/:token pattern no longer supported)
```

**Check for issues**:
- [ ] Nested paths return 404 (not supported)
- [ ] Only single-segment token paths work

### 9.5 Test Various Token Formats

```bash
# UUID-style token
curl -i -X POST http://localhost:9999/callback/resume_550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Short token
curl -i -X POST http://localhost:9999/callback/abc123 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Token with underscores
curl -i -X POST http://localhost:9999/callback/hitl_token_12345 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# All should return 500 (not 404) - routes accept any token format
```

**Check for issues**:
- [ ] UUID tokens accepted
- [ ] Short tokens accepted
- [ ] Tokens with underscores/dashes accepted
- [ ] All reach handler (get 500, not 404)

### 9.6 Test Configurable Base Path (API Config)

The callback base path is configurable via `APIConfig.hitl.resumeBasePath`. If you have a custom configuration, test that custom path:

```typescript
// Example configuration in your worker:
createConductorAPI({
  hitl: {
    resumeBasePath: '/resume'  // Custom path instead of /callback
  }
})
```

```bash
# If using custom path /resume:
curl -i -X POST http://localhost:9999/resume/test-token \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Expected: 500 (reaches handler at custom path)
```

**Check for issues**:
- [ ] Custom base path works
- [ ] Both POST and GET work at custom path
- [ ] Default /callback still works when not configured

### 9.7 Verify Legacy Routes Removed

```bash
# These legacy routes should NO LONGER exist (404):
curl -i http://localhost:9999/callbacks/resume/some-token
curl -i -X POST http://localhost:9999/callbacks/approve/some-token
curl -i -X POST http://localhost:9999/callbacks/reject/some-token

# All should return 404 (routes removed in v0.4.6)
```

**Check for issues**:
- [ ] `/callbacks/resume/:token` returns 404
- [ ] `/callbacks/approve/:token` returns 404
- [ ] `/callbacks/reject/:token` returns 404

---

## 🧪 Phase 10: AI / Workers AI Testing (Optional)

This phase tests Cloudflare Workers AI integration with think agents. It requires a Cloudflare API token and account.

### Prerequisites

**⚠️ IMPORTANT**: Before running these tests, you need:
1. A Cloudflare API token with Workers AI permissions
2. Your Cloudflare account ID

**Ask the user**: "To test Workers AI functionality, I need your Cloudflare API token. Do you have one you'd like to use for testing?"

### 10.1 Get Account Information

Once you have the API token, get the account ID:

```bash
# Set the API token temporarily
export CLOUDFLARE_API_TOKEN="your-token-here"

# Get account information using wrangler
npx wrangler whoami

# Look for the account ID in the output, it will show something like:
# Getting User settings...
# 👋 You are logged in with an API Token, associated with the email: user@example.com!
# ┌─────────────────────────────────────┬──────────────────────────────────┐
# │ Account Name                        │ Account ID                       │
# ├─────────────────────────────────────┼──────────────────────────────────┤
# │ Your Account                        │ a608afaa5d472a1eb71d249ed7724c9b │
# └─────────────────────────────────────┴──────────────────────────────────┘
```

### 10.2 Configure Workers AI Binding

```bash
# Add API token to .dev.vars
echo "CLOUDFLARE_API_TOKEN=your-token-here" >> .dev.vars

# Update wrangler.toml with account_id and AI binding
# Add these lines if not present:
cat >> wrangler.toml << 'EOF'

# Cloudflare Account (required for remote AI binding)
account_id = "your-account-id-here"

# Workers AI binding (remote mode for local dev)
[ai]
binding = "AI"
remote = true
EOF
```

**Check for issues**:
- [ ] API token added to `.dev.vars`
- [ ] `account_id` added to `wrangler.toml`
- [ ] `[ai]` binding configured with `remote = true`

### 10.3 Test AI Greeting Endpoint

The template includes an `ai-greeting` example ensemble that uses Workers AI:

```bash
# Restart wrangler to pick up new config
# (Kill existing wrangler process first if running)

npx wrangler dev --port 9999 --ip 0.0.0.0

# Test the AI greeting endpoint
curl http://localhost:9999/ai/hello/Developer
```

**Expected Response**:
```json
{
  "greeting": "Hello Developer! It's wonderful to meet you...",
  "model": "@cf/meta/llama-3.1-8b-instruct"
}
```

**Check for issues**:
- [ ] Endpoint returns 200 (not 500)
- [ ] `greeting` field contains AI-generated text (not empty/null)
- [ ] `model` field shows the Workers AI model used
- [ ] Response time is reasonable (< 5 seconds for cold start)

### 10.4 Test with Custom Name

```bash
# Test with different names
curl "http://localhost:9999/ai/hello/Alice"
curl "http://localhost:9999/ai/hello/Conductor%20User"
```

**Check for issues**:
- [ ] Each request generates unique, personalized greeting
- [ ] Special characters in name handled correctly

### 10.5 Verify Think Agent Schema Output Mapping

This tests that the `schema.output` field mapping works correctly:

```bash
# The ai-greeting ensemble uses this schema:
#   schema:
#     output:
#       greeting: string
#
# The AI response should map to the 'greeting' field

curl -s http://localhost:9999/ai/hello/Test | jq 'keys'

# Expected: ["greeting", "model"]
# NOT: ["model"] alone (would indicate broken schema mapping)
```

**Check for issues**:
- [ ] Response includes `greeting` field (schema output mapping works)
- [ ] Response includes `model` field (from `_meta`)
- [ ] No `content` field (raw response should be mapped to schema field)

### 10.6 Check Server Logs for AI Execution

Look at the wrangler dev console for agent execution logs:

```
Agent execution started - generate-greeting
Agent execution completed - generate-greeting: XXXms
POST /ai/hello/Developer 200 OK (XXXms)
```

**Check for issues**:
- [ ] Agent execution logged with timing
- [ ] No errors in console
- [ ] Reasonable execution time (typically 500ms-3s)

### 10.7 Test Error Handling (No AI Binding)

If testing without AI binding configured:

```bash
# Remove or comment out the [ai] section in wrangler.toml
# Then test:
curl http://localhost:9999/ai/hello/Test
```

**Expected Error**:
```json
{
  "error": "Cloudflare AI binding not available. Add [ai] binding = \"AI\" to wrangler.toml"
}
```

**Check for issues**:
- [ ] Clear error message (not generic 500)
- [ ] Tells user exactly what to configure

### 10.8 Common AI Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| "Binding AI needs to be run remotely" | 500 error in local dev | Add `remote = true` to `[ai]` section |
| "Authentication error for /memberships" | 401 from Cloudflare API | Add `account_id` to wrangler.toml |
| Empty `greeting` field | `{"model":"..."}` only | Bug in schema passthrough - update conductor |
| "AI binding not available" | Clear error message | Add `[ai]` binding to wrangler.toml |
| Slow response (>10s) | Timeout or slow AI | Normal for first request (cold start) |

---

## 📊 Report Template

Create report at `.planning/CONDUCTOR-vX.X.X-RELEASE-REPORT.md`:

```markdown
# Conductor vX.X.X Release Report

**Date**: YYYY-MM-DD
**Tested By**: AI Release Agent
**Overall Result**: ✅ PASS / ❌ FAIL / ⚠️ PASS WITH ISSUES

## Executive Summary

[2-3 sentences on first-time user experience quality]

## Time to First Success

| Milestone | Target | Actual | Status |
|-----------|--------|--------|--------|
| Install complete | 60s | Xs | ✅/❌ |
| Dev server running | 30s | Xs | ✅/❌ |
| First agent working | 2m | Xm | ✅/❌ |
| First ensemble working | 2m | Xm | ✅/❌ |
| **Total** | **5m** | **Xm** | ✅/❌ |

## Phase Results

### Phase 1: Installation
- [ ] Init command: ✅/❌
- [ ] Dependencies: ✅/❌
- [ ] Tests: ✅/❌
- [ ] Build: ✅/❌
- [ ] Cloudflare compatibility (nodejs_compat): ✅/❌

### Phase 2: Dev Server
- [ ] Server starts: ✅/❌
- [ ] Default endpoints: ✅/❌

### Phase 3: First Agent
- [ ] Agent created: ✅/❌
- [ ] Auto-discovered: ✅/❌
- [ ] Tests pass: ✅/❌

### Phase 4: First Ensemble
- [ ] Ensemble created: ✅/❌
- [ ] HTTP trigger works: ✅/❌
- [ ] Output correct: ✅/❌

### Phase 5: Logging
- [ ] Logger available in agent: ✅/❌
- [ ] All log levels work: ✅/❌
- [ ] Context propagation: ✅/❌
- [ ] Structured logging: ✅/❌

### Phase 6: Execute API
- [ ] API works: ✅/❌
- [ ] Returns execution ID: ✅/❌

### Phase 7: Documentation Endpoints
- [ ] `/docs` landing page (200): ✅/❌
- [ ] `/docs/agents` agents list (200): ✅/❌
- [ ] `/docs/agents/:name` agent detail (200): ✅/❌
- [ ] `/docs/ensembles` ensembles list (200): ✅/❌
- [ ] `/docs/ensembles/:name` ensemble detail (200): ✅/❌
- [ ] `/docs/api` Stoplight Elements UI (200): ✅/❌
- [ ] `/docs/openapi.json` JSON spec (200): ✅/❌
- [ ] `/docs/openapi.yaml` YAML spec (200): ✅/❌
- [ ] `/docs/:slug` markdown page (200): ✅/❌
- [ ] `/api/v1/agents` JSON list: ✅/❌
- [ ] `/api/v1/ensembles` JSON list: ✅/❌
- [ ] Custom agents/ensembles appear: ✅/❌

### Phase 8: Trigger Authentication
- [ ] Bearer auth (missing token → 401): ✅/❌
- [ ] Bearer auth (wrong token → 401): ✅/❌
- [ ] Bearer auth (correct token → 200): ✅/❌
- [ ] Basic auth (WWW-Authenticate header): ✅/❌
- [ ] Basic auth (correct creds → 200): ✅/❌
- [ ] Signature auth (GitHub preset): ✅/❌
- [ ] Auth context propagation to agent: ✅/❌

### Phase 9: HITL Callback Routes
- [ ] POST /callback/:token route exists (500, not 404): ✅/❌
- [ ] GET /callback/:token route exists (500, not 404): ✅/❌
- [ ] Token-based auth (no API key required): ✅/❌
- [ ] Request body parsing works: ✅/❌
- [ ] Empty body defaults to approved: ✅/❌
- [ ] Nested paths return 404: ✅/❌
- [ ] Various token formats accepted: ✅/❌
- [ ] Legacy routes removed (404): ✅/❌

### Phase 10: AI / Workers AI Testing (Optional)
- [ ] Cloudflare API token obtained: ✅/❌/⏭️ Skipped
- [ ] Account ID retrieved via `wrangler whoami`: ✅/❌/⏭️ Skipped
- [ ] AI binding configured in wrangler.toml: ✅/❌/⏭️ Skipped
- [ ] `/ai/hello/:name` returns 200: ✅/❌/⏭️ Skipped
- [ ] `greeting` field contains AI-generated text: ✅/❌/⏭️ Skipped
- [ ] `model` field shows Workers AI model: ✅/❌/⏭️ Skipped
- [ ] Schema output mapping works (greeting not empty): ✅/❌/⏭️ Skipped
- [ ] Agent execution logged in console: ✅/❌/⏭️ Skipped
- [ ] Error handling clear when AI not configured: ✅/❌/⏭️ Skipped

## Issues Found

### Issue 1: [Short Title]

**Severity**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**What Happened**:
[Exact error message or behavior]

**Expected**:
[What should have happened]

**Root Cause**:
[Your analysis of why this happened]

**Recommended Fix**:
```typescript
// Specific code change or configuration fix
```

**Files to Modify**:
- `path/to/file.ts` - [what to change]

---

### Issue 2: [Short Title]
[Same format...]

---

## Recommendations for Conductor Team

### Must Fix Before Release
1. [Critical issues that block users]

### Should Fix Soon
1. [High friction issues]

### Nice to Have
1. [Polish items]

## Logging Verification Results

| Log Level | Appears in Console | Context Included | Format Correct |
|-----------|-------------------|------------------|----------------|
| debug | ✅/❌ | ✅/❌ | ✅/❌ |
| info | ✅/❌ | ✅/❌ | ✅/❌ |
| warn | ✅/❌ | ✅/❌ | ✅/❌ |
| error | ✅/❌ | ✅/❌ | ✅/❌ |

**Logger API Available**: ✅/❌
**Structured Data Works**: ✅/❌
**Request Context Propagated**: ✅/❌

## Authentication Verification Results

| Auth Type | Config Parsed | Validator Created | Auth Success | Auth Failure | Context Propagated |
|-----------|---------------|-------------------|--------------|--------------|-------------------|
| bearer | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| basic | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| signature (github) | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

**Trigger Auth Bridge Works**: ✅/❌
**Environment Variables Interpolated**: ✅/❌
**Error Messages User-Friendly**: ✅/❌
**No Stack Traces Leaked**: ✅/❌

## HITL Callback Verification Results

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| POST /callback/:token exists | 500 (no binding) | | ✅/❌ |
| GET /callback/:token exists | 500 (no binding) | | ✅/❌ |
| No API key required | No 401 | | ✅/❌ |
| Approval body parsed | 500 (not 400) | | ✅/❌ |
| Rejection body parsed | 500 (not 400) | | ✅/❌ |
| Empty body accepted | 500 (not 400) | | ✅/❌ |
| Nested paths rejected | 404 | | ✅/❌ |
| Legacy /callbacks/* routes | 404 | | ✅/❌ |

**Note**: HITL routes return 500 in local dev because `HITL_STATE` Durable Object binding is not configured. This is expected - tests verify routes exist and reach the handler (not 404) without requiring API key auth (not 401).

**Token-Based Auth Works**: ✅/❌
**Body Parsing Works**: ✅/❌
**Route Structure Correct**: ✅/❌

## Documentation Endpoints Verification Results

| Route | Expected | Actual Status | Content Verified |
|-------|----------|---------------|------------------|
| `/docs` | 200 | | HTML landing page |
| `/docs/agents` | 200 | | `<h1>Agents</h1>` |
| `/docs/agents/:name` | 200 | | Agent detail page |
| `/docs/ensembles` | 200 | | `<h1>Ensembles</h1>` |
| `/docs/ensembles/:name` | 200 | | Ensemble detail page |
| `/docs/api` | 200 | | Stoplight Elements API |
| `/docs/openapi.json` | 200 | | Valid JSON with paths |
| `/docs/openapi.yaml` | 200 | | Valid YAML format |
| `/docs/:slug` | 200 | | Rendered markdown |

**All Routes Return 200**: ✅/❌
**HTML Pages Render Correctly**: ✅/❌
**OpenAPI Spec Valid**: ✅/❌
**Custom Agents/Ensembles Listed**: ✅/❌

## AI / Workers AI Verification Results (Optional)

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| API token configured | In .dev.vars | | ✅/❌/⏭️ |
| Account ID configured | In wrangler.toml | | ✅/❌/⏭️ |
| AI binding configured | `[ai]` with `remote = true` | | ✅/❌/⏭️ |
| `/ai/hello/:name` status | 200 | | ✅/❌/⏭️ |
| `greeting` field present | Non-empty string | | ✅/❌/⏭️ |
| `model` field present | `@cf/meta/...` | | ✅/❌/⏭️ |
| Response time | < 5s | | ✅/❌/⏭️ |
| Agent execution logged | In console | | ✅/❌/⏭️ |

**Workers AI Integration Works**: ✅/❌/⏭️ Skipped
**Schema Output Mapping Works**: ✅/❌/⏭️ Skipped
**Error Messages Clear**: ✅/❌/⏭️ Skipped

**Note**: This phase is optional and requires a Cloudflare API token with Workers AI permissions. Mark as "⏭️ Skipped" if not testing AI functionality.

## Performance Metrics

| Metric | Value |
|--------|-------|
| pnpm install | Xs |
| pnpm test | Xs |
| pnpm build | Xms |
| Cold start | Xms |
| Agent execution | Xms |
| Ensemble execution | Xms |

## Conclusion

[Final assessment of release readiness]
```

---

## 🚨 Critical Reminders

1. **NEVER SKIP FAILURES** - Every error must be documented with a fix
2. **TIME EVERYTHING** - First-time experience is measured in seconds
3. **TEST AS A NEWBIE** - Don't use knowledge of internals
4. **LOGGING IS CRITICAL** - Verify logger works in agents
5. **PROPOSE FIXES** - Don't just report problems, solve them

---

## Quick Reference: Common Issues & Fixes

### Template Issues

| Issue | Check | Fix |
|-------|-------|-----|
| File path dependency | `grep "file:" package.json` | Change to `"^X.X.X"` |
| Wrong entry point | `grep "main" wrangler.toml` | Change to `dist/index.mjs` |
| Missing nodejs_compat | `grep "nodejs_compat" wrangler.toml` | Add `compatibility_flags = ["nodejs_compat"]` |

### Agent Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Wrong signature | Agent not receiving input | Use `{ input, logger }: AgentExecutionContext` |
| Logger undefined | `logger.info` crashes | Check AgentExecutionContext destructuring |
| Schema mismatch | Validation errors | Align YAML schema with code |

### Ensemble Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Wrong syntax | Parse errors | Use `flow:` with `agent:` not `agents:` with `name:` |
| Output not working | Empty response | Use `${agent.output.field}` not `${agent.field}` |
| Interpolation fails | Literal `${...}` in output | Check variable names match agent names |

### Authentication Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Secret not found | "Bearer auth requires a secret" | Use `${env.VAR_NAME}` syntax in YAML |
| Wrong auth type | "Unknown trigger auth type" | Use: `bearer`, `basic`, `signature`, `apiKey` |
| Signature fails | Always 401 on valid signature | Check preset matches provider (github, stripe, slack) |
| Context missing | `auth` undefined in agent | Ensure `context` is destructured in AgentExecutionContext |
| Basic auth no header | Missing WWW-Authenticate | Validator should return header - check BasicAuthValidator |

### Environment Variable Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Env not interpolated | Literal `${env.X}` in error | Check `.dev.vars` file exists and has the variable |
| Secret empty | Auth always fails | Restart wrangler dev after adding to `.dev.vars` |
| Wrong format | Basic auth fails | Format is `username:password` (colon-separated) |

### HITL Callback Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Route returns 404 | `/callback/:token` not found | Check callbacks routes mounted in app.ts |
| Returns 401 | "Invalid credentials" on callback | Callbacks should NOT be behind auth middleware |
| 500 HITL_STATE error | "HITLState Durable Object not configured" | Configure `HITL_STATE` binding in wrangler.toml |
| Body parsing fails | 400 Bad Request | Ensure Content-Type: application/json header |
| Legacy routes work | `/callbacks/approve/:token` returns 200 | These should be 404 (removed in v0.4.6) |

### CLI Issues (Unified ensemble CLI)

| Issue | Symptom | Fix |
|-------|---------|-----|
| `ensemble` not found | Command not found | `npm install -g @ensemble-edge/ensemble` |
| Templates missing | "Conductor templates are missing..." | Reinstall CLI: `npm install -g @ensemble-edge/ensemble@latest` |
| Init hangs | Prompts waiting for input | Use `--yes` flag for non-interactive mode |
| Wrangler not found | "wrangler: command not found" | Install wrangler: `npm install -g wrangler` |
| Old CLI patterns | Using `npx @ensemble-edge/conductor` | Use `ensemble conductor` instead (unified CLI) |

---

**Last Updated**: 2025-12-05
**Version**: 2.6 - Updated for unified CLI (`ensemble conductor` commands), bundled templates, and `--yes` non-interactive mode
