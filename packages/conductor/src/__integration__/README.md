# Integration Tests

Comprehensive end-to-end testing for Conductor using local builds.

## Overview

These integration tests verify the complete Conductor experience:
1. **Build & pack** - Create a local tarball from source
2. **Install** - Install Conductor in a fresh project
3. **Initialize** - Run `conductor init`
4. **Test** - Verify the template's own tests pass
5. **Build** - Verify the project builds
6. **Agents** - Test custom agents
7. **Ensembles** - Test workflow orchestration

## Running Tests

### All Integration Tests
```bash
pnpm test:integration
```

### Specific Phase
```bash
pnpm test:integration:phase1  # Installation
pnpm test:integration:phase2  # Template tests
pnpm test:integration:phase3  # Custom agents (create & test via API)
pnpm test:integration:phase4  # Custom ensembles (create & test orchestration)
```

### Watch Mode (for development)
```bash
pnpm test:integration:watch
```

## How It Works

### 1. Local Build Strategy

Instead of publishing to npm, we:
1. Build Conductor: `pnpm build`
2. Pack as tarball: `pnpm pack` → `ensemble-edge-conductor-0.1.0.tgz`
3. Install from tarball: `npm install /path/to/tarball`

This simulates a real npm install without touching the registry!

### 2. Test Project Lifecycle

```typescript
const project = await TestProject.create({ name: 'test' })

// Install Conductor from local build
await project.installConductor(tarballPath)

// Initialize project
await project.init()

// Install dependencies
await project.install()

// Build
await project.build()

// Run tests
await project.test()

// Cleanup
await project.cleanup()
```

### 3. Caching

The tarball is cached in `.integration-cache/` to avoid rebuilding for every test:
- First run: ~30s build time
- Subsequent runs: Instant (uses cache)
- Cache invalidates on version change

## Test Structure

```
src/__integration__/
├── setup/
│   ├── build-pack.ts       # Build & pack Conductor
│   ├── test-project.ts     # TestProject helper class
│   └── server.ts           # Dev server management
├── helpers/
│   └── http.ts             # HTTP testing utilities
├── suites/
│   ├── 01-installation.test.ts   # Installation & init
│   ├── 02-template-tests.test.ts # Template's own tests
│   ├── 03-custom-agents.test.ts  # Create & test custom agents
│   └── 04-custom-ensembles.test.ts # Create & test custom ensembles
└── README.md (this file)
```

## Writing New Tests

### Basic Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildAndPackConductor } from '../setup/build-pack.js'
import { TestProject } from '../setup/test-project.js'

describe('My Test Suite', () => {
  let project: TestProject

  beforeAll(async () => {
    const tarballPath = await buildAndPackConductor()
    project = await TestProject.create({ name: 'my-test' })

    // Setup...
    await project.installConductor(tarballPath)
    await project.init()
    await project.install()
    await project.build()
  }, 600000) // 10 min timeout

  afterAll(async () => {
    await project.cleanup()
  })

  it('should do something', async () => {
    // Your test...
  })
})
```

### TestProject API

```typescript
// File operations
await project.exists('path/to/file')
await project.readFile('path/to/file')
await project.writeFile('path/to/file', content)

// Agent/Ensemble creation
await project.createAgent('my-agent', {
  yaml: '...',
  ts: '...'
})
await project.createEnsemble('my-ensemble', yaml)

// Commands
await project.exec('any-command')
await project.install()
await project.build()
await project.test()

// Cleanup
await project.cleanup()
```

## Troubleshooting

### Cache Issues
If tests fail due to stale cache:
```bash
rm -rf packages/conductor/.integration-cache
```

### Debugging Failed Tests
Tests preserve the project directory on failure:
```typescript
const project = await TestProject.create({
  preserveOnFailure: true  // Don't cleanup on test failure
})
```

Check the logs for the temp directory path, then:
```bash
cd /tmp/conductor-test-xxx
ls -la
cat package.json
```

### Timeouts
Integration tests have generous timeouts:
- Build: 120s
- Install: 180s
- Tests: 60s

Increase if needed in test file.

## CI/CD

These tests run in GitHub Actions:
```yaml
- name: Integration Tests
  run: pnpm test:integration
  timeout-minutes: 30
```

## Test Phases

All phases are now implemented:

### Phase 1: Installation (8 tests)
- Test project creation
- Local tarball installation
- `conductor init` execution
- Project structure verification (package.json, wrangler.toml)
- Dependency installation
- Build process
- Template examples verification

### Phase 2: Template Tests (5 tests)
- Template test file existence
- Running the template's own test suite (9 tests)
- Hello-world ensemble test verification
- ExecutionContext mock correctness
- Test coverage of key features

### Phase 3: Custom Agents (12 tests)
- Create 3 custom agents (text-processor, calculator, data-validator)
- Verify agent files in agents/ directory
- Test text-processor: uppercase, lowercase, reverse
- Test calculator: add, subtract, multiply, divide
- Test data-validator: valid and invalid data
- Test email, age, username validation rules

### Phase 4: Custom Ensembles (6 tests)
- Create custom agents for ensemble testing
- Create 3 custom ensembles (text-pipeline, text-analysis, math-pipeline)
- Test sequential workflow (text-pipeline: uppercase → reverse)
- Test parallel workflow (text-analysis: count + validate)
- Test chained calculations (math-pipeline: multiply → add)
- Verify step tracking and error handling

### Future: Workers AI Testing
Coming soon - requires Cloudflare credentials configuration

## Performance

Typical run times (with cached build):
- Phase 1 (Installation): ~5min
- Phase 2 (Template Tests): ~2min
- Phase 3 (Agents): ~3min
- Phase 4 (Ensembles): ~3min
- **Total: ~13min**

First run (no cache): ~14min
