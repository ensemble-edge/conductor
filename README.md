# @ensemble-edge/conductor

> Edge-native AI orchestration — built exclusively for Cloudflare Workers, not ported from Lambda.

[![npm version](https://img.shields.io/npm/v/@ensemble-edge/conductor.svg)](https://www.npmjs.com/package/@ensemble-edge/conductor)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Overview

**Conductor** is an orchestration runtime that executes YAML-defined workflows at the edge using Cloudflare Workers. Purpose-built for V8 isolates—zero cold starts, 300+ global locations, native access to Workers AI, KV, D1, R2, Durable Objects, and Vectorize.

Think of it as the runtime engine for your AI workflows—agents are musicians, ensembles are sheet music, and Conductor performs the symphony.

### Key Features

- 🚀 **Edge-Native** - Runs on Cloudflare Workers for sub-50ms latency globally
- 📝 **YAML-Driven** - Define workflows as simple, readable YAML files
- 🎯 **Type-Safe** - Full TypeScript support with strong typing
- 🧪 **Built-in Testing** - 1500+ tests passing, comprehensive mocks, custom matchers
- 🔄 **State Management** - Built-in state sharing across agent executions
- 💾 **Integrated Caching** - KV-based caching for performance and cost optimization
- 🧩 **Composable Operations** - 13 operation types: think, code, storage, data, http, tools, email, sms, html, pdf, form, queue, docs
- 🛠️ **CLI Tools** - Project scaffolding, agent generation, and upgrades
- 📦 **SDK** - Client library, testing utilities, and agent factories
- 🔁 **Durable Objects** - Stateful workflows with strong consistency (ExecutionState, HITL)
- ⏰ **Scheduled Execution** - Cron-based ensemble triggers for automated workflows
- 🪝 **Webhooks** - HTTP triggers for ensemble execution
- 🤝 **Human-in-the-Loop** - Approval workflows with resumption support
- 📊 **Async Execution Tracking** - Real-time status tracking for long-running workflows
- 🎯 **Scoring System** - Quality evaluation with automatic retry logic
- 🏗️ **Build Triggers** - Static generation at build time
- 🖥️ **CLI Triggers** - Custom developer commands
- 🔀 **Multi-path HTTP** - Multiple routes per ensemble

## Getting Started

### Quick Start

```bash
# Create a new project (no installation needed)
npx @ensemble-edge/ensemble conductor init my-project
cd my-project

# Install and build
pnpm install
pnpm run build

# Start development server
npx wrangler dev --local-protocol http
```

> **Note**: Dev container users should add `--ip 0.0.0.0` flag: `npx wrangler dev --local-protocol http --ip 0.0.0.0`

> **Tip**: For CI/CD pipelines, use the `-y` flag to skip all interactive prompts:
> ```bash
> npx @ensemble-edge/conductor init my-project -y
> ```

The init command creates:
- ✅ Complete project structure
- ✅ 10 example pages (static, dynamic, forms, SSR)
- ✅ Working hello-world ensemble
- ✅ Example agents and tests
- ✅ Ready to run immediately

### Your Project Structure

After running `conductor init`, here's what you'll have:

```
my-project/
├── src/
│   ├── index.ts                 # 🔧 Worker entry point (Choose: Built-in API or custom)
│   └── lib/                     # 👈 YOUR UTILITIES - Shared helpers, utilities
│       └── helpers.ts           #    Reusable functions across agents
│
├── agents/                       # 👈 YOUR AGENTS - Business logic implementations
│   ├── examples/                 #    Learning examples (delete when ready)
│   └── (your agents here)        #    Each agent is a folder with:
│                                 #    - agent.yaml (configuration)
│                                 #    - index.ts (implementation code)
│
├── docs/                         # 📖 API DOCUMENTATION - First-class component
│   ├── docs.yaml                 #    Configuration (route, UI, theme)
│   └── *.md                      #    Markdown pages with Handlebars
│
├── ensembles/                    # 👈 YOUR WORKFLOWS - Orchestration definitions
│   └── hello-world.yaml          #    YAML files defining:
│                                 #    - flow (execution steps)
│                                 #    - schedules (cron triggers)
│                                 #    - webhooks (HTTP triggers)
│                                 #    - state (shared data)
│
├── prompts/                      # 🔄 SHARED PROMPTS - Versioned with Edgit
│   ├── extraction.md             #    Prompt templates that can be:
│   └── company-analysis.md       #    - Referenced by multiple agents
│                                 #    - Versioned independently (v1.0.0, v2.0.0)
│                                 #    - Reused across ensembles
│
├── queries/                      # 🔄 SHARED SQL - Versioned with Edgit
│   ├── company-lookup.sql        #    SQL queries that can be:
│   └── competitor-search.sql     #    - Referenced by multiple agents
│                                 #    - Versioned independently
│                                 #    - Optimized over time
│
├── configs/                      # 🔄 SHARED CONFIGS - Versioned with Edgit
│   └── model-settings.yaml       #    Configuration files for:
│                                 #    - Model parameters
│                                 #    - Feature flags
│                                 #    - Environment-specific settings
│
├── schemas/                      # 🔄 SHARED SCHEMAS - Versioned with Edgit
│   ├── invoice.json              #    JSON Schema definitions for:
│   └── contact.json              #    - Structured AI outputs
│                                 #    - Data validation
│                                 #    - Versioned independently
│
├── wrangler.toml                 # 🔧 Cloudflare configuration
├── package.json                  # 📦 Dependencies (@ensemble-edge/conductor, @ensemble-edge/edgit)
├── tsconfig.json                 # TypeScript config
└── README.md                     # Project documentation
```

**Where to add your components:**

| Component | Location | Created With | Purpose |
|-----------|----------|--------------|---------|
| **Agents** | `agents/<name>/` | Create folder manually | Business logic: AI, functions, API calls, data operations |
| **Ensembles** | `ensembles/<name>.yaml` | Create YAML file manually | Workflow orchestration: define flow, schedules, webhooks |
| **Prompts** | `prompts/<name>.md` | Create file, register with `edgit tag` | Shared prompt templates - reusable across agents/ensembles |
| **Queries** | `queries/<name>.sql` | Create file, register with `edgit tag` | Shared SQL queries - reusable, versioned, optimized |
| **Configs** | `configs/<name>.yaml` | Create file, register with `edgit tag` | Shared configuration - model settings, feature flags |
| **Schemas** | `schemas/<name>.json` | Create file, register with `edgit tag` | JSON Schema for structured AI outputs - versioned, validated |
| **Utilities** | `src/lib/<name>.ts` | Create file | Shared helper functions across your codebase |
| **Schedules** | Inside ensemble YAML | Add `schedules:` array | Cron-based automation (daily reports, monitoring) |
| **Webhooks** | Inside ensemble YAML | Add `webhooks:` array | HTTP triggers (Stripe, GitHub, external events) |
| **API Config** | `src/index.ts` | Edit file | Choose built-in API or custom endpoints |
| **Cron Triggers** | `wrangler.toml` | Copy from ensemble schedules | Register cron expressions with Cloudflare |
| **Environment Vars** | `wrangler.toml` | Edit `[vars]` section | API keys, settings, feature flags |

**Key Concepts:**

1. **Two types of components**:
   - **Built-in** (inside Conductor) - Scoring agents, validators, etc. - updated when you upgrade Conductor
   - **Your components** (your project) - Agents, ensembles, prompts, queries - never touched by Conductor

2. **Shared, versioned components** (🔄):
   - `prompts/`, `queries/`, `configs/` are **Edgit components**
   - Can be referenced by multiple agents or ensembles
   - Versioned independently (e.g., `extraction-prompt@v1.0.0`, `extraction-prompt@v2.0.0`)
   - **Example**: 5 different agents can all use `company-analysis-prompt@v2.1.0`

3. **Agent implementations** (👈):
   - `agents/` contains your business logic code
   - Each agent can reference shared prompts/queries at specific versions
   - **Example**: `agent.yaml` can specify `prompt: company-analysis@v2.1.0`

4. **Workflow orchestration**:
   - `ensembles/` defines how agents work together
   - Can reference components directly: `component: extraction-prompt@v0.1.0`
   - **Example**: Mix versions - use v0.1.0 of prompt (ancient but perfect) with v3.0.0 of agent (latest)

5. **Multiple projects share Conductor**:
   - Use `npx @ensemble-edge/conductor` (no installation needed)
   - Use in many projects: `my-app-1/`, `my-app-2/`, `my-app-3/`
   - Each project has its own agents, ensembles, prompts, queries

### Add to Existing Project

Already have a Cloudflare Worker? Add Conductor to it:

```bash
# 1. Install conductor
npm install @ensemble-edge/conductor

# 2. Create directories
mkdir -p agents ensembles

# 3. Add your first agent
ensemble conductor add agent greet --operation code

# 4. Create an ensemble
# Create ensembles/hello-world.yaml manually or use ensemble conductor add ensemble

# 5. Update your worker
```

Then in your worker (`src/index.ts`):

```typescript
import { Executor, MemberLoader } from '@ensemble-edge/conductor';
import greetConfig from '../agents/greet/agent.yaml';
import greetImpl from '../agents/greet';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const executor = new Executor({ env, ctx });

    const loader = new MemberLoader({ env, ctx });
    const greet = loader.registerMember(greetConfig, greetImpl);
    executor.registerMember(greet);

    // Your logic here
    return Response.json({ status: 'ok' });
  }
};
```

**That's it!** Conductor doesn't require a specific project structure - just install and use.

## Architecture

Conductor is a single npm package with three parts:

```
@ensemble-edge/conductor
├── Runtime      - Core orchestration engine (Executor, Parser, StateManager, Durable Objects)
├── CLI          - Project management tools (init, add member, validate, upgrade)
└── SDK          - Development utilities (client, testing, member factories)
```

## Runtime API

### Basic Usage

```typescript
import { Executor, MemberLoader } from '@ensemble-edge/conductor';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Create executor
    const executor = new Executor({ env, ctx });

    // Register your agents
    const loader = new MemberLoader({ env, ctx });
    const greet = loader.registerMember(greetConfig, greetFunction);
    executor.registerMember(greet);

    // Execute ensemble
    const input = await request.json();
    const result = await executor.executeFromYAML(yamlContent, input);

    return Response.json(result);
  }
};
```

### Using Durable Objects

Export Durable Objects in your worker:

```typescript
import { Executor, ExecutionState, HITLState } from '@ensemble-edge/conductor';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const executor = new Executor({ env, ctx });
    // ... your logic
  }
};

// Export Durable Objects
export { ExecutionState, HITLState };
```

## Testing

Conductor provides **first-class testing support** built into the core package. No separate testing package needed - comprehensive testing utilities are included.

### Test Infrastructure

**1500+ tests passing** covering:
- 🧪 **Unit Tests** - Core runtime, agents, state management, pages
- 🔗 **Integration Tests** - End-to-end workflows, catalog loading, dynamic routing

**Test Coverage:**
- Lines: 40%+ | Functions: 40%+ | Branches: 35%+ | Statements: 40%+
- Comprehensive coverage of critical paths with mock implementations

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

Import testing utilities from `@ensemble-edge/conductor/testing`:

```typescript
import { describe, it, expect } from 'vitest';
import { TestConductor, registerMatchers } from '@ensemble-edge/conductor/testing';

// Register custom matchers
registerMatchers();

describe('My Ensemble', () => {
  it('should execute successfully', async () => {
    // Create test conductor
    const conductor = await TestConductor.create({
      projectPath: '.'
    });

    // Execute ensemble
    const result = await conductor.executeEnsemble('hello-world', {
      name: 'World'
    });

    // Use custom matchers
    expect(result).toBeSuccessful();
    expect(result).toHaveOutput({ message: 'Hello, World!' });
  });
});
```

### Custom Matchers

Conductor provides specialized matchers for testing workflows:

```typescript
// Success/failure assertions
expect(result).toBeSuccessful();
expect(result).toBeFailed();

// Output assertions
expect(result).toHaveOutput({ key: 'value' });
expect(result).toHaveOutputContaining({ key: 'value' });

// State assertions
expect(result).toHaveState({ counter: 5 });

// Member execution
expect(result).toHaveMemberExecuted('member-name');
expect(result).toHaveMemberFailed('member-name');

// Timing assertions
expect(result).toHaveCompletedWithin(1000); // ms
```

### Mock Providers

Test without external dependencies using built-in mocks:

```typescript
import {
  mockAIProvider,
  mockDatabase,
  mockHTTP,
  mockVectorize
} from '@ensemble-edge/conductor/testing';

describe('Think Member', () => {
  it('should call AI provider', async () => {
    const aiMock = mockAIProvider({
      response: { message: 'AI response' }
    });

    const conductor = await TestConductor.create({
      projectPath: '.',
      mocks: { ai: aiMock }
    });

    const result = await conductor.executeMember('analyze', {
      text: 'Sample text'
    });

    expect(aiMock.calls).toHaveLength(1);
    expect(result.output.message).toBe('AI response');
  });
});
```

**Available Mocks:**
- `MockAIProvider` - Mock AI/LLM responses (Think agents)
- `MockDatabase` - Mock KV/D1/R2 operations (Data agents)
- `MockHTTPClient` - Mock HTTP requests (HTTP agents)
- `MockVectorize` - Mock vector search (RAG agents)
- `MockDurableObject` - Mock Durable Object state

### Test Configuration

Configure testing with `vitest.config.mts`:

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' }
      }
    },
    testTimeout: 15000, // 15 seconds for Worker operations
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 35,
        statements: 40
      }
    }
  }
});
```

### Testing Patterns

#### Unit Testing Members

```typescript
import { APIMember } from '@ensemble-edge/conductor';

describe('API Member', () => {
  it('should make HTTP request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'response' })
    });
    global.fetch = mockFetch;

    const member = new APIMember({
      name: 'test-api',
      type: 'API',
      config: { url: 'https://api.example.com/data' }
    });

    const result = await member.execute({
      input: {},
      env: {} as any,
      ctx: {} as ExecutionContext
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.any(Object)
    );
  });
});
```

#### Integration Testing Workflows

```typescript
describe('Company Intelligence Workflow', () => {
  it('should fetch and analyze company data', async () => {
    const conductor = await TestConductor.create({
      projectPath: '.',
      mocks: {
        http: mockHTTP({
          'https://api.example.com/company': {
            data: { name: 'Acme Corp' }
          }
        }),
        ai: mockAIProvider({
          response: { analysis: 'Strong company' }
        })
      }
    });

    const result = await conductor.executeEnsemble('company-intelligence', {
      domain: 'acme.com'
    });

    expect(result).toBeSuccessful();
    expect(result).toHaveOutput({
      analysis: 'Strong company'
    });
    expect(result).toHaveMemberExecuted('fetch-company-data');
    expect(result).toHaveMemberExecuted('analyze-company');
  });
});
```

#### State Management Testing

```typescript
describe('StateManager', () => {
  it('should track state access', () => {
    const manager = new StateManager({
      initial: { counter: 0, name: 'test' }
    });

    const { getPendingUpdates } = manager.getStateForMember('member1', {
      use: ['counter'],
      set: ['counter']
    });

    const { newLog } = getPendingUpdates();
    const manager2 = manager.applyPendingUpdates({}, newLog);

    const report = manager2.getAccessReport();
    expect(report.accessPatterns['member1']).toBeDefined();
    expect(report.unusedKeys).toContain('name');
  });
});
```

### Test Structure

Recommended project test structure:

```
my-project/
├── tests/
│   ├── unit/              # Unit tests for individual agents
│   │   ├── agents/
│   │   │   ├── greet.test.ts
│   │   │   ├── analyze.test.ts
│   │   │   └── fetch-data.test.ts
│   │   └── runtime/
│   │       ├── parser.test.ts
│   │       ├── interpolation.test.ts
│   │       └── state-manager.test.ts
│   │
│   └── integration/       # Integration tests for workflows
│       ├── hello-world.test.ts
│       ├── company-intel.test.ts
│       └── approval-workflow.test.ts
│
├── vitest.config.mts      # Test configuration
└── package.json
```

### Continuous Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Debugging Tests

```bash
# Run specific test file
npx vitest run tests/unit/members/greet.test.ts

# Run tests matching pattern
npx vitest run -t "should execute"

# Debug mode
npx vitest --inspect-brk

# UI mode
npx vitest --ui
```

### Best Practices

1. **Test at the right level**
   - Unit tests: Individual agents, utilities, parsing
   - Integration tests: Complete workflows, state flow

2. **Use mocks for external dependencies**
   - Mock AI providers to avoid API costs
   - Mock databases to avoid state pollution
   - Mock HTTP to avoid network flakiness

3. **Test critical paths first**
   - Agent execution
   - State management
   - Error handling
   - Configuration parsing

4. **Keep tests fast**
   - Use mocks instead of real services
   - Run in Workers pool for realistic execution
   - Set appropriate timeouts (15s default)

5. **Maintain test coverage**
   - Aim for 40%+ coverage on critical code
   - Focus on business logic, not boilerplate
   - Use coverage reports to find gaps

## SDK Usage

### Agent Development

```typescript
import { createFunctionAgent } from '@ensemble-edge/conductor/sdk';

export default createFunctionAgent({
  async handler({ input }) {
    return {
      message: `Hello, ${input.name}!`
    };
  }
});
```

### Client Library (Call Deployed Conductors)

```typescript
import { ConductorClient } from '@ensemble-edge/conductor/sdk';

// Connect to your deployed conductor
const client = new ConductorClient({
  baseUrl: 'https://my-project.example.com',
  apiKey: process.env.API_KEY
});

// Execute an ensemble
const result = await client.executeEnsemble('company-intelligence', {
  domain: 'acme.com'
});

// Stream results
for await (const chunk of client.streamEnsemble('analysis', input)) {
  console.log(chunk);
}
```

### Testing Utilities

See the [Testing](#testing) section above for comprehensive testing examples using TestConductor, custom matchers, and mock providers.

```typescript
import { TestConductor } from '@ensemble-edge/conductor/testing';

describe('greet agent', () => {
  it('should greet user', async () => {
    const conductor = await TestConductor.create({ projectPath: '.' });

    const result = await conductor.executeAgent('greet', {
      name: 'World'
    });

    expect(result.success).toBe(true);
    expect(result.output.message).toBe('Hello, World!');
  });
});
```

### Schema Validation

Use JSON Schema in your agent.yaml for input/output validation:

```yaml
# agents/my-agent/agent.yaml
name: my-agent
operation: code
schema:
  input:
    type: object
    properties:
      domain:
        type: string
      required:
        type: boolean
    required: [domain]
  output:
    type: object
    properties:
      result:
        type: string
```

Conductor automatically validates inputs/outputs against your schema at runtime.

## CLI Commands

All CLI commands are available through the unified Ensemble CLI:

### `ensemble conductor init <name>`

Create a new Conductor project

```bash
ensemble conductor init my-project
cd my-project
pnpm install
pnpm run build
npx wrangler dev --local-protocol http
```

> **Note**: Dev container users should add `--ip 0.0.0.0` flag

> **Tip**: For CI/automated environments, use `--yes` to skip all interactive prompts:
> ```bash
> ensemble conductor init my-project --yes
> ```

Creates a complete project with:
- 10 example pages (static, dynamic, forms)
- Working hello-world ensemble
- Example agents with implementations
- Test suite with passing examples

### `ensemble conductor add agent <name>`

Scaffold a new agent (works in any project with Conductor installed)

```bash
ensemble conductor add agent analyze-company --operation think
ensemble conductor add agent fetch-data --operation http
ensemble conductor add agent calculate --operation code

# Create think agent with Edgit-ready prompt
ensemble conductor add agent analyze-company --operation think --with-prompt
```

**Options:**
- `-o, --operation <type>` - Agent operation type (code, think, http, data, storage, etc.)
- `-d, --description <desc>` - Agent description
- `--with-prompt` - Create prompt.md file for think agents (Edgit integration)

Creates:
- `agents/<name>/agent.yaml` - Configuration
- `agents/<name>/index.ts` - Implementation template
- `agents/<name>/prompt.md` - Prompt template (with --with-prompt)

### `ensemble conductor validate`

Validate YAML syntax and agent references

```bash
ensemble conductor validate
```

Checks:
- ✅ All agent.yaml files are valid YAML
- ✅ Required fields present (name, operation)
- ✅ Ensemble agent references exist
- ✅ Schema compliance

### `ensemble conductor upgrade`

Upgrade Conductor and run migrations

```bash
ensemble conductor upgrade
# or skip confirmation
ensemble conductor upgrade --yes
```

What it does:
- 📡 Checks for latest version
- 📦 Updates package
- 🔧 Runs migration scripts
- ✅ Verifies configuration

## Agent Types

### Code Agent
Execute JavaScript/TypeScript functions

```yaml
# agents/user/calculate/agent.yaml
name: calculate
operation: code
handler: ./index.ts
description: Calculate score

schema:
  input:
    value: number
  output:
    score: number
```

### Think Agent
AI reasoning with LLMs (OpenAI, Anthropic, Cloudflare AI)

```yaml
# agents/user/analyze/agent.yaml
name: analyze
operation: think
handler: ./index.ts
description: Analyze data with AI

config:
  model: gpt-4
  provider: openai
  temperature: 0.7
```

### Storage Agent
Storage operations with KV, D1, or R2

```yaml
# agents/user/cache-lookup/agent.yaml
name: cache-lookup
operation: storage
handler: ./index.ts
description: Look up cached data

config:
  storage: kv
  operation: get
  binding: CACHE
```

### HTTP Agent
HTTP requests to external services

```yaml
# agents/user/fetch-data/agent.yaml
name: fetch-data
operation: http
handler: ./index.ts
description: Fetch external data

config:
  url: https://api.example.com/data
  method: GET
  headers:
    Authorization: Bearer ${env.API_KEY}
```

## Ensembles

Define workflows as YAML:

```yaml
name: company-intelligence
description: Analyze company data

trigger:
  - type: http
    path: /api/intelligence
    methods: [POST]
    public: true

flow:
  - name: fetch-company-data
    agent: fetch-company-data
    input:
      domain: ${input.domain}
    cache:
      ttl: 3600

  - name: analyze-company
    agent: analyze-company
    input:
      companyData: ${fetch-company-data.output}
      instructions: Analyze this company

output:
  analysis: ${analyze-company.output.analysis}
```

## Scheduled Execution

Schedule ensembles to run automatically using cron expressions. Perfect for periodic data processing, monitoring, reports, and automated workflows.

### Configuration

Add schedules to your ensemble YAML:

```yaml
name: daily-report
description: Generate daily analytics report

schedules:
  - cron: "0 9 * * *"           # Every day at 9 AM UTC
    timezone: "America/New_York" # Optional: timezone for cron
    enabled: true
    input:
      reportType: "daily"
      recipients: ["team@example.com"]

  - cron: "0 */4 * * *"          # Every 4 hours
    enabled: true
    input:
      reportType: "hourly"

flow:
  - name: generate-report
    agent: generate-report
    input:
      type: ${input.reportType}
```

### Cron Expression Format

Standard Unix cron syntax:

```
┌─────── minute (0 - 59)
│ ┌────── hour (0 - 23)
│ │ ┌───── day of month (1 - 31)
│ │ │ ┌──── month (1 - 12)
│ │ │ │ ┌─── day of week (0 - 7) (Sunday = 0 or 7)
│ │ │ │ │
* * * * *
```

**Examples:**
- `"0 9 * * *"` - Daily at 9 AM UTC
- `"*/15 * * * *"` - Every 15 minutes
- `"0 0 * * 0"` - Weekly on Sunday at midnight
- `"0 0 1 * *"` - Monthly on the 1st at midnight
- `"0 */6 * * *"` - Every 6 hours

### Worker Configuration

Add cron triggers to your `wrangler.toml`:

```toml
[triggers]
crons = [
  "0 9 * * *",      # Daily at 9 AM UTC
  "0 */4 * * *",    # Every 4 hours
  "*/15 * * * *"    # Every 15 minutes
]
```

**Automatic generation**: Get all cron expressions from your ensembles:

```bash
curl https://your-worker.dev/api/v1/schedules/crons/list
```

### Runtime Behavior

When a cron trigger fires:

1. ScheduleManager loads all ensembles with matching cron expressions
2. Each matching schedule executes with its configured input
3. Execution includes `_schedule` metadata:

```json
{
  "reportType": "daily",
  "_schedule": {
    "cron": "0 9 * * *",
    "timezone": "America/New_York",
    "scheduledTime": 1699524000000,
    "triggeredAt": 1699524001234
  }
}
```

### Testing Schedules

Use the API to test schedules without waiting for cron:

```bash
# Trigger a specific ensemble's schedule manually
curl -X POST https://your-worker.dev/api/v1/schedules/daily-report/trigger \
  -H "Content-Type: application/json" \
  -d '{"scheduleIndex": 0}'

# Test a cron expression
curl -X POST https://your-worker.dev/api/v1/schedules/test \
  -H "Content-Type: application/json" \
  -d '{"cron": "0 9 * * *", "timezone": "America/New_York"}'
```

## Webhooks

Trigger ensemble execution via HTTP webhooks. Perfect for integrations, event-driven workflows, and external system notifications.

### Configuration

Add webhooks to your ensemble YAML:

```yaml
name: process-payment
description: Process payment webhook from Stripe

webhooks:
  - path: "/stripe-payment"
    method: POST
    auth:
      type: signature
      secret: ${env.STRIPE_WEBHOOK_SECRET}
    async: true              # Return immediately, execute in background
    timeout: 30000          # 30 second timeout

  - path: "/github-push"
    method: POST
    auth:
      type: bearer
      secret: ${env.GITHUB_TOKEN}
    mode: trigger           # 'trigger' (default) or 'resume' (HITL)

flow:
  - name: validate-payment
    agent: validate-payment
    input:
      paymentData: ${input.data}
```

### Authentication Types

**Bearer Token:**
```yaml
auth:
  type: bearer
  secret: ${env.API_SECRET}
```

Request requires: `Authorization: Bearer <secret>`

**Signature Verification:**
```yaml
auth:
  type: signature
  secret: ${env.WEBHOOK_SECRET}
```

Validates `X-Signature` header (Stripe-style HMAC).

**Basic Auth:**
```yaml
auth:
  type: basic
  secret: ${env.BASIC_AUTH_CREDENTIALS}
```

Request requires: `Authorization: Basic <base64(username:password)>`

### Webhook Modes

**Trigger Mode** (default): Start new execution
```yaml
mode: trigger
```

**Resume Mode**: Resume HITL workflow
```yaml
mode: resume
```

Used with Human-in-the-Loop workflows to resume after approval.

### Webhook URLs

Webhooks are available at:

```
https://your-worker.dev/webhooks/{path}
```

Example:
```bash
curl -X POST https://your-worker.dev/webhooks/stripe-payment \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "usd"}'
```

### Async Execution

Set `async: true` for long-running workflows:

```yaml
webhooks:
  - path: "/long-process"
    async: true
```

Returns immediately with execution ID:

```json
{
  "status": "accepted",
  "executionId": "exec_abc123",
  "statusUrl": "/api/v1/executions/exec_abc123"
}
```

## Durable Objects & Stateful Workflows

Conductor uses Cloudflare Durable Objects for strongly consistent, stateful workflow tracking. Two Durable Object types provide different state management patterns.

### ExecutionState

Tracks async execution state with real-time status queries and optional WebSocket streaming.

**Use cases:**
- Long-running workflow monitoring
- Real-time progress updates
- Execution history and metrics
- Status dashboards

**Configuration:**

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "EXECUTION_STATE"
class_name = "ExecutionState"
script_name = "conductor"

[[migrations]]
tag = "v1"
new_classes = ["ExecutionState"]
```

**Usage:**

```typescript
import { Executor } from '@ensemble-edge/conductor';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const executor = new Executor({ env, ctx });

    // Start async execution with tracking
    const executionId = crypto.randomUUID();
    const result = await executor.executeEnsemble(ensemble, input, {
      async: true,
      executionId
    });

    // Return execution ID for status tracking
    return Response.json({
      executionId,
      statusUrl: `/api/v1/executions/${executionId}`
    });
  }
};
```

**Query execution status:**

```bash
# Get current status
curl https://your-worker.dev/api/v1/executions/exec_abc123

# Stream live updates via WebSocket
wscat -c wss://your-worker.dev/api/v1/executions/exec_abc123/stream
```

**Status response:**

```json
{
  "executionId": "exec_abc123",
  "ensembleName": "process-payment",
  "status": "running",
  "startedAt": 1699524000000,
  "currentStep": "validate-payment",
  "stepIndex": 2,
  "totalSteps": 5,
  "outputs": {
    "fetch-data": { "result": "..." }
  },
  "metrics": {
    "duration": 1234,
    "stepsCompleted": 2
  }
}
```

### HITLState (Human-in-the-Loop)

Manages approval workflows and human intervention points with resumption support.

**Use cases:**
- Approval workflows
- Human review gates
- Manual intervention points
- Compliance checkpoints

**Configuration:**

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "HITL_STATE"
class_name = "HITLState"
script_name = "conductor"

[[migrations]]
tag = "v1"
new_classes = ["ExecutionState", "HITLState"]
```

**Ensemble configuration:**

```yaml
name: expense-approval
description: Expense approval workflow with human review

flow:
  - name: validate-expense
    agent: validate-expense
    input:
      expense: ${input.expense}

  - name: request-approval
    agent: request-approval
    operation: hitl
    input:
      requester: ${input.userId}
      amount: ${input.expense.amount}
      reason: ${input.expense.reason}
      approvers: ["manager@example.com"]
      timeout: 86400000  # 24 hours

  - name: process-approved-expense
    agent: process-approved-expense
    input:
      expense: ${input.expense}
```

**HITL workflow:**

1. Execution pauses at HITL step
2. Approval request sent to designated approvers
3. Execution waits for approval/rejection
4. Resume with decision

**Resume execution:**

```bash
# Approve
curl -X POST https://your-worker.dev/api/v1/executions/exec_abc123/resume \
  -H "Content-Type: application/json" \
  -d '{"approved": true, "comment": "Looks good"}'

# Reject
curl -X POST https://your-worker.dev/api/v1/executions/exec_abc123/resume \
  -H "Content-Type: application/json" \
  -d '{"approved": false, "comment": "Needs more detail"}'
```

**HITL state:**

```json
{
  "executionId": "exec_abc123",
  "status": "pending_approval",
  "requestedAt": 1699524000000,
  "approvers": ["manager@example.com"],
  "timeout": 86400000,
  "context": {
    "amount": 1000,
    "reason": "Conference travel"
  }
}
```

### Storage Backend

Durable Objects use Cloudflare's strongly consistent storage:

- **Single-threaded execution** - No race conditions
- **Transactional storage** - Atomic state updates
- **Global uniqueness** - One instance per execution ID
- **Automatic failover** - Cloudflare handles migration
- **Low latency** - Co-located with execution

## API Endpoints

Conductor provides a comprehensive REST API for workflow management.

### Base Configuration

```toml
# wrangler.toml
[vars]
API_KEYS = "key1,key2,key3"        # Optional: API key authentication
ALLOW_ANONYMOUS = "false"          # Require authentication
DISABLE_LOGGING = "false"          # Enable request logging
```

### Execution API

**POST /api/v1/execute**

Execute an ensemble:

```bash
curl -X POST https://your-worker.dev/api/v1/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "ensemble": "company-intelligence",
    "input": {
      "domain": "acme.com"
    },
    "async": true
  }'
```

Response:

```json
{
  "executionId": "exec_abc123",
  "status": "accepted",
  "statusUrl": "/api/v1/executions/exec_abc123"
}
```

**GET /api/v1/executions/:id**

Get execution status:

```bash
curl https://your-worker.dev/api/v1/executions/exec_abc123 \
  -H "X-API-Key: your-api-key"
```

**POST /api/v1/executions/:id/resume**

Resume HITL execution:

```bash
curl -X POST https://your-worker.dev/api/v1/executions/exec_abc123/resume \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"approved": true, "comment": "Approved"}'
```

**DELETE /api/v1/executions/:id**

Cancel execution:

```bash
curl -X DELETE https://your-worker.dev/api/v1/executions/exec_abc123 \
  -H "X-API-Key: your-api-key"
```

### Schedule API

**GET /api/v1/schedules**

List all scheduled ensembles:

```bash
curl https://your-worker.dev/api/v1/schedules \
  -H "X-API-Key: your-api-key"
```

**GET /api/v1/schedules/:ensembleName**

Get schedules for specific ensemble:

```bash
curl https://your-worker.dev/api/v1/schedules/daily-report \
  -H "X-API-Key: your-api-key"
```

**POST /api/v1/schedules/:ensembleName/trigger**

Manually trigger a schedule:

```bash
curl -X POST https://your-worker.dev/api/v1/schedules/daily-report/trigger \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"scheduleIndex": 0}'
```

**GET /api/v1/schedules/crons/list**

Get all cron expressions for wrangler.toml:

```bash
curl https://your-worker.dev/api/v1/schedules/crons/list \
  -H "X-API-Key: your-api-key"
```

### Member API

**GET /api/v1/agents**

List available agents:

```bash
curl https://your-worker.dev/api/v1/agents \
  -H "X-API-Key: your-api-key"
```

**GET /api/v1/agents/:name**

Get agent details:

```bash
curl https://your-worker.dev/api/v1/agents/analyze-company \
  -H "X-API-Key: your-api-key"
```

### Stream API

**POST /api/v1/stream**

Stream ensemble execution with Server-Sent Events:

```bash
curl -N -X POST https://your-worker.dev/api/v1/stream \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "ensemble": "analysis",
    "input": {"data": "..."}
  }'
```

### Health API

**GET /health**

Health check (no authentication required):

```bash
curl https://your-worker.dev/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": 1699524000000,
  "version": "1.0.0"
}
```

### Webhook API

**POST /webhooks/:path**

Trigger webhook (authentication per webhook config):

```bash
curl -X POST https://your-worker.dev/webhooks/stripe-payment \
  -H "Authorization: Bearer your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded"}'
```

## Platform Architecture

Conductor uses a **three-layer architecture** that cleanly separates AI providers, cloud platforms, and core interfaces. This design allows you to use any AI model from any provider while leveraging platform-specific features like Cloudflare's AI Gateway.

### Three Layers

```
catalog/                   # Reference data (packaged with npm)
├── ai/                    # Layer 1: AI provider catalogs
│   ├── manifest.json
│   ├── workers-ai.json
│   ├── openai.json
│   ├── anthropic.json
│   └── groq.json
└── cloud/                 # Layer 2: Cloud platform configs
    └── cloudflare/
        ├── ai-gateway.json
        ├── capabilities.json
        └── bindings.json

src/platforms/             # TypeScript source (compiles to dist)
├── base/                  # Layer 3: Core interfaces
│   ├── platform.ts
│   ├── types.ts
│   └── index.ts
└── cloudflare/            # Cloudflare adapter
    └── index.ts
```

#### Layer 1: AI Providers (`catalog/ai/`)
**AI provider catalogs** containing model lists, capabilities, and deprecation tracking. Each provider is a separate JSON file:

- **workers-ai.json** - Cloudflare's edge-hosted models (Llama, Mistral, Qwen, etc.)
- **openai.json** - GPT-4, GPT-4o, GPT-3.5, o1
- **anthropic.json** - Claude 3.5, Claude 3
- **groq.json** - Ultra-fast inference (Llama, Mixtral, Gemma)
- **manifest.json** - Registry of all providers with default routing

**Key insight**: Workers AI is just another AI provider, not a special platform feature. All providers are treated equally in configuration.

#### Layer 2: Cloud Platforms (`catalog/cloud/`)
**Infrastructure platform configurations** like Cloudflare Workers, including:

- AI Gateway configuration (routing, caching, analytics)
- Platform capabilities (bindings, storage, compute)
- Platform-specific features

#### Layer 3: Base Interfaces (`src/platforms/base/`)
**TypeScript interfaces and types** that all platform adapters must implement. Source code that compiles to `dist/platforms/base/`:

- **platform.ts** - BasePlatform abstract class
- **types.ts** - PlatformModel, PlatformProvider, ValidationResult types
- **index.ts** - Public exports

### AI Provider Configuration

Each AI provider file contains:

```json
{
  "provider": "openai",
  "name": "OpenAI",
  "defaultRouting": "cloudflare-gateway",
  "endpoints": {
    "direct": {
      "baseUrl": "https://api.openai.com/v1"
    },
    "cloudflare-gateway": {
      "baseUrl": "https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/openai",
      "features": ["caching", "rate-limiting", "analytics"]
    }
  },
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "status": "active",
      "capabilities": ["chat", "vision", "function-calling"],
      "contextWindow": 128000,
      "recommended": true
    }
  ]
}
```

### Routing Modes

Conductor supports **three routing modes** for accessing AI models:

#### 1. `cloudflare` - Platform-Native (Workers AI only)
Direct access to Cloudflare's edge-hosted models via Workers AI binding.

```yaml
# agents/user/analyze/agent.yaml
operation: think
config:
  provider: workers-ai
  model: "@cf/meta/llama-3.1-8b-instruct"
  routing: cloudflare  # Platform-native
```

**Benefits**: Ultra-low latency, no API keys needed, edge execution

#### 2. `cloudflare-gateway` - AI Gateway (Recommended for external providers)
Route external provider requests through Cloudflare AI Gateway for caching, analytics, and cost controls.

```yaml
# agents/user/analyze/agent.yaml
operation: think
config:
  provider: openai
  model: gpt-4o
  routing: cloudflare-gateway  # Default for external providers
```

**Benefits**:
- Persistent caching (reduce costs & latency)
- Real-time analytics and logging
- Rate limiting and cost controls
- Single API for multiple providers
- Automatic failover and retries

#### 3. `direct` - Direct API Calls
Make direct API calls to the provider, bypassing the gateway.

```yaml
# agents/user/analyze/agent.yaml
operation: think
config:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  routing: direct  # Bypass gateway
```

**Use when**: You need provider-specific features not available through the gateway, or you're not on Cloudflare.

### Smart Routing Defaults

Conductor uses intelligent defaults based on provider and platform:

| Provider | Default Routing | Reason |
|----------|----------------|---------|
| workers-ai | `cloudflare` | Platform-native, edge-hosted |
| openai | `cloudflare-gateway` | Leverage caching & analytics |
| anthropic | `cloudflare-gateway` | Leverage caching & analytics |
| groq | `cloudflare-gateway` | Leverage analytics |

**You can override these defaults** by specifying `routing:` in your agent config.

### Cloudflare AI Gateway

The AI Gateway acts as a **universal API gateway** for AI providers:

```
Your Worker → AI Gateway → AI Provider (OpenAI/Anthropic/Groq/etc.)
                    ↓
            [Cache/Analytics/Logs]
```

**Features**:
- ✅ Persistent caching (same request = cached response)
- ✅ Real-time analytics (tokens, costs, latency)
- ✅ Rate limiting per user/endpoint
- ✅ Cost controls and spending alerts
- ✅ Automatic retry on failures
- ✅ Fallback between providers
- ✅ Request/response logging

**Configuration**: Set environment variables for gateway access:

```toml
# wrangler.toml
[vars]
CLOUDFLARE_ACCOUNT_ID = "your-account-id"
CLOUDFLARE_GATEWAY_NAME = "your-gateway-name"
```

### Model Deprecation Tracking

Conductor tracks model lifecycle and warns you about deprecated models:

```bash
$ conductor check-config

⚠ agents/user/analyze/agent.yaml
  Model "gpt-4-turbo-preview" is deprecated
  Reason: Replaced by stable gpt-4-turbo release
  End of life: 2025-04-09 (120 days)
  → Recommended: "gpt-4-turbo"
```

Each model in the catalog includes:
- `status`: "active" | "deprecated"
- `deprecatedAt`: When deprecation was announced
- `deprecatedReason`: Why it was deprecated
- `replacementModel`: Recommended replacement
- `endOfLife`: When the model will stop working

**Stay up to date**: Run `conductor upgrade` to get the latest model catalogs.

### Using Multiple Providers

You can mix and match providers in a single ensemble:

```yaml
name: multi-provider-analysis
flow:
  # Fast, cheap analysis with Workers AI
  - name: quick-scan
    agent: quick-scan
    input:
      provider: workers-ai
      model: "@cf/meta/llama-3.1-8b-instruct"

  # Deep analysis with Claude
  - name: deep-analysis
    agent: deep-analysis
    input:
      provider: anthropic
      model: claude-3-5-sonnet-20241022
      routing: cloudflare-gateway

  # Reasoning with OpenAI o1
  - name: strategic-thinking
    agent: strategic-thinking
    input:
      provider: openai
      model: o1-preview
      routing: cloudflare-gateway
```

### Platform-Specific Features

While AI providers are universal, platforms can provide additional features:

**Cloudflare Workers**:
- Workers AI binding for edge models
- AI Gateway for external providers
- KV/D1/R2 for Data agents
- Durable Objects for state
- Automatic global distribution

**Future platforms** (Vercel, AWS Lambda, etc.) will have their own cloud platform configurations while sharing the same AI provider catalogs.

### Best Practices

1. **Use cloudflare-gateway by default** for external providers (OpenAI, Anthropic, Groq)
   - Get caching, analytics, and cost controls for free
   - No code changes needed

2. **Use workers-ai for speed** when sub-50ms latency matters
   - Edge-hosted models run closest to users
   - No API key management needed

3. **Check for deprecations regularly**
   ```bash
   conductor check-config
   conductor upgrade
   ```

4. **Pin model versions in production**
   ```yaml
   model: claude-3-5-sonnet-20241022  # Good: Specific version
   # vs
   model: claude-3-5-sonnet            # Risky: Auto-updates
   ```

5. **Monitor costs with AI Gateway**
   - View analytics in Cloudflare dashboard
   - Set spending limits and alerts
   - Track per-user or per-endpoint usage

## Edgit Integration

Conductor works seamlessly with Edgit for versioning prompts, configs, and member configurations. This enables powerful versioning chains where ensembles reference versioned members, which in turn reference versioned prompts.

**Key Principle: Edgit creates and manages git tags. That's it.** GitHub Actions handles deployment. Edgit is a tag manager, not a deployment tool.

### Quick Example

```bash
# Version a prompt
edgit tag create company-analysis-prompt v1.0.0

# Deploy to staging
edgit tag set company-analysis-prompt staging v1.0.0
edgit push --tags --force

# Promote to production
edgit tag set company-analysis-prompt production v1.0.0
edgit push --tags --force
```

### What Gets Versioned with Edgit?

**Edgit Components** (versioned artifacts in shared folders):
- ✅ **Prompts** (`prompts/*.md`) - Shared prompt templates, reusable across agents/ensembles
- ✅ **Queries** (`queries/*.sql`) - Shared SQL queries, reusable and optimized
- ✅ **Configs** (`configs/*.yaml`) - Shared configuration files, model settings
- ✅ **Agent configurations** (`agents/*/agent.yaml`) - Agent config files

**NOT Edgit Components** (code in your repo):
- ❌ **Agent implementations** (`agents/*/index.ts`) - Code is git-versioned and bundled with worker
- ❌ **Ensembles** (`ensembles/*.yaml`) - Workflow definitions live in git
- ❌ **Worker code** (`src/*`) - Application code lives in git

**Key Insight:** Prompts, queries, and configs live in **their own folders** at the project root, not inside individual agents. This enables **reuse** - multiple agents can reference the same prompt at different versions.

**Example: Shared Prompt Reuse**

```
my-project/
├── prompts/
│   └── company-analysis.md        # Shared prompt, versioned v1.0.0, v2.0.0, v2.1.0
├── agents/
│   ├── analyze-tech-company/
│   │   └── agent.yaml             # Uses: company-analysis-prompt@v2.1.0
│   ├── analyze-startup/
│   │   └── agent.yaml             # Uses: company-analysis-prompt@v2.0.0
│   └── quick-company-check/
│       └── agent.yaml             # Uses: company-analysis-prompt@v1.0.0
```

All three agents share the same prompt source file, but reference different versions based on what works best for their use case.

### The Versioning Chain

Conductor supports a complete versioning chain from ensemble → agent config → prompts:

```
Ensemble (git-versioned)
  ↓ references
Agent Config@v1.0.0 (Edgit component)
  ↓ references
Prompt@v2.1.0 (Edgit component)
```

**Example:**

```yaml
# ensembles/company-intel.yaml (git)
flow:
  - name: analyze-company-step
    agent: analyze-company@production
    input:
      domain: ${input.domain}
```

```yaml
# agents/user/analyze-company/agent.yaml (Edgit component)
name: analyze-company
operation: think
config:
  model: gpt-4
  temperature: 0.7
  prompt: company-analysis-prompt@v2.1.0  # References versioned prompt
```

```markdown
# prompts/company-analysis.md (Edgit component)
You are an expert at analyzing companies...
```

**Runtime Resolution:**

1. Executor reads ensemble: `analyze-company@production`
2. Loads agent.yaml from Edgit: `analyze-company@production` → v1.0.0
3. Agent.yaml references: `company-analysis-prompt@v2.1.0`
4. Loads prompt from Edgit: `company-analysis-prompt@v2.1.0`
5. Executes bundled code (index.ts) with resolved config + prompt

### Three Integration Patterns

#### Pattern 1: Inline (Simple)

Config lives directly in agent.yaml - no versioning needed.

```yaml
# agents/user/simple-analysis/agent.yaml
name: simple-analysis
operation: think
config:
  model: gpt-4
  temperature: 0.7
```

**Use when**: Configuration is simple and doesn't change often.

#### Pattern 2: Edgit Reference (Planned)

> **Note**: Edgit runtime integration is planned for a future release. The API below shows the intended interface.

Agent loads versioned prompt from Edgit:

```typescript
// agents/user/company-analysis/index.ts
import { createThinkAgent } from '@ensemble-edge/conductor/sdk';
// import { loadComponent } from '@ensemble-edge/edgit'; // Future

export default createThinkAgent({
  async handler({ input, env }) {
    // Future: Load versioned prompt from Edgit
    // const prompt = await loadComponent('company-analysis-prompt@v1.2.0', env);

    // For now: Load from local file or inline
    const prompt = "You are an expert at analyzing companies...";

    // Use with AI
    const response = await callAI(prompt, input);
    return response;
  }
});
```

**Use when**: Prompts need versioning, testing, and independent deployment.

#### Pattern 3: Co-located Development (Current Approach)

During development, keep prompts with agents or in shared prompts directory.

```bash
# 1. Create agent with prompt file
ensemble conductor add agent analyze-company --operation think --with-prompt

# 2. Develop and test locally
# Edit agents/user/analyze-company/prompt.md
# Edit agents/user/analyze-company/index.ts

# 3. Load prompt in your agent implementation
# Read prompt.md from filesystem or include inline in agent config

# 4. Future: When Edgit integration is complete
# Version prompt: edgit tag create analyze-company-prompt v1.0.0
# Load at runtime: loadComponent('analyze-company-prompt@v1.0.0', env)
```

**Use when**: Starting new think agents - currently the recommended approach until Edgit runtime integration is complete.

### Example: Think Agent with Edgit (Planned)

> **Note**: Full Edgit runtime integration coming soon. Currently use inline prompts or load from local files.

```typescript
import { createThinkAgent } from '@ensemble-edge/conductor/sdk';
// import { loadComponent } from '@ensemble-edge/edgit'; // Future

export default createThinkAgent({
  async handler({ input, state, env }) {
    // Future: Load versioned prompt from Edgit
    // const systemPrompt = await loadComponent('analysis-system-prompt@v2.1.0', env);

    // Current: Inline prompt or load from agent config
    const systemPrompt = "You are an expert analyst...";

    // Combine with dynamic context
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze: ${input.data}` }
    ];

    // Use with AI provider
    const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages,
      temperature: 0.7
    });

    return {
      content: response.result
    };
  }
});
```

### Versioning Scenarios

#### Scenario 1: Deploy New Config Without Code Changes

```bash
# Update agent config with new model settings
edgit tag create analyze-company v2.0.0

# agent.yaml v2.0.0
config:
  model: gpt-4-turbo      # ← Changed
  temperature: 0.5        # ← Changed
  prompt: company-analysis-prompt@v2.1.0

# Deploy to preview
edgit tag set analyze-company preview v2.0.0
edgit push --tags --force

# Test, then promote to production
edgit tag set analyze-company production v2.0.0
edgit push --tags --force
```

**No code deploy needed!** Same bundled code, different config.

#### Scenario 2: A/B Test Different Configurations

```yaml
# ensembles/company-intel.yaml
flow:
  # 90% use stable config
  - name: analyze-stable
    agent: analyze-company@v1.0.0
    weight: 90
    input:
      domain: ${input.domain}

  # 10% test new config
  - name: analyze-new
    agent: analyze-company@v2.0.0
    weight: 10
    input:
      domain: ${input.domain}
```

**Test in production** with gradual rollout.

#### Scenario 3: Environment-Specific Configs

```bash
# Production: Stable model, proven prompt
edgit tag set analyze-company production v1.0.0
edgit push --tags --force
# v1.0.0 → model: gpt-4, prompt@v1.0.0

# Staging: Latest model, new prompt
edgit tag set analyze-company staging v2.0.0
edgit push --tags --force
# v2.0.0 → model: gpt-4-turbo, prompt@v2.0.0

# Preview: Experimental settings
edgit tag set analyze-company preview v3.0.0-beta
edgit push --tags --force
# v3.0.0-beta → model: claude-3-opus, prompt@v3.0.0-beta
```

**Same ensemble, different configs per environment:**

```yaml
flow:
  - name: analyze-prod
    agent: analyze-company@production  # Uses v1.0.0
  - name: analyze-staging
    agent: analyze-company@staging     # Uses v2.0.0
  - name: analyze-preview
    agent: analyze-company@preview     # Uses v3.0.0-beta
```

#### Scenario 4: Independent Rollbacks

```bash
# Rollback just the prompt (keep agent config)
edgit tag create company-analysis-prompt v2.0.1
edgit tag set company-analysis-prompt production v2.0.1
edgit push --tags --force
# agent.yaml stays at v1.0.0, uses new prompt

# Rollback entire agent config
edgit tag set analyze-company production v0.9.0
edgit push --tags --force
# Rolls back model, temperature, AND prompt reference

# Emergency: rollback prompt instantly
edgit tag set company-analysis-prompt production v1.0.0
edgit push --tags --force
```

### Versioning Workflow

**Development to Production:**

```bash
# 1. Create agent locally
ensemble conductor add agent analyze-company --operation think --with-prompt

# 2. Develop and test with local files
# Edit agents/user/analyze-company/agent.yaml
# Edit agents/user/analyze-company/prompt.md

# 3. Version the prompt
edgit tag create company-analysis-prompt v1.0.0

# 4. Update agent.yaml to reference versioned prompt
# config:
#   prompt: company-analysis-prompt@v1.0.0

# 5. Version the agent config
edgit tag create analyze-company v1.0.0

# 6. Deploy to staging
edgit tag set analyze-company staging v1.0.0
edgit push --tags --force

edgit tag set company-analysis-prompt staging v1.0.0
edgit push --tags --force

# 7. Update ensemble to use versioned agent
# flow:
#   - name: analyze
#     agent: analyze-company@staging

# 8. Test, then promote to production
edgit tag set analyze-company production v1.0.0
edgit push --tags --force

edgit tag set company-analysis-prompt production v1.0.0
edgit push --tags --force
```

## Multi-Project Workflow

Build multiple projects on Conductor:

```bash
ensemble conductor init owner-oiq
ensemble conductor init owner-internal
ensemble conductor init customer-portal
```

Each project is independent with its own agents and ensembles. Conductor is just the engine.

## Development

```bash
# Install dependencies
npm install

# Build runtime + SDK
npm run build

# Test
npm test

# Generate Cloudflare types
npm run cf-typegen
```

## Philosophy

- **Conductor** = The runtime engine (this package)
- **Agents** = Your code (your repository)
- **Ensembles** = Your workflows (your YAML)
- **CLI** = Your development workflow
- **SDK** = Your development utilities

We provide the tools, you provide the creativity.

## Examples

See [examples/](./examples/) for:
- Complete starter project
- Agent implementations (all types)
- Ensemble workflows
- Testing examples

## Links

- [Full Documentation](https://docs.ensemble.ai/conductor/overview)
- [Getting Started](https://docs.ensemble.ai/conductor/getting-started/your-first-project)
- [Operations Reference](https://docs.ensemble.ai/conductor/operations/overview)
- [Starter Kit](https://docs.ensemble.ai/conductor/starter-kit/overview)
- [Examples](./examples/)
- [Issues](https://github.com/ensemble-edge/conductor/issues)
- [Edgit Integration](https://github.com/ensemble-edge/edgit)

## License

Apache 2.0 - see [LICENSE](LICENSE)

## Key Architectural Decisions

### Versioning Strategy

**Code (Git):**
- Agent implementations (index.ts)
- Ensemble workflows (YAML)
- Worker entry points

**Configuration (Edgit):**
- Agent configs (agent.yaml) - Version independently
- Prompts (prompt.md) - Version independently
- SQL queries, templates - Version independently

**Benefits:**
- 🔄 Deploy config changes without code deploy
- 🧪 A/B test different configurations
- 🌍 Environment-specific settings
- ⚡ Instant rollbacks (configs OR code)
- 📊 Mix optimal versions from any timeline

### The Power of Separation

**Traditional:**
```
v2.0.0 deployment
├── All code at v2.0.0
└── All configs at v2.0.0  ❌ Locked together
```

**With Conductor + Edgit:**
```
Your deployment
├── Code (bundled with worker)
├── Agent config@v1.0.0 ✅ Independent
├── Agent config@v2.0.0 ✅ Independent
├── Prompt@v0.1.0 ✅ Ancient but perfect
└── Prompt@v3.0.0 ✅ Latest
```

**Access any version, any time, in any combination.**

## Trademark

Ensemble® is a registered trademark of Higinio O. Maycotte.
