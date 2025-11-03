# Conductor: Major Improvements Roadmap

**Status**: 🟡 Planning & Prioritization
**Created**: 2025-11-03
**Priority**: High
**Scope**: Production-ready features and cloud platform foundation

---

## Executive Summary

This document outlines critical improvements to transform Conductor from a solid edge-native orchestration framework into a complete production platform with cloud tooling and advanced capabilities.

**Philosophy**:
- 🌍 **Cloudflare-First**: Leverage Cloudflare's unique capabilities (AutoRAG, Vectorize, AI, etc.)
- 🎯 **Production-Ready**: Built for real workloads from day one
- 🔧 **Developer Experience**: Make debugging and development effortless
- ☁️ **Cloud + Local**: Seamless integration between local dev and cloud platform

**Current State**: Strong foundation with excellent patterns (Result types, Repository pattern, immutable StateManager)
**Target State**: Complete platform with cloud tooling, advanced workflows, and production observability

---

## Part 1: Cloud Platform Features ☁️

These features will be part of the **Conductor Cloud** platform - a managed service for deploying, monitoring, and managing Conductor projects.

### 1.1. ☁️ Cloud Visualization Dashboard

**Priority**: High
**Effort**: 8-10 weeks
**Phase**: Cloud Platform MVP

#### Vision

A web-based platform where users can:
- Connect their Conductor project (local or deployed)
- Visualize ensemble execution in real-time
- Debug workflows with interactive graph views
- Test ensembles without deploying
- Manage multiple projects/environments

#### Core Features

**Project Management**:
- Connect local projects via CLI (`conductor connect`)
- Register deployed projects via API key
- Multi-environment support (dev, staging, prod)
- Team collaboration and access control

**Workflow Visualization**:
- Interactive graph view of ensemble flows
- Real-time execution visualization
- Step-by-step execution replay
- Branch and parallel execution visualization
- Dependency graph analysis

**Execution Monitoring**:
- Live execution dashboard
- Execution history and logs
- Performance metrics per step
- Error tracking and debugging
- State inspection at any point

**Testing Interface**:
- Execute ensembles from cloud UI
- Test with different inputs
- Save test scenarios
- Compare execution results
- Share test cases with team

#### Implementation Approach

```typescript
// Cloud API - Project Registration
POST /api/v1/projects/register
{
  "name": "my-conductor-project",
  "apiKey": "generated-key",
  "webhookUrl": "https://my-project.workers.dev"
}

// Local CLI - Connect to Cloud
$ conductor cloud connect
> Enter your Conductor Cloud API key: ***
> Connected! Visit https://cloud.conductor.dev/projects/abc123

// Cloud receives telemetry from project
POST https://cloud.conductor.dev/telemetry/ingest
{
  "projectId": "abc123",
  "executionId": "exec_xyz",
  "event": "step.completed",
  "data": { ... }
}
```

**UI Components**:
- Next.js web application
- React Flow for graph visualization
- Real-time updates via WebSockets
- Tailwind CSS for styling
- Vercel deployment

**Backend**:
- Cloudflare Workers for API
- D1 for project/execution data
- Durable Objects for real-time state
- Analytics Engine for metrics
- R2 for execution artifacts

#### Benefits

- **No local tools needed** - everything in the browser
- **Team collaboration** - share views, debugging sessions
- **Production insights** - see what's happening in prod
- **Easy onboarding** - visual understanding of workflows
- **Debugging paradise** - inspect any execution, any step

---

### 1.2. ☁️ API Documentation & Playground

**Priority**: High
**Effort**: 4-6 weeks
**Phase**: Cloud Platform MVP

#### Vision

**Automatic, evolving API documentation for each user's project** - not about Conductor, about THEIR application.

As their project evolves, so do their docs. They can:
- Share internal API docs with their team
- Publish customer-facing API docs
- Host docs on Conductor Cloud (like Mintlify)
- Embed interactive API playground

#### Core Features

**Auto-Generated Documentation**:
- Scan project and generate OpenAPI spec
- Document all ensemble endpoints
- Document member inputs/outputs
- Show example requests/responses
- Version history of API changes

**Smart Documentation**:
- Learns from actual usage patterns
- Suggests improvements to API design
- Detects breaking changes
- Generates code samples in multiple languages
- Creates SDK documentation

**Hosted Documentation**:
- Beautiful docs site (like Mintlify/ReadMe)
- Custom domain support
- Search functionality
- API versioning
- Authentication docs

**Interactive Playground**:
- Test API calls directly from docs
- Try different inputs
- See actual responses from their project
- Save and share API calls
- Generate curl commands, code samples

#### Implementation

```typescript
// Auto-scan project for OpenAPI generation
$ conductor docs generate

Scanning project...
✓ Found 12 ensembles
✓ Found 25 members
✓ Analyzed schemas
✓ Generated OpenAPI spec

📚 Documentation generated!
   View locally: http://localhost:3000/docs
   Publish to cloud: conductor docs publish

// Cloud-hosted docs
https://docs.my-project.conductor.dev/

// Embedded in their own site
<script src="https://cloud.conductor.dev/embed/docs/abc123.js"></script>
```

**OpenAPI Generator**:
```typescript
// src/cli/openapi-generator.ts

export class ProjectDocumentationGenerator {
  constructor(private readonly projectPath: string) {}

  async generate(): Promise<OpenAPISpec> {
    // Scan all ensembles
    const ensembles = await this.scanEnsembles();

    // Scan all members
    const members = await this.scanMembers();

    // Generate OpenAPI spec
    return {
      openapi: '3.0.0',
      info: {
        title: this.getProjectName(),
        version: this.getProjectVersion(),
        description: this.getProjectDescription()
      },
      paths: this.generatePaths(ensembles),
      components: {
        schemas: this.generateSchemas(members, ensembles)
      }
    };
  }

  private generatePaths(ensembles: Ensemble[]): Record<string, PathItem> {
    const paths: Record<string, PathItem> = {};

    for (const ensemble of ensembles) {
      // Generate endpoint for each ensemble
      paths[`/execute/${ensemble.name}`] = {
        post: {
          summary: ensemble.description || `Execute ${ensemble.name} workflow`,
          tags: [this.inferTag(ensemble)],
          requestBody: {
            content: {
              'application/json': {
                schema: this.generateInputSchema(ensemble)
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful execution',
              content: {
                'application/json': {
                  schema: this.generateOutputSchema(ensemble)
                }
              }
            }
          }
        }
      };
    }

    return paths;
  }

  private inferTag(ensemble: Ensemble): string {
    // Smart categorization based on ensemble name/description
    // e.g., "user-onboarding" -> "User Management"
    // e.g., "payment-processing" -> "Payments"
  }

  private generateInputSchema(ensemble: Ensemble): Schema {
    // Analyze flow steps to determine required input
    // Look at member schemas
    // Infer types from actual usage
  }

  private generateOutputSchema(ensemble: Ensemble): Schema {
    // Analyze final step outputs
    // Look at ensemble output mapping
    // Show possible response shapes
  }
}
```

**Cloud Docs Platform**:
- Custom subdomain: `docs.{project}.conductor.dev`
- Beautiful UI (inspired by Stripe, Mintlify)
- Search powered by Cloudflare AI
- Code samples in 7+ languages
- Version selector
- Dark/light themes
- Custom branding

**Monetization** (Future):
- Free: Self-hosted docs
- Pro: Hosted docs on Conductor Cloud
- Enterprise: Custom domains, analytics, SSO

#### Benefits

- **Zero-effort documentation** - auto-generated and maintained
- **Customer-facing quality** - professional docs out of the box
- **Always up-to-date** - regenerates on code changes
- **Revenue opportunity** - hosted docs as a service
- **Competitive moat** - no other framework does this automatically

---

### 1.3. ☁️ Team Collaboration & Observability

**Priority**: Medium
**Effort**: 6-8 weeks
**Phase**: Cloud Platform Phase 2

#### Features

**Team Features**:
- Multi-user access
- Role-based permissions
- Shared debugging sessions
- Comments on executions
- Incident management

**Advanced Observability**:
- Custom dashboards
- Alerting and notifications
- SLA monitoring
- Cost tracking per ensemble
- Performance recommendations

**Deployment Management**:
- Deploy from cloud UI
- Rollback capability
- Canary deployments
- Environment promotion (dev → staging → prod)

---

## Part 2: Local Development Tools 🔧

Essential tools developers need running locally for development and debugging.

### 2.1. 🔧 Telemetry & Tracing

**Priority**: Critical
**Effort**: 3-4 weeks
**Phase**: Immediate

#### Vision

**Cloudflare-first telemetry** with OpenTelemetry support for other providers.

By default, leverage Cloudflare's capabilities:
- Analytics Engine for metrics
- Logs (Workers Analytics)
- Traces (Workers Traces)
- Real User Monitoring (RUM)

But support OpenTelemetry for teams using:
- Datadog
- New Relic
- Honeycomb
- Langfuse
- Custom observability platforms

#### Implementation

```typescript
// src/observability/telemetry.ts

export interface TelemetryConfig {
  provider: 'cloudflare' | 'opentelemetry' | 'custom';
  cloudflare?: CloudflareTelemetryConfig;
  opentelemetry?: OpenTelemetryConfig;
}

export interface CloudflareTelemetryConfig {
  analyticsEngine?: boolean;
  workerTraces?: boolean;
  realUserMonitoring?: boolean;
  // Leverage Cloudflare's native capabilities
}

export interface OpenTelemetryConfig {
  exporterUrl: string;
  serviceName: string;
  samplingRate?: number;
  headers?: Record<string, string>;
}

export class ConductorTelemetry {
  private provider: TelemetryProvider;

  constructor(config: TelemetryConfig) {
    switch (config.provider) {
      case 'cloudflare':
        this.provider = new CloudflareTelemetryProvider(config.cloudflare);
        break;
      case 'opentelemetry':
        this.provider = new OpenTelemetryProvider(config.opentelemetry);
        break;
      case 'custom':
        this.provider = config.custom;
        break;
    }
  }

  async traceEnsembleExecution<T>(
    ensembleName: string,
    input: any,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.provider.trace(
      `ensemble.execute.${ensembleName}`,
      {
        ensemble: ensembleName,
        inputKeys: Object.keys(input)
      },
      fn
    );
  }

  async traceLLMCall(
    model: string,
    prompt: string,
    fn: () => Promise<LLMResponse>
  ): Promise<LLMResponse> {
    return this.provider.trace(
      `llm.call`,
      { model, promptLength: prompt.length },
      async () => {
        const response = await fn();

        // Track token usage
        this.provider.recordMetric('llm.tokens', {
          prompt: response.usage?.promptTokens || 0,
          completion: response.usage?.completionTokens || 0,
          total: response.usage?.totalTokens || 0,
          model,
          cost: this.estimateCost(response.usage, model)
        });

        return response;
      }
    );
  }

  private estimateCost(usage: TokenUsage | undefined, model: string): number {
    if (!usage) return 0;

    // Cost estimation based on model pricing
    const pricing = MODEL_PRICING[model] || { input: 0, output: 0 };
    return (
      (usage.promptTokens * pricing.input) +
      (usage.completionTokens * pricing.output)
    ) / 1_000_000;
  }
}

// Cloudflare-native implementation
class CloudflareTelemetryProvider implements TelemetryProvider {
  async trace<T>(
    name: string,
    attributes: Record<string, any>,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();

      // Send to Analytics Engine
      this.env.ANALYTICS.writeDataPoint({
        blobs: [name],
        doubles: [Date.now() - start],
        indexes: [name]
      });

      return result;
    } catch (error) {
      // Log error
      console.error({
        trace: name,
        error: error.message,
        ...attributes
      });
      throw error;
    }
  }

  recordMetric(name: string, data: Record<string, any>): void {
    // Use Analytics Engine
    this.env.ANALYTICS.writeDataPoint({
      blobs: [name],
      doubles: Object.values(data).filter(v => typeof v === 'number'),
      indexes: [name]
    });
  }
}

// OpenTelemetry implementation for other platforms
class OpenTelemetryProvider implements TelemetryProvider {
  private tracer: Tracer;

  constructor(config: OpenTelemetryConfig) {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        'service.name': config.serviceName
      })
    });

    const exporter = new OTLPTraceExporter({
      url: config.exporterUrl,
      headers: config.headers
    });

    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    provider.register();

    this.tracer = trace.getTracer('conductor', '1.0.0');
  }

  async trace<T>(
    name: string,
    attributes: Record<string, any>,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

**Configuration**:
```typescript
// conductor.config.ts

export default {
  telemetry: {
    // Default: Use Cloudflare's native capabilities
    provider: 'cloudflare',
    cloudflare: {
      analyticsEngine: true,
      workerTraces: true
    }

    // Or: Use OpenTelemetry for Datadog/Honeycomb/etc
    // provider: 'opentelemetry',
    // opentelemetry: {
    //   exporterUrl: 'https://api.honeycomb.io',
    //   serviceName: 'my-conductor-app',
    //   headers: {
    //     'x-honeycomb-team': process.env.HONEYCOMB_API_KEY
    //   }
    // }
  }
};
```

**Token Usage Tracking**:
```typescript
// Include in member responses
interface ThinkMemberResponse extends MemberResponse {
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost?: number; // USD
  };
}

// Execution summary includes total cost
interface ExecutionResult {
  success: boolean;
  output: any;
  metadata: {
    executionTime: number;
    stepsExecuted: number;
    totalTokens?: number;
    estimatedCost?: number; // Total cost of all LLM calls
  };
}
```

#### Benefits

- **Cloudflare-native by default** - leverage platform capabilities
- **Flexibility** - support for external tools when needed
- **Production-ready** - proper observability from day one
- **Cost tracking** - know exactly what executions cost
- **Performance insights** - identify bottlenecks

---

### 2.2. 🔧 CLI Debugging Tools

**Priority**: High
**Effort**: 2-3 weeks
**Phase**: Immediate

#### Features

**Execution Replay**:
```bash
$ conductor replay exec_abc123
Replaying execution exec_abc123...
✓ Step 1: analyze (150ms)
✓ Step 2: validate (45ms)
✗ Step 3: process (FAILED)
  Error: Invalid input format
```

**Local Testing**:
```bash
$ conductor test my-ensemble.yaml --input test-data.json
Testing my-ensemble with test data...
✓ Execution completed in 234ms
Output:
{
  "result": "success",
  "data": { ... }
}
```

**Execution Logs**:
```bash
$ conductor logs exec_abc123
[2025-11-03 14:23:01] Ensemble execution started
[2025-11-03 14:23:01] Step: analyze-request
[2025-11-03 14:23:02] LLM call: claude-3-5-haiku (234 tokens)
[2025-11-03 14:23:02] Step completed: analyze-request
```

**State Inspection**:
```bash
$ conductor state exec_abc123 --step 2
State at step 2:
{
  "userContext": { ... },
  "analysisResult": { ... },
  "validationStatus": "passed"
}
```

---

### 2.3. 🔧 Testing SDK for Developer Projects

**Priority**: Critical
**Effort**: 2-3 weeks
**Phase**: Immediate

#### Vision

The testing-coverage.md plan focuses on testing **Conductor's framework code**. But developers need testing infrastructure to test **their own projects** built with Conductor.

Provide a comprehensive testing SDK that makes it easy for developers to:
- Test their ensembles and members
- Mock AI providers and external dependencies
- Run integration tests locally
- Integrate with CI/CD pipelines
- Generate coverage reports for their code

**Think of it like**: How Next.js provides testing utilities for apps built with Next.js, not just for testing Next.js itself.

#### Core Features

**1. Testing SDK (`@conductor/testing`)**

Ship testing utilities as part of Conductor:

```typescript
// Developer's test file: tests/ensembles/approval-workflow.test.ts

import { describe, it, expect } from 'vitest';
import { TestConductor, mockAIProvider } from '@conductor/testing';

describe('Approval Workflow', () => {
  let conductor: TestConductor;

  beforeEach(async () => {
    // Create isolated test environment
    conductor = await TestConductor.create({
      projectPath: './my-project',
      mocks: {
        ai: mockAIProvider({
          'analyze-request': { needsApproval: true, amount: 5000 },
          'auto-approval': { approved: true }
        }),
        database: mockDatabase({
          users: [{ id: '123', role: 'manager' }]
        })
      }
    });
  });

  afterEach(async () => {
    await conductor.cleanup();
  });

  it('should request approval for high-value transactions', async () => {
    const result = await conductor.executeEnsemble('approval-workflow', {
      amount: 5000,
      requesterId: '123'
    });

    // Custom assertions
    expect(result).toBeSuccessful();
    expect(result).toHaveExecutedMember('request-approval');
    expect(result).not.toHaveExecutedMember('auto-approve');
    expect(result.output.status).toBe('pending_approval');
  });

  it('should auto-approve low-value transactions', async () => {
    // Override mock for this test
    conductor.mockAI('analyze-request', {
      needsApproval: false,
      amount: 50
    });

    const result = await conductor.executeEnsemble('approval-workflow', {
      amount: 50,
      requesterId: '123'
    });

    expect(result).toBeSuccessful();
    expect(result).toHaveExecutedMember('auto-approve');
    expect(result).not.toHaveExecutedMember('request-approval');
  });

  it('should handle AI provider failures gracefully', async () => {
    conductor.mockAI('analyze-request', new Error('AI service unavailable'));

    const result = await conductor.executeEnsemble('approval-workflow', {
      amount: 1000,
      requesterId: '123'
    });

    expect(result).toHaveFailed();
    expect(result.error.message).toContain('AI service unavailable');
  });
});
```

**2. TestConductor Helper**

```typescript
// @conductor/testing/src/test-conductor.ts

export class TestConductor {
  private env: Env;
  private mocks: Map<string, any>;
  private executionHistory: ExecutionRecord[];

  static async create(options: TestConductorOptions): Promise<TestConductor> {
    const conductor = new TestConductor();

    // Load project catalog
    await conductor.loadCatalog(options.projectPath);

    // Setup mocks
    conductor.setupMocks(options.mocks);

    // Initialize test environment
    conductor.env = await conductor.createTestEnv();

    return conductor;
  }

  // Execute ensemble in test mode
  async executeEnsemble(
    name: string,
    input: any
  ): Promise<TestExecutionResult> {
    const startTime = Date.now();

    try {
      const result = await this.executor.execute(name, input, this.env);

      const testResult: TestExecutionResult = {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: Date.now() - startTime,
        stepsExecuted: this.extractSteps(result),
        stateHistory: this.extractStateHistory(result),
        aiCalls: this.extractAICalls(result),
        databaseQueries: this.extractDatabaseQueries(result),
      };

      this.executionHistory.push(testResult);
      return testResult;
    } catch (error) {
      return {
        success: false,
        error,
        executionTime: Date.now() - startTime,
        stepsExecuted: [],
        stateHistory: [],
        aiCalls: [],
        databaseQueries: [],
      };
    }
  }

  // Execute member directly
  async executeMember(
    name: string,
    input: any
  ): Promise<TestMemberResult> {
    const member = this.catalog.members.get(name);
    if (!member) {
      throw new Error(`Member ${name} not found`);
    }

    const context = this.createMemberContext(input);
    return await member.run(context);
  }

  // Mock AI provider responses
  mockAI(memberName: string, response: any | Error): void {
    this.mocks.set(`ai:${memberName}`, response);
  }

  // Mock database responses
  mockDatabase(table: string, data: any[]): void {
    this.mocks.set(`db:${table}`, data);
  }

  // Mock external API responses
  mockAPI(url: string, response: any): void {
    this.mocks.set(`api:${url}`, response);
  }

  // Assertions helpers
  getExecutionHistory(): ExecutionRecord[] {
    return this.executionHistory;
  }

  getAICalls(): AICall[] {
    return this.executionHistory.flatMap(e => e.aiCalls);
  }

  getDatabaseQueries(): DatabaseQuery[] {
    return this.executionHistory.flatMap(e => e.databaseQueries);
  }

  // Snapshot testing
  async snapshot(): Promise<ProjectSnapshot> {
    return {
      catalog: this.catalog,
      state: this.state,
      mocks: Object.fromEntries(this.mocks),
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.clearMocks();
    await this.clearState();
    this.executionHistory = [];
  }
}
```

**3. Mock Utilities**

```typescript
// @conductor/testing/src/mocks.ts

// Mock AI provider
export function mockAIProvider(responses: Record<string, any>) {
  return new MockAIProvider(responses);
}

// Mock database
export function mockDatabase(tables: Record<string, any[]>) {
  return new MockDatabase(tables);
}

// Mock external APIs
export function mockHTTP(routes: Record<string, any>) {
  return new MockHTTPClient(routes);
}

// Mock Vectorize
export function mockVectorize(collections: Record<string, VectorDocument[]>) {
  return new MockVectorize(collections);
}

// Mock Durable Objects
export function mockDurableObject<T>(initialState?: T) {
  return new MockDurableObject<T>(initialState);
}
```

**4. Custom Vitest Matchers**

```typescript
// @conductor/testing/src/matchers.ts

declare global {
  namespace Vi {
    interface Matchers<R = TestExecutionResult> {
      // Execution matchers
      toBeSuccessful(): R;
      toHaveFailed(): R;
      toHaveExecutedMember(memberName: string): R;
      toHaveExecutedSteps(count: number): R;
      toHaveCompletedIn(ms: number): R;

      // State matchers
      toHaveState(key: string, value?: any): R;
      toHaveStateTransition(from: any, to: any): R;

      // AI call matchers
      toHaveCalledAI(memberName: string): R;
      toHaveUsedTokens(count: number): R;
      toHaveCostLessThan(dollars: number): R;

      // Output matchers
      toHaveOutput(expected: any): R;
      toMatchOutputSchema(schema: any): R;
    }
  }
}

// Implementation
export function toBeSuccessful(
  this: MatcherState,
  received: TestExecutionResult
) {
  const pass = received.success === true;
  return {
    pass,
    message: () =>
      pass
        ? 'Expected execution to have failed but it succeeded'
        : `Expected execution to succeed but it failed with: ${received.error?.message}`,
  };
}

export function toHaveExecutedMember(
  this: MatcherState,
  received: TestExecutionResult,
  memberName: string
) {
  const executedMembers = received.stepsExecuted.map(s => s.member);
  const pass = executedMembers.includes(memberName);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${memberName} not to be executed`
        : `Expected ${memberName} to be executed. Executed: ${executedMembers.join(', ')}`,
  };
}
```

**5. Test Project Template**

When developers run `conductor init`, include test setup:

```bash
$ conductor init my-project --with-tests

Creating project structure...
✓ Created ensembles/
✓ Created members/
✓ Created prompts/
✓ Created configs/
✓ Created tests/                    # Testing infrastructure
✓ Created vitest.config.ts          # Vitest configuration
✓ Created tests/helpers/            # Test helpers
✓ Created tests/ensembles/          # Ensemble tests
✓ Created tests/members/            # Member tests
✓ Created .github/workflows/test.yml # CI/CD workflow

Project structure:
my-project/
├── ensembles/
├── members/
├── prompts/
├── configs/
├── tests/
│   ├── helpers/
│   │   └── test-setup.ts          # Shared test utilities
│   ├── ensembles/
│   │   └── example.test.ts        # Example ensemble test
│   └── members/
│       └── example.test.ts        # Example member test
├── vitest.config.ts                # Pre-configured for Conductor
├── conductor.config.ts
└── package.json                    # Includes @conductor/testing
```

**6. Example Test Files**

```typescript
// tests/ensembles/example.test.ts (generated)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestConductor } from '@conductor/testing';

describe('Greeting Ensemble', () => {
  let conductor: TestConductor;

  beforeEach(async () => {
    conductor = await TestConductor.create({
      projectPath: '.',
    });

    // Mock AI responses
    conductor.mockAI('greeter', {
      message: 'Hello, Alice! Nice to meet you!'
    });
  });

  afterEach(async () => {
    await conductor.cleanup();
  });

  it('should greet user by name', async () => {
    const result = await conductor.executeEnsemble('greeting', {
      name: 'Alice'
    });

    expect(result).toBeSuccessful();
    expect(result.output.message).toContain('Alice');
  });

  it('should handle missing name gracefully', async () => {
    const result = await conductor.executeEnsemble('greeting', {
      name: ''
    });

    // Depends on your ensemble's error handling
    expect(result).toHaveFailed();
    expect(result.error.message).toContain('name is required');
  });
});
```

**7. CI/CD Integration**

```yaml
# .github/workflows/test.yml (generated)

name: Test Conductor Project

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Comment coverage on PR
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**8. Coverage Configuration**

```typescript
// vitest.config.ts (generated for developer projects)

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'members/**/*.ts',
        'ensembles/**/*.ts',
        'src/**/*.ts',
      ],
      exclude: [
        'tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        'node_modules/**',
      ],
      thresholds: {
        lines: 80,      // Encourage high coverage
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

#### CLI Commands

```bash
# Initialize project with testing
$ conductor init my-project --with-tests

# Run tests
$ conductor test
$ npm test

# Run tests in watch mode
$ conductor test --watch
$ npm test -- --watch

# Run specific test file
$ conductor test tests/ensembles/approval.test.ts

# Generate coverage report
$ conductor test --coverage
$ npm run test:coverage

# Run integration tests only
$ conductor test --integration

# Generate example tests from ensembles
$ conductor generate tests
Analyzing ensembles...
✓ Generated tests/ensembles/approval-workflow.test.ts
✓ Generated tests/ensembles/user-onboarding.test.ts
✓ Generated tests/ensembles/payment-processing.test.ts

Generated 3 test files with example test cases.
Run 'npm test' to execute them.
```

#### Documentation

Include in auto-generated project docs:

```markdown
# Testing Your Conductor Project

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm run test:coverage
```

## Writing Tests

### Testing Ensembles

```typescript
import { TestConductor } from '@conductor/testing';

const conductor = await TestConductor.create({
  projectPath: '.'
});

const result = await conductor.executeEnsemble('my-ensemble', input);

expect(result).toBeSuccessful();
expect(result.output).toMatchObject({ status: 'complete' });
```

### Mocking AI Responses

```typescript
conductor.mockAI('my-member', {
  response: 'Mocked AI response'
});
```

### Custom Assertions

```typescript
expect(result).toBeSuccessful();
expect(result).toHaveExecutedMember('validator');
expect(result).toHaveCompletedIn(1000); // ms
expect(result).toHaveUsedTokens(500);
```

## CI/CD Integration

Tests run automatically on:
- Every push
- Every pull request
- Before deployment

See `.github/workflows/test.yml` for configuration.
```

#### Benefits

**For Developers**:
- ✅ **Easy testing** - Simple API for testing their ensembles
- ✅ **Fast feedback** - Mock AI providers, no external calls
- ✅ **CI/CD ready** - Pre-configured GitHub Actions
- ✅ **Coverage tracking** - See what's tested, what's not
- ✅ **Confidence** - Refactor without fear
- ✅ **Documentation** - Tests show how ensembles work

**For Conductor**:
- ✅ **Quality ecosystem** - Projects are well-tested
- ✅ **Reduced support** - Developers catch bugs early
- ✅ **Better feedback** - Test failures reveal API issues
- ✅ **Competitive advantage** - Few frameworks provide testing SDKs

#### Implementation Plan

**Week 1: Core SDK**
- [ ] Create `@conductor/testing` package
- [ ] Implement TestConductor helper
- [ ] Implement mock utilities
- [ ] Custom Vitest matchers

**Week 2: CLI Integration**
- [ ] `conductor init --with-tests` flag
- [ ] `conductor test` command
- [ ] `conductor generate tests` command
- [ ] Test project templates

**Week 3: Documentation & Examples**
- [ ] Testing documentation
- [ ] Example test files
- [ ] CI/CD templates
- [ ] Video tutorials

#### Success Metrics

- ✅ 80% of new projects include tests
- ✅ Average test coverage in projects: 70%+
- ✅ <30 seconds to write first test
- ✅ 90% of users find testing "easy" or "very easy"
- ✅ Support tickets about "how to test" < 5% of total

---

## Part 3: Core Framework Improvements 🚀

### 3.1. 🚀 Graph-Based Workflow Engine

**Priority**: Critical
**Effort**: 6-8 weeks
**Phase**: Q1 2026

#### Vision

Support sophisticated workflows with:
- Parallel execution
- Complex branching
- Dynamic dependencies
- Visual representation

**Two approaches**:
1. Enhanced YAML with graph semantics
2. TypeScript workflow builder API

Both compile to same execution model.

#### Enhanced YAML with Graph Semantics

```yaml
name: approval-workflow
description: Complex approval workflow with parallel steps

flow:
  # Simple sequential step
  - step: analyze
    member: analyze-request
    input:
      request: ${input.request}

  # Branch based on condition
  - branch:
      condition: ${analyze.needsApproval}

      # True branch - needs approval
      true:
        - step: request-approval
          member: hitl-approval
          input:
            data: ${analyze.data}
            approvers: ${analyze.suggestedApprovers}

        # Parallel execution within branch
        - parallel:
            - step: notify-manager
              member: send-notification
              input:
                recipient: ${analyze.manager}
                message: "Approval requested"

            - step: log-audit
              member: audit-logger
              input:
                action: "approval_requested"
                data: ${analyze.data}

        # Continue after parallel steps complete
        - step: process-approval
          member: process-decision
          input:
            approval: ${request-approval.output}
            auditLog: ${log-audit.output}

      # False branch - auto-approve
      false:
        - step: auto-approve
          member: auto-approval
          input:
            reason: "Below threshold"

  # Merge point - continue regardless of branch taken
  - step: execute
    member: execute-action
    depends_on: [process-approval, auto-approve]
    input:
      approved: true
      data: ${analyze.data}

  # Final parallel notifications
  - parallel:
      - step: notify-requester
        member: send-notification
        input:
          recipient: ${input.requester}
          result: ${execute.output}

      - step: update-database
        member: database-update
        input:
          status: "completed"
          result: ${execute.output}

output:
  status: ${execute.output.status}
  result: ${execute.output.result}
  executionPath: ${_meta.branchTaken}
```

**YAML Schema Enhancements**:
```yaml
# New keywords
branch:          # Conditional branching
  condition:     # JavaScript expression
  true:          # Steps if condition true
  false:         # Steps if condition false

parallel:        # Parallel execution
  - step:        # All steps execute concurrently
  - step:

depends_on:      # Explicit dependencies
  - step-name    # Wait for these steps before executing

timeout:         # Step timeout
  seconds: 30

retry:           # Retry configuration
  attempts: 3
  backoff: exponential

foreach:         # Loop over items
  items: ${analyze.items}
  step:
    member: process-item
    input:
      item: ${item}
```

**Execution Model**:
```typescript
// src/runtime/graph-executor.ts

interface ExecutionGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, string[]>; // Dependencies
}

interface GraphNode {
  id: string;
  type: 'step' | 'parallel' | 'branch';
  member?: MemberName;
  dependencies: string[];
  condition?: string;
  children?: GraphNode[];
}

class GraphExecutor {
  async execute(graph: ExecutionGraph, input: any): Promise<ExecutionResult> {
    // Topological sort for execution order
    const sorted = this.topologicalSort(graph);

    // Track completed steps
    const completed = new Set<string>();
    const results = new Map<string, any>();

    for (const nodeId of sorted) {
      const node = graph.nodes.get(nodeId)!;

      // Wait for dependencies
      await this.waitForDependencies(node, completed);

      // Execute based on node type
      switch (node.type) {
        case 'step':
          results.set(nodeId, await this.executeStep(node, results));
          break;

        case 'parallel':
          results.set(nodeId, await this.executeParallel(node, results));
          break;

        case 'branch':
          results.set(nodeId, await this.executeBranch(node, results));
          break;
      }

      completed.add(nodeId);
    }

    return this.buildResult(results);
  }

  private async executeParallel(
    node: GraphNode,
    context: Map<string, any>
  ): Promise<any> {
    // Execute all children in parallel
    const promises = node.children!.map(child =>
      this.executeStep(child, context)
    );

    const results = await Promise.all(promises);

    // Combine results
    return node.children!.reduce((acc, child, i) => {
      acc[child.id] = results[i];
      return acc;
    }, {} as Record<string, any>);
  }

  private async executeBranch(
    node: GraphNode,
    context: Map<string, any>
  ): Promise<any> {
    // Evaluate condition
    const condition = this.evaluateCondition(node.condition!, context);

    // Execute appropriate branch
    const branch = condition ? node.trueChildren : node.falseChildren;

    for (const child of branch!) {
      await this.executeStep(child, context);
    }
  }

  private topologicalSort(graph: ExecutionGraph): string[] {
    // Kahn's algorithm for topological sort
    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degrees
    for (const [nodeId, deps] of graph.edges) {
      inDegree.set(nodeId, deps.length);
      if (deps.length === 0) {
        queue.push(nodeId);
      }
    }

    const sorted: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeId);

      // Decrease in-degree for dependents
      for (const [dependentId, deps] of graph.edges) {
        if (deps.includes(nodeId)) {
          const newDegree = inDegree.get(dependentId)! - 1;
          inDegree.set(dependentId, newDegree);

          if (newDegree === 0) {
            queue.push(dependentId);
          }
        }
      }
    }

    return sorted;
  }
}
```

#### TypeScript Workflow Builder API

```typescript
// src/runtime/workflow-builder.ts

export class WorkflowBuilder {
  private steps: WorkflowStep[] = [];
  private currentBranch?: BranchBuilder;

  constructor(private readonly name: string) {}

  step(memberName: MemberName, config?: StepConfig): this {
    this.steps.push({
      type: 'step',
      member: memberName,
      input: config?.input,
      timeout: config?.timeout,
      retry: config?.retry
    });
    return this;
  }

  branch(condition: string | ((ctx: Context) => boolean)): BranchBuilder {
    const branch = new BranchBuilder(this);
    this.currentBranch = branch;

    this.steps.push({
      type: 'branch',
      condition: typeof condition === 'string'
        ? condition
        : condition.toString(),
      branch
    });

    return branch;
  }

  parallel(...members: MemberName[]): this;
  parallel(config: ParallelConfig): this;
  parallel(arg: MemberName[] | ParallelConfig): this {
    if (Array.isArray(arg)) {
      this.steps.push({
        type: 'parallel',
        members: arg
      });
    } else {
      this.steps.push({
        type: 'parallel',
        steps: arg.steps
      });
    }
    return this;
  }

  forEach(
    items: string,
    fn: (builder: WorkflowBuilder, item: string) => void
  ): this {
    const loopBuilder = new WorkflowBuilder(`${this.name}-loop`);
    fn(loopBuilder, '${item}');

    this.steps.push({
      type: 'foreach',
      items,
      steps: loopBuilder.steps
    });

    return this;
  }

  build(): EnsembleConfig {
    return {
      name: this.name,
      flow: this.compileToFlow(this.steps)
    };
  }

  private compileToFlow(steps: WorkflowStep[]): FlowStep[] {
    // Convert WorkflowBuilder steps to EnsembleConfig flow
    return steps.map(step => this.compileStep(step));
  }
}

export class BranchBuilder {
  private trueBranch: WorkflowBuilder;
  private falseBranch: WorkflowBuilder;

  constructor(private readonly parent: WorkflowBuilder) {
    this.trueBranch = new WorkflowBuilder('true-branch');
    this.falseBranch = new WorkflowBuilder('false-branch');
  }

  then(memberName: MemberName, config?: StepConfig): this {
    this.trueBranch.step(memberName, config);
    return this;
  }

  else(memberName: MemberName, config?: StepConfig): this {
    this.falseBranch.step(memberName, config);
    return this;
  }

  parallel(...members: MemberName[]): this {
    this.trueBranch.parallel(...members);
    return this;
  }

  merge(): WorkflowBuilder {
    return this.parent;
  }
}

// Usage
const workflow = new WorkflowBuilder('approval-workflow')
  .step('analyze-request')
  .branch(ctx => ctx.analyze.needsApproval)
    .then('request-approval')
    .parallel('notify-manager', 'log-audit')
    .then('process-approval')
  .else('auto-approve')
  .merge()
  .step('execute-action')
  .parallel('notify-requester', 'update-database')
  .build();

// Save as YAML
await saveEnsemble(workflow);

// Or execute directly
const result = await executor.execute(workflow, input);
```

#### Benefits

- **YAML approach**: Familiar to users, easy to learn, works with existing tools
- **TypeScript approach**: Type-safe, programmatic, better for complex logic
- **Both compile to same model**: Choose what fits the use case
- **Visual representation**: Both can be visualized in cloud UI
- **Sophisticated workflows**: Match any orchestration framework

---

### 3.2. 🚀 Cloudflare AutoRAG Integration

**Priority**: High
**Effort**: 2-3 weeks
**Phase**: Q1 2026

#### Vision

Leverage Cloudflare's AutoRAG capability for effortless RAG implementation.

**Cloudflare AutoRAG Features**:
- Automatic chunking
- Automatic embedding generation
- Built into Vectorize
- Optimal chunk sizes
- Metadata extraction

#### Implementation

```typescript
// src/members/built-in/rag/autorag-member.ts

export class AutoRAGMember extends BaseMember {
  async run(context: MemberExecutionContext): Promise<any> {
    const { query, collection } = context.input;

    // Cloudflare AutoRAG - automatic embedding + search
    const vectorize = context.env.VECTORIZE;

    // Simple query - AutoRAG handles everything
    const results = await vectorize.query(query, {
      topK: context.config?.topK || 5,
      namespace: collection,
      returnMetadata: true
    });

    // Optional: Use results with Think member
    const relevantContext = results
      .map(r => r.metadata.text)
      .join('\n\n');

    return {
      results: results.map(r => ({
        text: r.metadata.text,
        score: r.score,
        metadata: r.metadata
      })),
      context: relevantContext
    };
  }
}

// Document ingestion with AutoRAG
export class AutoRAGIngest {
  async ingest(
    documents: Document[],
    collection: string,
    env: Env
  ): Promise<void> {
    const vectorize = env.VECTORIZE;

    for (const doc of documents) {
      // AutoRAG automatically:
      // 1. Chunks the document
      // 2. Generates embeddings
      // 3. Stores in Vectorize
      await vectorize.insert([
        {
          id: doc.id,
          values: [], // Empty - AutoRAG generates embeddings
          metadata: {
            text: doc.content,
            title: doc.title,
            url: doc.url,
            ...doc.metadata
          }
        }
      ], {
        namespace: collection,
        autoEmbed: true // Enable AutoRAG
      });
    }
  }
}

// Usage in ensemble
// ensembles/rag-qa.yaml
name: rag-qa
description: Question answering with AutoRAG

flow:
  - member: autorag
    input:
      query: ${input.question}
      collection: "knowledge-base"

  - member: answer
    type: think
    input:
      prompt: |
        Answer the question using only the provided context.

        Context:
        ${autorag.output.context}

        Question: ${input.question}

output:
  answer: ${answer.output.message}
  sources: ${autorag.output.results}
```

**Future: Stub Multi-Vector-DB Support**:
```typescript
// src/storage/vector/vector-repository.ts

export interface VectorRepository<T> {
  insert(vector: Vector<T>): Promise<Result<void>>;
  search(query: number[], options: SearchOptions): Promise<Result<Vector<T>[]>>;
}

// Implementations (stub for now)
export class PineconeVectorRepository<T> implements VectorRepository<T> {
  // TODO: Implement when needed
}

export class QdrantVectorRepository<T> implements VectorRepository<T> {
  // TODO: Implement when needed
}

// Active implementation
export class CloudflareVectorizeRepository<T> implements VectorRepository<T> {
  // Full implementation with AutoRAG
}
```

---

### 3.3. 🚀 Enhanced Configuration Management

**Priority**: High
**Effort**: 1 week
**Phase**: Immediate

Extract all hardcoded values to configuration (from comprehensive refactoring plan).

---

## Part 4: Implementation Timeline

### Phase 1: Foundation (Weeks 1-8)
**Goal**: Production-ready observability and documentation

1. **Telemetry Integration** (3-4 weeks)
   - Cloudflare-native by default
   - OpenTelemetry support
   - Token usage tracking
   - Replace all console.log statements

2. **OpenAPI Auto-Generation** (2-3 weeks)
   - Smart project documentation
   - Local docs server
   - CLI commands

3. **CLI Debugging Tools** (2-3 weeks)
   - Execution replay
   - Local testing
   - State inspection

**Deliverables**: Production observability, auto-generated docs, local debugging

---

### Phase 2: Graph Workflows (Weeks 9-16)
**Goal**: Advanced workflow capabilities

4. **Enhanced YAML Schema** (3-4 weeks)
   - Branch, parallel, depends_on keywords
   - Schema validation
   - Documentation

5. **TypeScript Workflow Builder** (2-3 weeks)
   - Builder API
   - Type-safe construction
   - Compile to YAML

6. **Graph Executor** (3-4 weeks)
   - Topological sorting
   - Parallel execution
   - Complex dependencies

**Deliverables**: Sophisticated workflow engine, both YAML and TypeScript APIs

---

### Phase 3: Cloud Platform MVP (Weeks 17-28)
**Goal**: Launch Conductor Cloud

7. **Cloud Infrastructure** (4-6 weeks)
   - User authentication
   - Project management
   - Telemetry ingestion
   - Data storage

8. **Visualization Dashboard** (6-8 weeks)
   - Graph visualization
   - Real-time monitoring
   - Execution history
   - Team collaboration

9. **Hosted Documentation** (2-3 weeks)
   - Docs hosting platform
   - Custom subdomains
   - Search and navigation

**Deliverables**: Conductor Cloud platform with visualization and hosted docs

---

## Success Metrics

### Technical Metrics
- ✅ Zero console.log statements (replaced with telemetry)
- ✅ Auto-generated OpenAPI docs for 100% of projects
- ✅ Support for parallel execution in workflows
- ✅ Token usage tracked in all LLM calls
- ✅ <1s to connect local project to cloud

### Business Metrics
- ✅ 1000+ projects connected to cloud (first year)
- ✅ 50% of projects using hosted docs
- ✅ 80% reduction in support questions (better docs/debugging)
- ✅ Developer NPS > 50

### User Experience Metrics
- ✅ Can visualize any execution in < 5 clicks
- ✅ Auto-generated docs rated 4.5+ stars
- ✅ Time to first successful ensemble < 15 min
- ✅ 90% of users use cloud visualization

---

## Revenue Model (Cloud Platform)

### Tiers

**Free Tier**:
- Unlimited local development
- Self-hosted docs
- Basic telemetry
- Community support

**Pro Tier** ($49/month):
- Cloud visualization dashboard
- Hosted documentation
- Advanced telemetry
- Email support
- 5 team members

**Team Tier** ($199/month):
- Everything in Pro
- Unlimited team members
- Custom domains for docs
- Priority support
- Advanced features

**Enterprise** (Custom):
- Everything in Team
- SSO/SAML
- SLA guarantees
- Dedicated support
- Custom deployment options

---

## Competitive Advantages

After implementing this roadmap:

1. **Best-in-class documentation** - Auto-generated, always up-to-date
2. **Edge-native** - Built for Cloudflare Workers from ground up
3. **Production-ready** - Telemetry, observability, debugging built-in
4. **Cloud + Local** - Seamless integration
5. **Sophisticated workflows** - Graph-based execution
6. **AutoRAG** - Easiest RAG implementation available
7. **Developer experience** - Visual tools, testing, debugging

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize phases** based on resources
3. **Design detailed specs** for each feature
4. **Build MVP of Cloud platform**
5. **Launch beta program**
6. **Iterate based on feedback**

---

## Appendix: Future Considerations

These features are deferred but worth noting:

### Model Context Protocol (MCP) Support
- Add when MCP ecosystem matures
- Enables tool discovery
- Standard integration protocol

### n8n Integration
- Generic n8n node for Conductor
- Execute ensembles from n8n
- Hybrid automation workflows

### React Component Library
- Part of cloud SDK
- Copy-paste chat components
- Configured in cloud UI

### Additional Vector Databases
- Pinecone, Qdrant, etc.
- When customers request them
- After Cloudflare Vectorize is proven

---

**Document Version**: 1.0
**Last Updated**: 2025-11-03
**Owner**: TBD
**Next Review**: After team discussion
