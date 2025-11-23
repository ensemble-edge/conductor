# Development Guide

This guide provides comprehensive instructions for developers working with the Conductor codebase.

## Prerequisites

- **Node.js** v18.0+ (v20+ recommended)
- **npm** v10.0+ (or pnpm v9+)
- **Git** v2.0+
- **TypeScript** knowledge
- **Cloudflare Workers** knowledge (helpful)
- **Wrangler CLI** v3.0+ (Cloudflare Workers CLI)
- **Unix-like environment** (Linux, macOS, or WSL on Windows)

## Quick Start

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/ensemble-edge/conductor.git
cd conductor

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Install Wrangler CLI (if not already installed)
npm install -g wrangler

# 5. Login to Cloudflare (for deployments)
wrangler login
```

### Development Workflow

```bash
# Make changes to src/
vim src/runtime/engine.ts

# Build
npm run build

# Test locally with Wrangler
npm run dev
# or
wrangler dev

# Run tests
npm test

# Deploy to staging
npm run deploy:staging
```

## Repository Structure

```
conductor/
├── src/                          # TypeScript source code
│   ├── index.ts                 # Cloudflare Workers entry point
│   ├── runtime/                 # Core runtime engine
│   │   ├── engine.ts           # Main orchestration engine
│   │   ├── state.ts            # State management
│   │   └── lifecycle.ts        # Agent lifecycle
│   ├── agents/                  # Agent management
│   │   ├── registry.ts         # Agent registry
│   │   ├── executor.ts         # Agent execution
│   │   └── types.ts            # Agent types
│   ├── workflows/               # Workflow engine
│   │   ├── definition.ts       # Workflow definitions
│   │   ├── executor.ts         # Workflow execution
│   │   └── state.ts            # Workflow state
│   ├── tools/                   # Tool integration
│   │   ├── registry.ts         # Tool registry
│   │   ├── executor.ts         # Tool execution
│   │   └── types.ts            # Tool types
│   └── utils/                   # Shared utilities
│       ├── logger.ts           # Logging utilities
│       ├── errors.ts           # Error handling
│       └── validation.ts       # Input validation
├── dist/                        # Compiled JavaScript (Worker bundle)
├── tests/                       # Tests
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test fixtures
├── wrangler.toml               # Cloudflare Workers configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Project metadata & scripts
├── CLAUDE.md                   # AI assistant guidance
├── DEVELOPMENT.md              # This file
└── TESTING.md                  # Testing guidelines
```

## Development Practices

### Branch Strategy

- `main` - Production-ready, deployed to production
- `develop` - Integration branch (if using gitflow)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code improvements
- `docs/*` - Documentation updates
- `test/*` - Test additions

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc (no code change)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, tooling

**Examples:**
```bash
feat(runtime): add agent lifecycle management
fix(workflow): handle timeout errors gracefully
docs: update deployment guide with new commands
refactor(tools): extract tool execution from registry
test(agents): add unit tests for agent executor
```

### Making Changes

#### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

#### 2. Write Code Following Standards

**TypeScript Guidelines:**
- Enable strict mode (already configured)
- No `any` types - use `unknown` and type guards
- Explicit return types for public functions
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use ES6+ features

**Code Style:**
```typescript
// ✅ Good
export async function executeAgent(
  agentId: string,
  input: unknown
): Promise<AgentResult> {
  const agent = await getAgent(agentId);

  // Implementation
  return result;
}

// ❌ Bad
export async function executeAgent(agentId, input) {  // Missing types
  var agent = await getAgent(agentId);  // var instead of const
  return result;
}
```

**Import Conventions:**
```typescript
// Use .js extension for ESM imports
import { RuntimeEngine } from '../runtime/engine.js';  // ✅ Good
import { RuntimeEngine } from '../runtime/engine';      // ❌ Bad (breaks ESM)

// Group imports
import type { Request } from '@cloudflare/workers-types';  // Type imports

import { RuntimeEngine } from '../runtime/engine.js';   // Local modules
import { AgentRegistry } from '../agents/registry.js';
```

#### 3. Add Tests

```typescript
// tests/unit/runtime/engine.test.ts
import { describe, it, expect } from 'vitest';
import { RuntimeEngine } from '../../../src/runtime/engine.js';

describe('RuntimeEngine', () => {
  describe('executeWorkflow', () => {
    it('should execute a simple workflow', async () => {
      const engine = new RuntimeEngine();
      const result = await engine.executeWorkflow(mockWorkflow);
      expect(result.status).toBe('success');
    });

    it('should handle errors gracefully', async () => {
      const engine = new RuntimeEngine();
      await expect(
        engine.executeWorkflow(invalidWorkflow)
      ).rejects.toThrow('Invalid workflow');
    });
  });
});
```

#### 4. Build and Test

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run type checking
npx tsc --noEmit
```

#### 5. Test Locally with Wrangler

```bash
# Start local development server
npm run dev

# Test with curl
curl http://localhost:8787/api/workflows

# Or use Wrangler directly
wrangler dev --local
```

#### 6. Commit and Push

```bash
git add .
git commit -m "feat(runtime): add workflow execution support"
git push origin feature/my-feature
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- tests/unit/runtime/engine.test.ts
```

### Test Structure

- **Unit tests**: Test individual functions and classes in isolation
- **Integration tests**: Test how components work together
- **Fixtures**: Reusable test data and mock objects

See [TESTING.md](./TESTING.md) for detailed testing guidelines.

## Cloudflare Workers Development

### Local Development

```bash
# Start local dev server (binds to localhost:8787)
wrangler dev

# With specific port
wrangler dev --port 3000

# With remote resources
wrangler dev --remote
```

### Environment Variables

Configure in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"
LOG_LEVEL = "debug"

[env.staging.vars]
ENVIRONMENT = "staging"

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
```

### Secrets

```bash
# Set secrets (never commit secrets!)
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY

# List secrets
wrangler secret list
```

### Deployment

```bash
# Deploy to staging
npm run deploy:staging
# or
wrangler deploy --env staging

# Deploy to production
npm run deploy:production
# or
wrangler deploy --env production
```

## Debugging

### Local Debugging

```bash
# Enable debug logging
DEBUG=true npm run dev

# Use console.log in your code
console.log('Runtime state:', state);

# Check Wrangler logs
wrangler tail
```

### Production Debugging

```bash
# Tail production logs
wrangler tail --env production

# View deployment history
wrangler deployments list

# Rollback if needed
wrangler rollback
```

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Formatting

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Type Checking

```bash
# Run TypeScript compiler without emitting
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

## Common Tasks

### Adding a New Agent

1. Define agent interface in `src/agents/types.ts`
2. Implement agent in `src/agents/implementations/`
3. Register agent in `src/agents/registry.ts`
4. Add tests in `tests/unit/agents/`
5. Update documentation

### Adding a New Workflow

1. Define workflow schema in `src/workflows/definition.ts`
2. Implement workflow executor in `src/workflows/executor.ts`
3. Add workflow validation
4. Add tests
5. Update documentation

### Adding a New Tool

1. Define tool interface in `src/tools/types.ts`
2. Implement tool in `src/tools/implementations/`
3. Register tool in `src/tools/registry.ts`
4. Add tests
5. Update documentation

## Troubleshooting

### Build Issues

```bash
# Clean build
rm -rf dist/
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Wrangler Issues

```bash
# Update Wrangler
npm install -g wrangler@latest

# Clear Wrangler cache
wrangler dev --clear-cache

# Check Wrangler configuration
wrangler whoami
```

### Test Issues

```bash
# Clear test cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- -t "should execute workflow"
```

## Performance Optimization

### Edge Considerations

- **Cold starts**: Keep bundle size small (<1MB)
- **Memory limits**: Workers have 128MB memory limit
- **CPU time**: 50ms for free tier, 50-200ms for paid
- **Subrequests**: Limit external API calls

### Best Practices

- Use Durable Objects for stateful operations
- Cache frequently accessed data
- Minimize bundle size (tree-shaking)
- Use streaming for large responses
- Monitor performance metrics

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Project Repository](https://github.com/ensemble-edge/conductor)
- [Documentation](https://docs.ensemble.ai/conductor)
- [Issue Tracker](https://github.com/ensemble-edge/conductor/issues)
- [Discussions](https://github.com/ensemble-edge/conductor/discussions)

## Getting Help

- **Bug reports**: [Open an issue](https://github.com/ensemble-edge/conductor/issues/new)
- **Feature requests**: [Start a discussion](https://github.com/ensemble-edge/conductor/discussions)
- **Questions**: Check [SUPPORT.md](./SUPPORT.md)
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
