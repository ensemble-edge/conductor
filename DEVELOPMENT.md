# Development Guide

This guide provides comprehensive instructions for developers working with the Edgit codebase.

## Prerequisites

- **Node.js** v18.0+ (v20+ recommended)
- **npm** v10.0+ (or pnpm v9+)
- **Git** v2.0+
- **TypeScript** knowledge
- **Unix-like environment** (Linux, macOS, or WSL on Windows)

## Quick Start

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/ensemble-edge/edgit.git
cd edgit

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Link for local development (optional)
npm link

# 5. Verify installation
edgit --version
```

### Development Workflow

```bash
# Make changes to src/
vim src/commands/my-feature.ts

# Build
npm run build

# Test locally (if linked)
edgit my-feature

# Or run directly
node dist/index.js my-feature
```

## Repository Structure

```
edgit/
├── src/                          # TypeScript source code
│   ├── index.ts                 # CLI entry point & router
│   ├── commands/                # Command implementations
│   │   ├── base.ts             # Base Command class
│   │   ├── init.ts             # Repository initialization
│   │   ├── commit.ts           # AI-powered commits
│   │   ├── tag.ts              # Version tag management
│   │   ├── deploy.ts           # Deployment operations
│   │   ├── components.ts       # Component management
│   │   └── ...                 # Other commands
│   ├── utils/                   # Core utilities
│   │   ├── git.ts              # Git wrapper
│   │   ├── git-tags.ts         # Tag operations
│   │   ├── component-detector.ts # Pattern detection
│   │   ├── ai-commit.ts        # OpenAI integration
│   │   └── ...
│   ├── models/                  # Data models & types
│   │   └── components.ts       # Component definitions
│   └── types/                   # TypeScript type definitions
│       └── ai-commit.ts        # AI-related types
├── dist/                        # Compiled JavaScript (gitignored)
├── tests/                       # Tests (TODO: not yet implemented)
├── .edgit/                      # Example edgit metadata
├── docs/                        # Documentation
├── examples/                    # Usage examples (TODO)
├── tsconfig.json               # TypeScript configuration
├── package.json                # Project metadata & scripts
├── CLAUDE.md                   # AI assistant guidance
├── DEVELOPMENT.md              # This file
└── CONTRIBUTING.md             # Contribution guidelines
```

## Development Practices

### Branch Strategy

- `main` - Production-ready, published to npm
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
feat(tag): add support for batch tag creation
fix(ai-commit): handle API timeout gracefully
docs: update README with new deployment commands
refactor(git): extract tag manager from git wrapper
test(detector): add unit tests for component detection
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
export async function createTag(
  componentName: string,
  version: string
): Promise<string> {
  const tagName = `components/${componentName}/${version}`;

  // Implementation
  return tagName;
}

// ❌ Bad
export async function createTag(componentName, version) {  // Missing types
  var tagName = 'components/' + componentName + '/' + version;  // var, string concat
  return tagName;
}
```

**Import Conventions:**
```typescript
// Use .js extension for ESM imports
import { GitWrapper } from '../utils/git.js';  // ✅ Good
import { GitWrapper } from '../utils/git';      // ❌ Bad (breaks ESM)

// Group imports
import fs from 'fs/promises';                    // Node built-ins
import path from 'path';

import { GitWrapper } from '../utils/git.js';   // Local modules
import { Component } from '../models/components.js';
```

#### 3. Add Tests

⚠️ **Current State**: Test infrastructure not yet set up

Once tests are configured:
```typescript
// tests/unit/utils/component-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectComponentType } from '../../../src/utils/component-detector.js';

describe('ComponentDetector', () => {
  describe('detectComponentType', () => {
    it('should detect prompt files', () => {
      const type = detectComponentType('prompts/helper.prompt.md');
      expect(type).toBe('prompt');
    });

    it('should detect agent files', () => {
      const type = detectComponentType('agents/processor.agent.js');
      expect(type).toBe('agent');
    });
  });
});
```

#### 4. Update Documentation

- Update `README.md` if adding user-facing features
- Update `CLAUDE.md` if changing architecture
- Add JSDoc comments to new functions
- Update examples if needed

#### 5. Build and Test Locally

```bash
# Build
npm run build

# Test command locally (if npm link is set up)
edgit your-command

# Or run directly
node dist/index.js your-command

# Test in a sample repository
cd /tmp
mkdir test-repo && cd test-repo
git init
edgit init
# Test your feature...
```

#### 6. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description of change"
```

#### 7. Push and Create PR

```bash
git push origin feature/my-feature
# Create PR on GitHub
```

## Code Quality Standards

### TypeScript Configuration

The project uses strict TypeScript settings:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "isolatedModules": true,
  "esModuleInterop": true
}
```

### Planned Linting (TODO)

Once ESLint is configured:
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

**Rules to follow manually until then:**
- No unused variables
- No console.log in production code (use console.error for errors)
- Consistent naming: camelCase for variables/functions, PascalCase for classes
- No magic numbers - use constants
- Keep functions focused and small (<50 lines ideal)

### Planned Formatting (TODO)

Once Prettier is configured:
```bash
npm run format      # Format all files
```

**Style to follow manually:**
- 2 spaces for indentation
- Single quotes for strings
- No semicolons (TypeScript convention)
- Trailing commas in multiline

## Testing

### Current State
⚠️ **Tests not yet implemented**

The project currently has no test infrastructure. This is a high-priority item.

### Planned Test Strategy

#### Test Structure
```
tests/
├── unit/                        # Pure function tests
│   ├── utils/
│   │   ├── component-detector.test.ts
│   │   ├── git-tags.test.ts
│   │   └── ...
│   └── models/
│       └── components.test.ts
├── integration/                 # Command end-to-end tests
│   ├── init.test.ts
│   ├── tag.test.ts
│   ├── deploy.test.ts
│   └── ...
├── fixtures/                    # Test data
│   ├── sample-repos/
│   └── components/
└── helpers/                     # Test utilities
    ├── git-test-repo.ts        # Create temp git repos
    ├── mock-git.ts             # Mock git operations
    └── assertions.ts           # Custom assertions
```

#### Running Tests (once implemented)
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
```

#### Writing Tests

**Test Framework**: Jest or Vitest (TBD)

**Pattern for Unit Tests:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('FunctionName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle success case', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });

  it('should handle error case', () => {
    expect(() => functionUnderTest('')).toThrow('Error message');
  });
});
```

**Pattern for Integration Tests:**
```typescript
import { createTestRepo } from '../helpers/git-test-repo';

describe('edgit tag', () => {
  let testRepo: TestRepo;

  beforeEach(async () => {
    testRepo = await createTestRepo();
    await testRepo.init();
  });

  afterEach(async () => {
    await testRepo.cleanup();
  });

  it('should create version tag', async () => {
    // Create a component
    await testRepo.writeFile('prompts/test.md', 'content');
    await testRepo.commit('Initial commit');

    // Run edgit command
    const result = await testRepo.runEdgit(['tag', 'create', 'test-prompt', 'v1.0.0']);

    // Verify
    expect(result.exitCode).toBe(0);
    const tags = await testRepo.listTags();
    expect(tags).toContain('components/test-prompt/v1.0.0');
  });
});
```

### Coverage Goals (future)
- **Critical paths**: 80%+ coverage
- **Utilities**: 70%+ coverage
- **Overall**: 60%+ coverage

## Debugging

### VSCode Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Edgit Command",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/index.js",
      "args": ["tag", "list"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}/test-repo"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debugging Tips

**Add debug logging:**
```typescript
// Temporary debug output
if (process.env.DEBUG) {
  console.error('[DEBUG]', 'Variable:', value);
}
```

**Run with debug output:**
```bash
DEBUG=true edgit tag list
```

**Inspect Git operations:**
```bash
# See what git commands edgit runs
GIT_TRACE=1 edgit tag create my-prompt v1.0.0

# See git tag operations specifically
GIT_TRACE=1 git tag -l "components/*"
```

**Check registry:**
```bash
# View current registry
cat .edgit/components.json | jq

# View all tags
git tag -l "components/*" | sort
```

## Common Issues

### Build Errors

**Issue**: TypeScript errors after adding new code
```bash
# Check types without building
npx tsc --noEmit

# Clean build
rm -rf dist/ && npm run build
```

**Issue**: Import errors (`Cannot find module`)
```bash
# Ensure .js extension in imports (ESM requirement)
import { GitWrapper } from '../utils/git.js';  // ✅
import { GitWrapper } from '../utils/git';      // ❌
```

### Runtime Errors

**Issue**: Command not found after building
```bash
# Rebuild
npm run build

# Re-link
npm unlink edgit
npm link

# Or run directly
node dist/index.js --help
```

**Issue**: Git operations fail
```bash
# Check git is available
which git
git --version

# Check you're in a git repo
git status
```

**Issue**: OpenAI API errors
```bash
# Check API key is set
echo $OPENAI_API_KEY

# Or use .env file
echo "OPENAI_API_KEY=sk-..." > .env
```

### Development Issues

**Issue**: Changes not reflected after build
```bash
# Check dist/ is being updated
ls -la dist/

# Ensure you're running the built version
which edgit  # Should point to linked version

# Or run directly from dist
node dist/index.js --help
```

**Issue**: Git tags not appearing
```bash
# List all tags
git tag -l

# List edgit tags specifically
git tag -l "components/*"

# Check tag was created
git show components/my-component/v1.0.0

# Sync with remote
git fetch --tags
```

## Adding New Features

### Adding a New Command

1. **Create command file**: `src/commands/my-command.ts`

```typescript
import { Command } from './base.js';
import { GitWrapper } from '../utils/git.js';

export class MyCommand extends Command {
  private git: GitWrapper;

  constructor() {
    super();
    this.git = new GitWrapper();
  }

  async execute(args: string[]): Promise<void> {
    // Parse arguments
    const [action, ...rest] = args;

    if (this.hasOption(args, '--help') || !action) {
      this.showHelp();
      return;
    }

    // Implementation
    switch (action) {
      case 'list':
        await this.list(rest);
        break;
      case 'show':
        await this.show(rest);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async list(args: string[]): Promise<void> {
    // Implementation
  }

  private async show(args: string[]): Promise<void> {
    // Implementation
  }

  showHelp(): void {
    console.log(`
Usage: edgit my-command <action> [options]

Actions:
  list         List all items
  show <name>  Show item details

Options:
  --help       Show this help message

Examples:
  edgit my-command list
  edgit my-command show item-name
    `);
  }
}
```

2. **Register in router**: Edit `src/index.ts`

```typescript
// Import
import { MyCommand } from './commands/my-command.js';

// Add to switch statement in main()
case 'my-command':
  const myCmd = new MyCommand();
  await myCmd.execute(args);
  break;
```

3. **Update help text**: Add to `showHelp()` in `src/index.ts`

4. **Build and test**:
```bash
npm run build
edgit my-command --help
```

### Adding a New Component Type

1. **Update type definition**: `src/models/components.ts`

```typescript
export type ComponentType =
  | 'prompt'
  | 'agent'
  | 'sql'
  | 'config'
  | 'my-new-type';  // Add new type
```

2. **Add detection patterns**: `src/utils/component-detector.ts`

```typescript
const patterns: Record<ComponentType, string[]> = {
  // Existing patterns...
  'my-new-type': [
    'my-type/**/*',
    '*.mytype.*',
    // Add patterns
  ]
};
```

3. **Update documentation**: README.md and CLAUDE.md

4. **Add tests** (when test infrastructure exists)

## Release Process

### Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **Pre-1.0** (current): `0.x.y`
  - `0.X.0` - Minor versions (may include breaking changes)
  - `0.0.X` - Patch versions (backwards-compatible fixes)

- **Post-1.0** (stable): `x.y.z`
  - `X.0.0` - Major versions (breaking changes)
  - `0.Y.0` - Minor versions (new features, backwards-compatible)
  - `0.0.Z` - Patch versions (bug fixes)

### Creating a Release

```bash
# 1. Ensure all changes are committed
git status

# 2. Update version in package.json
npm version patch  # or minor, major

# 3. Build
npm run build

# 4. Test the build
npm pack
npm install -g ensemble-edge-edgit-0.0.3.tgz
edgit --version

# 5. Publish to npm
npm publish

# 6. Push tags
git push --follow-tags
```

### Pre-release Versions

```bash
# Beta release
npm version 0.1.0-beta.1
npm publish --tag beta

# Alpha release
npm version 0.1.0-alpha.1
npm publish --tag alpha
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

### Pull Request Checklist

Before submitting a PR:

- [ ] Code follows TypeScript style guide
- [ ] All new functions have JSDoc comments
- [ ] Tests added (when test framework is available)
- [ ] Documentation updated (README, CLAUDE.md)
- [ ] Build succeeds (`npm run build`)
- [ ] Commit messages follow conventional commits
- [ ] Branch is up to date with main
- [ ] PR description explains what and why

## Resources

- [Project Repository](https://github.com/ensemble-edge/edgit)
- [npm Package](https://www.npmjs.com/package/@ensemble-edge/edgit)
- [Issue Tracker](https://github.com/ensemble-edge/edgit/issues)
- [Discussions](https://github.com/ensemble-edge/edgit/discussions)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## Getting Help

- **Bug reports**: [Open an issue](https://github.com/ensemble-edge/edgit/issues/new)
- **Feature requests**: [Start a discussion](https://github.com/ensemble-edge/edgit/discussions)
- **Questions**: Check existing issues or start a discussion
- **Security issues**: See [SECURITY.md](./SECURITY.md)

---

**Happy coding!** 🚀
