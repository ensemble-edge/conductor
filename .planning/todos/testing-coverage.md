# Conductor Testing Infrastructure & Coverage Plan

## 🎯 Mission

Create a comprehensive testing infrastructure for Conductor that matches edgit's excellence. Achieve 80%+ test coverage with a robust suite of unit and integration tests that ensure reliability, catch regressions, and serve as living documentation.

## 📊 Current State

**Test Coverage**: ~5% (1 basic Hello World test)
**Test Files**: 1 (`test/index.spec.ts`)
**Test Helpers**: None
**Coverage Thresholds**: Not configured

**Existing Infrastructure**:
- ✅ Vitest configured with `@cloudflare/vitest-pool-workers`
- ✅ Cloudflare Workers test environment ready
- ❌ No unit tests for core logic
- ❌ No integration tests for execution flows
- ❌ No test helpers or utilities
- ❌ No coverage thresholds defined

## 🎓 Learning from edgit

edgit's testing infrastructure demonstrates excellence:
- **100+ test cases** (16 integration, 90+ unit)
- **TestGitRepo helper** for isolated testing
- **v8 coverage provider** with 40% baseline thresholds
- **Clear test organization**: `tests/unit/`, `tests/integration/`, `tests/helpers/`
- **Comprehensive unit tests**: 625 lines testing GitTagManager alone
- **Integration tests** using real Git repos in isolated environments
- **10 second timeout** for long-running operations

## 🏗️ Target Test Structure

```
tests/
├── unit/                           # Pure logic tests (80+ files needed)
│   ├── core/
│   │   ├── state-manager.test.ts
│   │   ├── result-types.test.ts
│   │   └── branded-types.test.ts
│   ├── runtime/
│   │   ├── interpolation/
│   │   │   ├── resolver.test.ts
│   │   │   └── interpolator.test.ts
│   │   ├── parser.test.ts
│   │   ├── catalog-loader.test.ts
│   │   ├── schedule-manager.test.ts
│   │   └── resumption-manager.test.ts
│   ├── members/
│   │   ├── think-member.test.ts
│   │   ├── data-member.test.ts
│   │   ├── api-member.test.ts
│   │   ├── function-member.test.ts
│   │   └── built-in/
│   │       ├── fetch-member.test.ts
│   │       ├── scrape/
│   │       │   ├── html-parser.test.ts
│   │       │   └── bot-detection.test.ts
│   │       ├── validate/
│   │       │   ├── rule-evaluator.test.ts
│   │       │   ├── judge-evaluator.test.ts
│   │       │   └── embedding-evaluator.test.ts
│   │       └── rag/
│   │           └── chunker.test.ts
│   ├── memory/
│   │   ├── working-memory.test.ts
│   │   ├── long-term-memory.test.ts
│   │   ├── semantic-memory.test.ts
│   │   ├── session-memory.test.ts
│   │   └── memory-manager.test.ts
│   ├── storage/
│   │   ├── repository.test.ts
│   │   ├── kv-repository.test.ts
│   │   ├── d1-repository.test.ts
│   │   └── r2-repository.test.ts
│   ├── providers/
│   │   ├── openai-provider.test.ts
│   │   ├── anthropic-provider.test.ts
│   │   ├── cloudflare-provider.test.ts
│   │   └── registry.test.ts
│   ├── utils/
│   │   ├── loader.test.ts
│   │   ├── normalization.test.ts
│   │   └── url-resolver.test.ts
│   ├── prompts/
│   │   ├── prompt-parser.test.ts
│   │   └── prompt-manager.test.ts
│   ├── api/
│   │   └── middleware/
│   │       ├── auth.test.ts
│   │       ├── request-id.test.ts
│   │       └── error-handler.test.ts
│   └── scoring/
│       └── ensemble-scorer.test.ts
├── integration/                    # End-to-end workflow tests (20+ files)
│   ├── executor.test.ts            # Core execution engine
│   ├── think-execution.test.ts     # Think member workflows
│   ├── data-execution.test.ts      # Data member workflows
│   ├── hitl-workflow.test.ts       # Human-in-the-loop flows
│   ├── rag-workflow.test.ts        # RAG member workflows
│   ├── validate-workflow.test.ts   # Validation workflows
│   ├── api/
│   │   ├── execute-endpoint.test.ts
│   │   ├── stream-endpoint.test.ts
│   │   ├── async-endpoint.test.ts
│   │   └── openapi-spec.test.ts
│   ├── durable-objects/
│   │   ├── execution-state.test.ts
│   │   └── hitl-state.test.ts
│   ├── catalog/
│   │   ├── catalog-loading.test.ts
│   │   └── component-resolution.test.ts
│   ├── scheduling/
│   │   ├── cron-execution.test.ts
│   │   └── scheduled-workflows.test.ts
│   └── memory/
│       ├── memory-persistence.test.ts
│       └── memory-retrieval.test.ts
└── helpers/                        # Test utilities
    ├── test-worker-env.ts          # Isolated Worker environment
    ├── test-durable-object.ts      # Durable Object test helper
    ├── test-storage.ts             # Mock storage implementations
    ├── test-members.ts             # Mock member implementations
    ├── test-catalog.ts             # Test ensemble catalog builder
    ├── test-ai-provider.ts         # Mock AI provider responses
    └── matchers.ts                 # Custom Vitest matchers

test/
└── index.spec.ts                   # Keep for basic smoke tests
```

## 🔧 Test Helpers (Critical Infrastructure)

### 1. TestWorkerEnvironment

**Purpose**: Create isolated Cloudflare Workers test environment (similar to edgit's TestGitRepo)

**Location**: `tests/helpers/test-worker-env.ts`

**Interface**:
```typescript
export class TestWorkerEnvironment {
  private env: Env;
  private ctx: ExecutionContext;
  private storage: Map<string, any>;

  static async create(options?: TestEnvOptions): Promise<TestWorkerEnvironment>

  // Environment methods
  getEnv(): Env
  getContext(): ExecutionContext

  // Storage methods
  setKV(key: string, value: any): Promise<void>
  getKV(key: string): Promise<any>
  clearKV(): void

  setD1Data(table: string, rows: any[]): Promise<void>
  queryD1(sql: string): Promise<any[]>

  putR2(key: string, data: string | Buffer): Promise<void>
  getR2(key: string): Promise<R2Object | null>

  // Catalog methods
  setCatalog(catalog: CatalogDefinition): void
  addMember(member: MemberDefinition): void
  addEnsemble(ensemble: EnsembleDefinition): void

  // Execution methods
  executeEnsemble(name: string, input: any): Promise<ExecutionResult>
  executeMember(name: string, input: any): Promise<MemberResult>

  // Assertion helpers
  getExecutionLogs(): ExecutionLog[]
  getStateHistory(): StateSnapshot[]
  getAPIRequests(): APIRequest[]

  // Cleanup
  cleanup(): Promise<void>
}
```

**Example Usage**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestWorkerEnvironment } from '../helpers/test-worker-env.js'

describe('Think Member Execution', () => {
  let env: TestWorkerEnvironment

  beforeEach(async () => {
    env = await TestWorkerEnvironment.create()

    // Setup test catalog
    env.addEnsemble({
      name: 'greet',
      members: [
        { name: 'greeter', type: 'think' }
      ]
    })

    env.addMember({
      name: 'greeter',
      type: 'think',
      config: {
        model: '@cf/meta/llama-3.1-8b-instruct',
        systemPrompt: 'You are a friendly assistant'
      }
    })
  })

  afterEach(async () => {
    await env.cleanup()
  })

  it('should execute think member successfully', async () => {
    const result = await env.executeMember('greeter', {
      message: 'Hello!'
    })

    expect(result.success).toBe(true)
    expect(result.value).toHaveProperty('response')
  })
})
```

### 2. TestDurableObject

**Purpose**: Mock Durable Object storage for testing

**Location**: `tests/helpers/test-durable-object.ts`

**Interface**:
```typescript
export class TestDurableObject {
  private storage: Map<string, any>

  static create(): TestDurableObject

  // Durable Object storage interface
  get(key: string): Promise<any>
  put(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  list(options?: ListOptions): Promise<Map<string, any>>

  // Test helpers
  getAll(): Map<string, any>
  clear(): void
  snapshot(): Record<string, any>
}
```

### 3. TestAIProvider

**Purpose**: Mock AI provider responses without external API calls

**Location**: `tests/helpers/test-ai-provider.ts`

**Interface**:
```typescript
export class TestAIProvider {
  private responses: Map<string, any>
  private callLog: ProviderCall[]

  static create(): TestAIProvider

  // Setup mock responses
  mockResponse(prompt: string, response: string): void
  mockStreamingResponse(prompt: string, chunks: string[]): void
  mockError(prompt: string, error: Error): void

  // Provider interface implementation
  generate(request: ProviderRequest): Promise<ProviderResponse>
  stream(request: ProviderRequest): AsyncIterator<string>

  // Assertions
  getCallLog(): ProviderCall[]
  assertCalled(prompt: string): void
  assertNotCalled(prompt: string): void
  reset(): void
}
```

### 4. TestStorage

**Purpose**: In-memory storage implementations for testing

**Location**: `tests/helpers/test-storage.ts`

**Implementations**:
```typescript
export class TestKVRepository implements Repository
export class TestD1Repository implements Repository
export class TestR2Repository implements Repository
```

### 5. Custom Matchers

**Purpose**: Domain-specific test assertions

**Location**: `tests/helpers/matchers.ts`

**Matchers**:
```typescript
// Result type matchers
expect(result).toBeSuccess()
expect(result).toBeFailure()
expect(result).toBeSuccessValue(value)
expect(result).toBeFailureError(error)

// State matchers
expect(state).toHaveStateKey('key')
expect(state).toHaveStateValue('key', value)

// Execution matchers
expect(execution).toHaveCompletedSuccessfully()
expect(execution).toHaveFailedWithError(error)
expect(execution).toHaveExecutedMember('memberName')
expect(execution).toHaveStateTransition(from, to)

// Memory matchers
expect(memory).toHaveMemory('key')
expect(memory).toHaveMemoryWithContext(key, context)
```

## 📝 Priority Test Files (Week-by-Week)

### Week 1: Core Foundation (5 files)

**Priority**: CRITICAL - These are the building blocks

1. **`tests/unit/core/state-manager.test.ts`** (150+ test cases)
   - State initialization
   - Immutable updates
   - Access logging
   - Member permissions
   - State validation
   - Access reporting

2. **`tests/unit/core/result-types.test.ts`** (80+ test cases)
   - Success/Failure creation
   - Type guards (isSuccess, isFailure)
   - Mapping and chaining
   - Error handling
   - Unwrapping values

3. **`tests/unit/runtime/interpolation/resolver.test.ts`** (100+ test cases)
   - Variable resolution
   - Nested object access
   - Array indexing
   - Default values
   - Error cases (undefined vars)

4. **`tests/unit/runtime/interpolation/interpolator.test.ts`** (120+ test cases)
   - String interpolation
   - Handlebars templates
   - Nested templates
   - Template caching
   - Edge cases (malformed templates)

5. **`tests/helpers/test-worker-env.ts`** (Implementation + 50 tests)
   - Create isolated environment
   - Mock storage backends
   - Execute ensembles/members
   - Capture execution logs
   - Cleanup

**Success Metrics**:
- 500+ test cases passing
- Helper infrastructure working
- Coverage: State Manager 95%+, Interpolation 90%+

### Week 2: Runtime & Execution (5 files)

1. **`tests/unit/runtime/parser.test.ts`** (100+ test cases)
   - YAML parsing
   - Validation
   - Schema enforcement
   - Error reporting

2. **`tests/unit/runtime/catalog-loader.test.ts`** (80+ test cases)
   - Directory scanning
   - Component resolution
   - Dependency loading
   - Error handling

3. **`tests/integration/executor.test.ts`** (120+ test cases)
   - Sequential execution
   - Parallel execution
   - Error propagation
   - State management
   - Member coordination

4. **`tests/integration/think-execution.test.ts`** (60+ test cases)
   - Think member execution
   - AI provider integration
   - Prompt interpolation
   - Response handling

5. **`tests/integration/data-execution.test.ts`** (60+ test cases)
   - Data transformations
   - Query execution
   - Error handling
   - State updates

**Success Metrics**:
- Executor fully tested
- End-to-end workflows validated
- Coverage: Executor 85%+, Parser 90%+

### Week 3: Members & Providers (8 files)

1. **`tests/unit/members/think-member.test.ts`** (80+ test cases)
2. **`tests/unit/members/data-member.test.ts`** (70+ test cases)
3. **`tests/unit/members/api-member.test.ts`** (70+ test cases)
4. **`tests/unit/members/function-member.test.ts`** (60+ test cases)
5. **`tests/unit/providers/openai-provider.test.ts`** (50+ test cases)
6. **`tests/unit/providers/anthropic-provider.test.ts`** (50+ test cases)
7. **`tests/unit/providers/cloudflare-provider.test.ts`** (50+ test cases)
8. **`tests/unit/providers/registry.test.ts`** (40+ test cases)

**Success Metrics**:
- All member types tested
- All providers tested
- Coverage: Members 85%+, Providers 90%+

### Week 4: Built-in Members (10 files)

1. **`tests/unit/members/built-in/fetch-member.test.ts`** (60+ test cases)
2. **`tests/unit/members/built-in/scrape/html-parser.test.ts`** (100+ test cases)
3. **`tests/unit/members/built-in/scrape/bot-detection.test.ts`** (40+ test cases)
4. **`tests/integration/scrape-workflow.test.ts`** (50+ test cases)
5. **`tests/unit/members/built-in/validate/rule-evaluator.test.ts`** (80+ test cases)
6. **`tests/unit/members/built-in/validate/judge-evaluator.test.ts`** (60+ test cases)
7. **`tests/unit/members/built-in/validate/embedding-evaluator.test.ts`** (60+ test cases)
8. **`tests/integration/validate-workflow.test.ts`** (70+ test cases)
9. **`tests/unit/members/built-in/rag/chunker.test.ts`** (80+ test cases)
10. **`tests/integration/rag-workflow.test.ts`** (90+ test cases)

**Success Metrics**:
- All built-in members tested
- Complex workflows validated
- Coverage: Built-in members 80%+

### Week 5: Storage & Memory (10 files)

1. **`tests/unit/storage/repository.test.ts`** (70+ test cases)
2. **`tests/unit/storage/kv-repository.test.ts`** (80+ test cases)
3. **`tests/unit/storage/d1-repository.test.ts`** (80+ test cases)
4. **`tests/unit/storage/r2-repository.test.ts`** (70+ test cases)
5. **`tests/unit/memory/working-memory.test.ts`** (90+ test cases)
6. **`tests/unit/memory/long-term-memory.test.ts`** (80+ test cases)
7. **`tests/unit/memory/semantic-memory.test.ts`** (100+ test cases)
8. **`tests/unit/memory/session-memory.test.ts`** (70+ test cases)
9. **`tests/unit/memory/memory-manager.test.ts`** (90+ test cases)
10. **`tests/integration/memory/memory-persistence.test.ts`** (80+ test cases)

**Success Metrics**:
- All storage backends tested
- Memory systems validated
- Coverage: Storage 85%+, Memory 80%+

### Week 6: API & Middleware (8 files)

1. **`tests/unit/api/middleware/auth.test.ts`** (60+ test cases)
2. **`tests/unit/api/middleware/request-id.test.ts`** (30+ test cases)
3. **`tests/unit/api/middleware/error-handler.test.ts`** (50+ test cases)
4. **`tests/integration/api/execute-endpoint.test.ts`** (80+ test cases)
5. **`tests/integration/api/stream-endpoint.test.ts`** (70+ test cases)
6. **`tests/integration/api/async-endpoint.test.ts`** (70+ test cases)
7. **`tests/integration/api/openapi-spec.test.ts`** (50+ test cases)
8. **`tests/unit/api/openapi/spec.test.ts`** (60+ test cases)

**Success Metrics**:
- All API endpoints tested
- Middleware chain validated
- Coverage: API 85%+, Middleware 90%+

### Week 7: Utilities & Durable Objects (8 files)

1. **`tests/unit/utils/loader.test.ts`** (60+ test cases)
2. **`tests/unit/utils/normalization.test.ts`** (80+ test cases)
3. **`tests/unit/utils/url-resolver.test.ts`** (50+ test cases)
4. **`tests/unit/prompts/prompt-parser.test.ts`** (90+ test cases)
5. **`tests/unit/prompts/prompt-manager.test.ts`** (70+ test cases)
6. **`tests/integration/durable-objects/execution-state.test.ts`** (80+ test cases)
7. **`tests/integration/durable-objects/hitl-state.test.ts`** (70+ test cases)
8. **`tests/integration/hitl-workflow.test.ts`** (100+ test cases)

**Success Metrics**:
- Utilities thoroughly tested
- Durable Objects validated
- Coverage: Utils 85%+, DOs 80%+

### Week 8: Scheduling & Advanced Features (6 files)

1. **`tests/unit/runtime/schedule-manager.test.ts`** (70+ test cases)
2. **`tests/unit/runtime/resumption-manager.test.ts`** (80+ test cases)
3. **`tests/integration/scheduling/cron-execution.test.ts`** (60+ test cases)
4. **`tests/integration/scheduling/scheduled-workflows.test.ts`** (70+ test cases)
5. **`tests/unit/scoring/ensemble-scorer.test.ts`** (90+ test cases)
6. **`tests/integration/catalog/catalog-loading.test.ts`** (80+ test cases)

**Success Metrics**:
- Advanced features tested
- Edge cases covered
- Coverage: 80%+ across all modules

## 🎯 Coverage Targets

### Phase 1: Foundation (Weeks 1-2)
- **Target**: 40% overall coverage
- **Baseline established**: Core modules at 90%+
- **Thresholds enforced**: Prevent regression

### Phase 2: Expansion (Weeks 3-6)
- **Target**: 70% overall coverage
- **Focus**: All member types, storage, API
- **Integration tests**: Major workflows covered

### Phase 3: Excellence (Weeks 7-8)
- **Target**: 85%+ overall coverage
- **Polish**: Edge cases, error paths
- **Documentation**: Tests as living docs

### Coverage Configuration

Update `vitest.config.mts`:
```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
      exclude: [
        'test/**',
        'tests/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts', // Usually just re-exports
        '**/*.d.ts',
        'src/platforms/*/examples/**',
      ],
    },
    testTimeout: 15000, // 15 seconds for Worker operations
    hookTimeout: 30000,
  },
});
```

## 📊 Success Metrics

**Quantitative**:
- ✅ 2,500+ total test cases
- ✅ 85%+ code coverage
- ✅ <1s average test execution time
- ✅ 100% CI pass rate
- ✅ 0 flaky tests

**Qualitative**:
- ✅ Tests serve as documentation
- ✅ Easy to add new tests
- ✅ Fast feedback loop (<30s for full suite)
- ✅ Catches regressions immediately
- ✅ Makes refactoring safe

## 🎨 Test Patterns & Examples

### Pattern 1: Pure Logic Unit Test

**File**: `tests/unit/core/state-manager.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { StateManager } from '../../../src/runtime/state-manager.js'

describe('StateManager - Immutability', () => {
  it('should not mutate original state on update', () => {
    const manager = new StateManager({
      initial: { count: 0 }
    })

    const original = manager.getState()
    const updated = manager.update({ count: 5 })

    // Original unchanged
    expect(original.state.count).toBe(0)
    // New instance returned
    expect(updated.getState().count).toBe(5)
    // Different instances
    expect(manager).not.toBe(updated)
  })

  it('should freeze state object', () => {
    const manager = new StateManager({
      initial: { count: 0 }
    })

    const state = manager.getState()

    // Attempting mutation should fail silently or throw
    expect(() => {
      (state as any).count = 10
    }).toThrow()
  })

  it('should log all state access', () => {
    const manager = new StateManager({ initial: { x: 1 } })

    const ctx = manager.createContext('test-member', { use: ['x'] })
    const value = ctx.state.x

    const report = manager.getAccessReport()
    expect(report.accessPatterns['x']).toHaveLength(1)
    expect(report.accessPatterns['x'][0]).toMatchObject({
      member: 'test-member',
      key: 'x',
      operation: 'read',
    })
  })
})
```

### Pattern 2: Provider Unit Test with Mocks

**File**: `tests/unit/providers/openai-provider.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenAIProvider } from '../../../src/members/think-providers/openai-provider.js'

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider
  let mockFetch: any

  beforeEach(() => {
    mockFetch = vi.fn()
    globalThis.fetch = mockFetch

    provider = new OpenAIProvider({
      apiKey: 'test-key',
      model: 'gpt-4',
    })
  })

  it('should make correct API request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello!' } }]
      })
    })

    const result = await provider.generate({
      prompt: 'Say hello',
      systemPrompt: 'You are helpful',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
        }),
        body: expect.stringContaining('gpt-4'),
      })
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.content).toBe('Hello!')
    }
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Rate Limited',
    })

    const result = await provider.generate({
      prompt: 'Test',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toContain('Rate Limited')
    }
  })
})
```

### Pattern 3: Integration Test with TestWorkerEnvironment

**File**: `tests/integration/think-execution.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestWorkerEnvironment } from '../helpers/test-worker-env.js'
import { TestAIProvider } from '../helpers/test-ai-provider.js'

describe('Think Member Execution', () => {
  let env: TestWorkerEnvironment
  let aiProvider: TestAIProvider

  beforeEach(async () => {
    env = await TestWorkerEnvironment.create()
    aiProvider = TestAIProvider.create()

    // Mock AI responses
    aiProvider.mockResponse(
      'You are a greeter',
      'Hello! Nice to meet you!'
    )

    env.setAIProvider(aiProvider)

    // Setup test ensemble
    env.addEnsemble({
      name: 'greet',
      members: [
        { name: 'greeter', type: 'think' }
      ],
      flow: [
        { member: 'greeter', input: { message: '{{input.name}}' } }
      ]
    })
  })

  afterEach(async () => {
    await env.cleanup()
  })

  it('should execute think member with interpolation', async () => {
    const result = await env.executeEnsemble('greet', {
      name: 'Alice'
    })

    expect(result).toBeSuccess()
    expect(result.value.output).toContain('Hello')

    // Verify AI provider was called
    aiProvider.assertCalled('You are a greeter')
    expect(aiProvider.getCallLog()).toHaveLength(1)
  })

  it('should handle think member errors', async () => {
    aiProvider.mockError(
      'You are a greeter',
      new Error('API Error')
    )

    const result = await env.executeEnsemble('greet', {
      name: 'Bob'
    })

    expect(result).toBeFailure()
    expect(result.error.message).toContain('API Error')
  })

  it('should maintain state across member executions', async () => {
    env.addEnsemble({
      name: 'stateful',
      state: {
        initial: { count: 0 }
      },
      members: [
        { name: 'counter', type: 'function' }
      ],
      flow: [
        { member: 'counter', setState: { count: '{{state.count + 1}}' } },
        { member: 'counter', setState: { count: '{{state.count + 1}}' } }
      ]
    })

    const result = await env.executeEnsemble('stateful', {})

    const finalState = env.getStateHistory().at(-1)
    expect(finalState?.state.count).toBe(2)
  })
})
```

### Pattern 4: Durable Object Integration Test

**File**: `tests/integration/durable-objects/execution-state.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { env, createExecutionContext } from 'cloudflare:test'
import { ExecutionState } from '../../../src/durable-objects/execution-state.js'

describe('ExecutionState Durable Object', () => {
  let id: DurableObjectId
  let stub: DurableObjectStub

  beforeEach(() => {
    id = env.EXECUTION_STATE.idFromName('test-execution')
    stub = env.EXECUTION_STATE.get(id)
  })

  it('should persist execution state', async () => {
    // Store execution state
    await stub.fetch('http://internal/save', {
      method: 'POST',
      body: JSON.stringify({
        executionId: 'exec-123',
        state: { count: 5 },
        status: 'running',
      })
    })

    // Retrieve execution state
    const response = await stub.fetch('http://internal/load?executionId=exec-123')
    const data = await response.json()

    expect(data.state.count).toBe(5)
    expect(data.status).toBe('running')
  })

  it('should handle concurrent state updates', async () => {
    const updates = Array.from({ length: 10 }, (_, i) =>
      stub.fetch('http://internal/increment', {
        method: 'POST',
        body: JSON.stringify({ executionId: 'exec-concurrent' })
      })
    )

    await Promise.all(updates)

    const response = await stub.fetch('http://internal/load?executionId=exec-concurrent')
    const data = await response.json()

    // All 10 increments should be reflected
    expect(data.state.count).toBe(10)
  })
})
```

### Pattern 5: Complex Workflow Integration Test

**File**: `tests/integration/rag-workflow.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestWorkerEnvironment } from '../helpers/test-worker-env.js'

describe('RAG Member Workflow', () => {
  let env: TestWorkerEnvironment

  beforeEach(async () => {
    env = await TestWorkerEnvironment.create()

    // Setup Vectorize mock
    env.setVectorizeData([
      { id: '1', values: [0.1, 0.2], metadata: { text: 'Document 1' } },
      { id: '2', values: [0.3, 0.4], metadata: { text: 'Document 2' } },
    ])

    // Setup RAG ensemble
    env.addEnsemble({
      name: 'rag-search',
      members: [
        { name: 'retriever', type: 'rag' },
        { name: 'generator', type: 'think' }
      ],
      flow: [
        {
          member: 'retriever',
          input: { query: '{{input.question}}' },
          setState: { documents: '{{output.results}}' }
        },
        {
          member: 'generator',
          input: {
            context: '{{state.documents}}',
            question: '{{input.question}}'
          }
        }
      ]
    })
  })

  afterEach(async () => {
    await env.cleanup()
  })

  it('should retrieve and generate answer', async () => {
    const result = await env.executeEnsemble('rag-search', {
      question: 'What is in the documents?'
    })

    expect(result).toBeSuccess()

    // Check that retrieval happened
    const logs = env.getExecutionLogs()
    expect(logs).toHaveExecutedMember('retriever')
    expect(logs).toHaveExecutedMember('generator')

    // Check state was updated
    const state = env.getStateHistory().find(s => s.documents)
    expect(state?.documents).toHaveLength(2)
  })

  it('should chunk and embed documents', async () => {
    env.addMember({
      name: 'indexer',
      type: 'rag',
      config: {
        chunkSize: 100,
        chunkOverlap: 20,
        embedModel: '@cf/baai/bge-base-en-v1.5',
      }
    })

    const result = await env.executeMember('indexer', {
      documents: [
        { text: 'Long document text...'.repeat(100) }
      ]
    })

    expect(result).toBeSuccess()

    // Verify chunks were created
    const chunks = result.value.chunks
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].text.length).toBeLessThanOrEqual(100)
  })
})
```

## 🚀 Implementation Timeline

### Week 1: Foundation
- [ ] Create `tests/` directory structure
- [ ] Implement TestWorkerEnvironment helper
- [ ] Implement TestAIProvider helper
- [ ] Write StateManager tests (150+ cases)
- [ ] Write Result types tests (80+ cases)
- [ ] Write Interpolation tests (220+ cases)
- [ ] Setup custom matchers
- [ ] Configure coverage thresholds (40% baseline)

### Week 2: Runtime & Execution
- [ ] Write Parser tests (100+ cases)
- [ ] Write CatalogLoader tests (80+ cases)
- [ ] Write Executor integration tests (120+ cases)
- [ ] Write Think execution tests (60+ cases)
- [ ] Write Data execution tests (60+ cases)
- [ ] Implement TestDurableObject helper
- [ ] Implement TestStorage helpers

### Week 3: Members & Providers
- [ ] Write member tests (280+ cases total)
- [ ] Write provider tests (190+ cases total)
- [ ] Test registry functionality
- [ ] Test member coordination
- [ ] Test error propagation

### Week 4: Built-in Members
- [ ] Write Fetch member tests (60+ cases)
- [ ] Write Scrape member tests (190+ cases)
- [ ] Write Validate member tests (270+ cases)
- [ ] Write RAG member tests (170+ cases)
- [ ] Integration tests for workflows

### Week 5: Storage & Memory
- [ ] Write storage repository tests (300+ cases)
- [ ] Write memory system tests (420+ cases)
- [ ] Write memory persistence tests (80+ cases)
- [ ] Test memory retrieval patterns
- [ ] Test semantic search

### Week 6: API & Middleware
- [ ] Write middleware tests (140+ cases)
- [ ] Write API endpoint tests (270+ cases)
- [ ] Write OpenAPI spec tests (110+ cases)
- [ ] Test streaming endpoints
- [ ] Test async execution

### Week 7: Utilities & Durable Objects
- [ ] Write utility tests (190+ cases)
- [ ] Write prompt tests (160+ cases)
- [ ] Write Durable Object tests (150+ cases)
- [ ] Write HITL workflow tests (100+ cases)
- [ ] Test error recovery

### Week 8: Final Push
- [ ] Write scheduling tests (140+ cases)
- [ ] Write resumption tests (80+ cases)
- [ ] Write scoring tests (90+ cases)
- [ ] Polish edge cases
- [ ] Achieve 85%+ coverage
- [ ] Document test patterns

## 🎯 Week-by-Week Milestones

| Week | Files | Test Cases | Coverage | Focus |
|------|-------|-----------|----------|-------|
| 1 | 5 | 500+ | 40% | Core + Helpers |
| 2 | 5 | 420+ | 50% | Runtime + Executor |
| 3 | 8 | 470+ | 60% | Members + Providers |
| 4 | 10 | 680+ | 68% | Built-in Members |
| 5 | 10 | 800+ | 75% | Storage + Memory |
| 6 | 8 | 520+ | 80% | API + Middleware |
| 7 | 8 | 580+ | 83% | Utils + DOs |
| 8 | 6 | 450+ | 85%+ | Advanced Features |
| **Total** | **60+** | **4,420+** | **85%+** | **Production Ready** |

## 📚 Testing Best Practices

### 1. Test Naming
```typescript
// ✅ GOOD: Describes behavior and expectation
it('should return failure when user not found')
it('should interpolate nested variables correctly')
it('should freeze state object after creation')

// ❌ BAD: Vague or implementation-focused
it('test user lookup')
it('interpolation works')
it('state test')
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should update state immutably', () => {
  // Arrange
  const manager = new StateManager({ initial: { count: 0 } })

  // Act
  const updated = manager.update({ count: 5 })

  // Assert
  expect(manager.getState().count).toBe(0) // Original unchanged
  expect(updated.getState().count).toBe(5) // New instance updated
})
```

### 3. Test One Thing
```typescript
// ✅ GOOD: Single responsibility
it('should validate email format')
it('should normalize email to lowercase')
it('should extract domain from email')

// ❌ BAD: Testing multiple concerns
it('should validate, normalize, and extract email')
```

### 4. Use Descriptive Assertions
```typescript
// ✅ GOOD
expect(result).toBeSuccessValue({ id: 'user-123', name: 'Alice' })
expect(execution).toHaveExecutedMember('greeter')

// ❌ BAD
expect(result.success).toBe(true)
expect(result.value.id).toBe('user-123')
```

### 5. Test Error Paths
```typescript
it('should handle network errors gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'))

  const result = await provider.generate({ prompt: 'test' })

  expect(result).toBeFailure()
  expect(result.error.message).toContain('Network error')
})
```

## 🔍 Code Coverage Standards

### High Priority (95%+ coverage)
- `src/runtime/state-manager.ts`
- `src/types/result.ts`
- `src/runtime/interpolation/`
- `src/core/` (all core logic)

### Medium Priority (85%+ coverage)
- `src/runtime/executor.ts`
- `src/members/` (all member types)
- `src/storage/` (all repositories)
- `src/api/` (all endpoints)

### Lower Priority (70%+ coverage)
- `src/cli/` (CLI commands)
- `src/platforms/` (platform adapters)
- `src/utils/` (utilities)

### Excluded from Coverage
- `src/index.ts` (entry point)
- `**/index.ts` (re-exports)
- `src/platforms/*/examples/`
- `**/*.d.ts`

## 📖 Testing Documentation

Create `TESTING.md` in root:

```markdown
# Testing Guide

## Running Tests

\`\`\bash
# Run all tests
npm test

# Run specific test file
npm test tests/unit/core/state-manager.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run only integration tests
npm test tests/integration

# Run only unit tests
npm test tests/unit
\`\`\

## Test Structure

- `tests/unit/` - Pure logic tests with mocks
- `tests/integration/` - End-to-end workflow tests
- `tests/helpers/` - Test utilities and helpers

## Writing Tests

See [test patterns](#test-patterns) for examples.

## Coverage Thresholds

- Overall: 85%+
- Core modules: 95%+
- Members/Storage/API: 85%+
- Utils/CLI: 70%+
```

## ✅ Definition of Done

Testing infrastructure is complete when:

- [x] 60+ test files created
- [x] 4,000+ test cases passing
- [x] 85%+ code coverage achieved
- [x] All core modules at 95%+ coverage
- [x] Test helpers fully implemented
- [x] Custom matchers working
- [x] CI/CD integration configured
- [x] TESTING.md documentation written
- [x] 0 flaky tests
- [x] <30s full test suite execution time
- [x] Tests serve as living documentation
- [x] Team can easily add new tests

## 🎓 Success Criteria

When this is complete, Conductor will have:

1. **Confidence**: Make changes without fear of breaking things
2. **Documentation**: Tests show how every feature works
3. **Quality**: Catch bugs before they reach production
4. **Speed**: Fast feedback loop for development
5. **Standards**: World-class testing matching edgit's excellence

---

**This testing infrastructure will transform Conductor into a production-ready, enterprise-grade framework with the reliability and confidence that comes from comprehensive test coverage.**
