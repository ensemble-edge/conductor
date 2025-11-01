# Testing Infrastructure

This document outlines the testing strategy and infrastructure for Edgit.

## Current State

⚠️ **Status**: Test infrastructure not yet implemented

The project currently has no test framework configured. This is the next major task after establishing project standards.

## Planned Testing Stack

### Test Framework: Vitest

We'll use **Vitest** for the following reasons:
- Native ESM support (matches our module system)
- Fast execution with smart parallelization
- Compatible API with Jest (easy migration)
- Built-in TypeScript support
- Excellent watch mode
- Coverage reporting via c8/istanbul

### Dependencies to Install

```bash
npm install -D vitest @vitest/coverage-v8 @types/node
```

### Configuration

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
})
```

## Test Structure

```
tests/
├── unit/                           # Unit tests for pure functions
│   ├── utils/
│   │   ├── component-detector.test.ts
│   │   ├── git-tags.test.ts
│   │   ├── component-name-generator.test.ts
│   │   └── changelog.test.ts
│   └── models/
│       └── components.test.ts
├── integration/                    # Integration tests for commands
│   ├── init.test.ts
│   ├── commit.test.ts
│   ├── tag.test.ts
│   ├── deploy.test.ts
│   └── components.test.ts
├── e2e/                           # End-to-end workflow tests
│   ├── full-workflow.test.ts
│   └── multi-component.test.ts
├── fixtures/                       # Test data and sample repos
│   ├── sample-components/
│   │   ├── prompts/
│   │   ├── agents/
│   │   └── configs/
│   └── repositories/
│       └── test-repo-template/
└── helpers/                        # Test utilities
    ├── git-test-repo.ts           # Create/manage test git repos
    ├── mock-git.ts                # Mock GitWrapper
    ├── assertions.ts              # Custom assertions
    └── fixtures.ts                # Load test fixtures
```

## Test Patterns

### Unit Tests

Test pure functions and utilities in isolation:

```typescript
// tests/unit/utils/component-detector.test.ts
import { describe, it, expect } from 'vitest'
import { detectComponentType } from '../../../src/utils/component-detector.js'

describe('ComponentDetector', () => {
  describe('detectComponentType', () => {
    it('should detect prompt files by .prompt.md extension', () => {
      const type = detectComponentType('path/to/helper.prompt.md')
      expect(type).toBe('prompt')
    })

    it('should detect agent files in agents directory', () => {
      const type = detectComponentType('agents/processor.ts')
      expect(type).toBe('agent')
    })

    it('should detect SQL files by .sql extension', () => {
      const type = detectComponentType('queries/users.sql')
      expect(type).toBe('sql')
    })

    it('should return null for non-component files', () => {
      const type = detectComponentType('README.md')
      expect(type).toBeNull()
    })
  })
})
```

### Integration Tests

Test commands with real Git operations in temporary repositories:

```typescript
// tests/integration/tag.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TestGitRepo } from '../helpers/git-test-repo.js'

describe('edgit tag', () => {
  let testRepo: TestGitRepo

  beforeEach(async () => {
    testRepo = await TestGitRepo.create()
    await testRepo.init()
    await testRepo.writeFile('prompts/test.md', 'Test prompt content')
    await testRepo.commit('Initial commit')
  })

  afterEach(async () => {
    await testRepo.cleanup()
  })

  describe('create', () => {
    it('should create version tag for component', async () => {
      const result = await testRepo.runEdgit(['tag', 'create', 'test-prompt', 'v1.0.0'])

      expect(result.exitCode).toBe(0)
      const tags = await testRepo.listTags()
      expect(tags).toContain('components/test-prompt/v1.0.0')
    })

    it('should fail if version tag already exists', async () => {
      await testRepo.runEdgit(['tag', 'create', 'test-prompt', 'v1.0.0'])

      const result = await testRepo.runEdgit(['tag', 'create', 'test-prompt', 'v1.0.0'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('already exists')
    })
  })
})
```

## Test Commands

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration"
  }
}
```

## Coverage Requirements

### Thresholds

- **Critical paths** (tag creation, deployment): **80%+**
- **Utilities** (detectors, parsers): **70%+**
- **Commands**: **60%+**
- **Overall project**: **60%+**

## Next Steps

1. **Install Vitest** and configure
2. **Create test helpers** (TestGitRepo, mocks)
3. **Write 15 core integration tests** for critical paths
4. **Add unit tests** for utilities
5. **Set up CI** to run tests on every PR

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
