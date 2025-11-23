# Testing Strategy

This document outlines the testing strategy and infrastructure for Conductor.

## Overview

Conductor uses a comprehensive testing approach to ensure reliable agent orchestration:

- **Unit tests** - Test individual functions and classes in isolation
- **Integration tests** - Test how components work together
- **End-to-end tests** - Test complete workflows from API to result

## Test Framework

We use **Vitest** as our test framework:
- Fast, modern testing with native ESM support
- Compatible with Cloudflare Workers environment
- Built-in coverage reporting
- Watch mode for development

## Test Structure

```
tests/
├── unit/                       # Unit tests
│   ├── runtime/
│   │   ├── engine.test.ts     # Runtime engine tests
│   │   ├── state.test.ts      # State management tests
│   │   └── lifecycle.test.ts  # Agent lifecycle tests
│   ├── agents/
│   │   ├── registry.test.ts   # Agent registry tests
│   │   ├── executor.test.ts   # Agent execution tests
│   │   └── types.test.ts      # Type validation tests
│   ├── workflows/
│   │   ├── definition.test.ts # Workflow definition tests
│   │   ├── executor.test.ts   # Workflow execution tests
│   │   └── state.test.ts      # Workflow state tests
│   └── tools/
│       ├── registry.test.ts   # Tool registry tests
│       └── executor.test.ts   # Tool execution tests
├── integration/                # Integration tests
│   ├── runtime/
│   │   └── full-workflow.test.ts
│   ├── agents/
│   │   └── agent-communication.test.ts
│   └── workflows/
│       └── multi-step.test.ts
├── e2e/                        # End-to-end tests
│   └── api/
│       ├── workflows.test.ts
│       └── agents.test.ts
├── fixtures/                   # Test data
│   ├── workflows/
│   │   ├── simple-workflow.json
│   │   └── complex-workflow.json
│   ├── agents/
│   │   └── mock-agent.ts
│   └── responses/
│       └── mock-responses.json
└── helpers/                    # Test utilities
    ├── mock-runtime.ts
    ├── mock-env.ts
    └── test-helpers.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Watch mode (auto-run on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/runtime/engine.test.ts

# Run tests matching pattern
npm test -- -t "workflow execution"
```

### Coverage Requirements

- **Critical paths**: 80%+ coverage (runtime, workflows, agents)
- **Utilities**: 70%+ coverage
- **Overall project**: 60%+ coverage

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/runtime/engine.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuntimeEngine } from '../../../src/runtime/engine.js';
import { mockWorkflow, mockAgent } from '../../fixtures/workflows/simple-workflow.js';

describe('RuntimeEngine', () => {
  let engine: RuntimeEngine;

  beforeEach(() => {
    engine = new RuntimeEngine();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('executeWorkflow', () => {
    it('should execute a simple workflow successfully', async () => {
      const result = await engine.executeWorkflow(mockWorkflow);

      expect(result.status).toBe('success');
      expect(result.steps).toHaveLength(3);
      expect(result.output).toBeDefined();
    });

    it('should handle workflow errors gracefully', async () => {
      const invalidWorkflow = { ...mockWorkflow, steps: [] };

      await expect(
        engine.executeWorkflow(invalidWorkflow)
      ).rejects.toThrow('Workflow must have at least one step');
    });

    it('should timeout long-running workflows', async () => {
      const longWorkflow = {
        ...mockWorkflow,
        timeout: 100, // 100ms timeout
      };

      await expect(
        engine.executeWorkflow(longWorkflow)
      ).rejects.toThrow('Workflow execution timeout');
    });
  });

  describe('executeAgent', () => {
    it('should execute an agent with given input', async () => {
      const result = await engine.executeAgent(mockAgent, { query: 'test' });

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });
  });
});
```

### Integration Test Example

```typescript
// tests/integration/runtime/full-workflow.test.ts
import { describe, it, expect } from 'vitest';
import { RuntimeEngine } from '../../../src/runtime/engine.js';
import { AgentRegistry } from '../../../src/agents/registry.js';
import { WorkflowExecutor } from '../../../src/workflows/executor.js';

describe('Full Workflow Integration', () => {
  it('should execute a multi-agent workflow end-to-end', async () => {
    // Setup
    const registry = new AgentRegistry();
    const engine = new RuntimeEngine(registry);
    const executor = new WorkflowExecutor(engine);

    // Register agents
    await registry.register('agent-1', agent1Config);
    await registry.register('agent-2', agent2Config);

    // Define workflow
    const workflow = {
      name: 'multi-agent-workflow',
      steps: [
        { agent: 'agent-1', input: { query: 'test' } },
        { agent: 'agent-2', input: { prev: '${step1.output}' } },
      ],
    };

    // Execute
    const result = await executor.execute(workflow);

    // Assert
    expect(result.status).toBe('success');
    expect(result.steps[0].agent).toBe('agent-1');
    expect(result.steps[1].agent).toBe('agent-2');
    expect(result.steps[1].input.prev).toBe(result.steps[0].output);
  });
});
```

### End-to-End Test Example

```typescript
// tests/e2e/api/workflows.test.ts
import { describe, it, expect } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('Workflow API', () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should execute a workflow via API', async () => {
    const response = await worker.fetch('/api/workflows/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: {
          name: 'test-workflow',
          steps: [{ agent: 'test-agent', input: { query: 'hello' } }],
        },
      }),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.status).toBe('success');
    expect(result.output).toBeDefined();
  });

  it('should return 400 for invalid workflow', async () => {
    const response = await worker.fetch('/api/workflows/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' }),
    });

    expect(response.status).toBe(400);
  });
});
```

## Test Utilities

### Mock Runtime

```typescript
// tests/helpers/mock-runtime.ts
import { RuntimeEngine } from '../../src/runtime/engine.js';

export function createMockRuntime(overrides = {}) {
  return {
    executeWorkflow: vi.fn().mockResolvedValue({
      status: 'success',
      steps: [],
      output: {},
    }),
    executeAgent: vi.fn().mockResolvedValue({
      success: true,
      output: 'mock output',
    }),
    ...overrides,
  };
}
```

### Mock Environment

```typescript
// tests/helpers/mock-env.ts
export function createMockEnv() {
  return {
    ENVIRONMENT: 'test',
    LOG_LEVEL: 'debug',
    OPENAI_API_KEY: 'test-key',
  };
}
```

## Testing Cloudflare Workers

### Local Testing with Wrangler

```bash
# Start local dev server
wrangler dev

# Test with curl
curl -X POST http://localhost:8787/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{"workflow": {...}}'
```

### Testing Workers APIs

```typescript
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('Worker', () => {
  it('should handle requests', async () => {
    const request = new Request('http://example.com/api/health');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
  });
});
```

## Best Practices

### Test Organization

- **One test file per source file**: `src/runtime/engine.ts` → `tests/unit/runtime/engine.test.ts`
- **Descriptive test names**: Use `it('should...')` format
- **Group related tests**: Use `describe()` blocks effectively
- **Setup and teardown**: Use `beforeEach()` and `afterEach()` for cleanup

### Test Coverage

- **Critical paths first**: Focus on runtime, workflows, and agent execution
- **Edge cases**: Test error conditions, timeouts, invalid input
- **Happy path and sad path**: Test both success and failure scenarios
- **Async operations**: Always test async/await properly

### Mocking

- **Mock external dependencies**: Don't call real APIs in tests
- **Use fixtures**: Reusable test data in `fixtures/` directory
- **Dependency injection**: Make code testable by injecting dependencies

### Performance

- **Fast tests**: Unit tests should run in milliseconds
- **Parallel execution**: Vitest runs tests in parallel by default
- **Avoid network calls**: Mock all external API calls
- **Clean up resources**: Prevent memory leaks in tests

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Pre-deployment validation

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

### VSCode Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

### Command Line Debugging

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/vitest

# Verbose output
npm test -- --reporter=verbose

# Only run failing tests
npm test -- --only-failures
```

## Common Issues

### Tests Timing Out

```typescript
// Increase timeout for slow tests
it('should handle long operations', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('../src/utils/api.js', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mock' }),
}));
```

### Testing Workers Environment

```typescript
// Use miniflare for local Workers testing
import { Miniflare } from 'miniflare';

const mf = new Miniflare({
  script: `export default { async fetch() { return new Response('ok'); } }`,
});

const response = await mf.dispatchFetch('http://localhost/');
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)
- [Wrangler Testing Guide](https://developers.cloudflare.com/workers/wrangler/testing/)
- [Testing Best Practices](https://testingjavascript.com/)
