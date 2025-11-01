# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with code in this repository.

## ⚠️ Important: Local Planning Directory

**When creating planning documents, phase summaries, TODO lists, or any working notes, ALWAYS place them in the `.planning/` directory.**

The `.planning/` directory is organized into three areas:

### `.planning/strategy/` - Strategic Planning
Long-term planning and project direction:
- Phase summaries: `PHASE0_SUMMARY.md`, `PHASE1_SUMMARY.md`, etc.
- Project checkpoints: `CHECKPOINT.md`
- Roadmaps and vision documents

### `.planning/todos/` - Task Management
Day-to-day tactical tasks:
- Current work items: `current-tasks.md`
- Backlog: `backlog.md`
- Bug tracking and quick action items

### `.planning/standards/` - Reference Materials
Reusable guidelines and checklists:
- Code review standards
- Architecture decision records (ADRs)
- Development guidelines

**Do NOT create these files in the project root or src/ directory.**

See [.planning/README.md](.planning/README.md) for full details.

## Development Commands

### Setup and Build
- `npm install` - Install dependencies (required first step)
- `npm run build` - Build TypeScript to JavaScript (outputs to `dist/`)
- `npm run dev` - Build and run in development mode
- `npm run prepublishOnly` - Build before publishing (runs automatically)

### Testing
⚠️ **Current State**: No test framework configured yet
- `npm test` - Currently just echoes "tests pass" (placeholder)
- **TODO**: Jest/Vitest setup needed
- **TODO**: Integration tests for Git operations
- **TODO**: Unit tests for utilities

### Code Quality
⚠️ **Current State**: No linting/formatting configured yet
- **TODO**: ESLint setup needed
- **TODO**: Prettier configuration needed
- TypeScript strict mode IS enabled (`tsconfig.json`)

### Git Operations
```bash
# This is a Git wrapper CLI - all commands interact with Git
git status         # Check repo state
git tag -l         # List all tags (edgit creates tags under components/*)
git log --oneline  # View commit history
```

## Git Commit Standards

### Commit Message Format
All commits must follow Conventional Commits format WITHOUT any AI attribution:

- **NEVER** append "code written by claude" or similar attribution to commit messages
- **NEVER** add signatures, author notes, or "written by" suffixes
- Use clean, professional commit messages focusing only on the changes

### Correct Format:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Examples:
✅ CORRECT:
- `feat: add error handling to API endpoints`
- `fix: resolve memory leak in component registry`
- `docs: update development guide`
- `refactor: extract shared utilities`

❌ INCORRECT:
- `feat: add API endpoints - code written by claude`
- `fix: bug fix (written by Claude)`
- Any commit with attribution or signatures

### Commit Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

## Architecture Overview

**Edgit** is a Git tag-based component versioning system for AI workflows. It treats Git tags as "portals" to different component versions, eliminating merge conflicts while enabling independent component versioning.

### Core Philosophy

1. **Git Tags as Source of Truth**: All versioning lives in Git tags, not tracked files
2. **Zero Merge Conflicts**: No version data in repository files means no conflicts
3. **Component Independence**: Each component (prompt, agent, SQL, config) versions independently
4. **Immutable Versions**: Version tags (v1.0.0) are immutable; deployment tags (prod) can move

### Project Structure

```
edgit/
├── src/
│   ├── index.ts                 # CLI entry point, command routing
│   ├── commands/                # Command handlers
│   │   ├── base.ts             # Base Command class
│   │   ├── init.ts             # Repository initialization
│   │   ├── commit.ts           # AI-powered commits
│   │   ├── tag.ts              # Tag management
│   │   ├── deploy.ts           # Deployment operations
│   │   ├── components.ts       # Component management
│   │   └── ...                 # Other commands
│   ├── utils/                   # Core utilities
│   │   ├── git.ts              # GitWrapper class
│   │   ├── git-tags.ts         # Tag operations
│   │   ├── component-detector.ts  # File pattern detection
│   │   ├── ai-commit.ts        # OpenAI integration
│   │   └── ...                 # Other utilities
│   ├── models/                  # Type definitions
│   │   └── components.ts       # Component types
│   └── types/                   # Additional types
├── dist/                        # Build output (JS, maps, declarations)
├── .edgit/                      # Edgit metadata (created by init)
│   ├── components.json         # Component registry (path + type only)
│   └── config.json             # Configuration
└── package.json
```

### Key Components

#### 1. **GitWrapper** (`src/utils/git.ts`)
- Wraps `child_process` for Git operations
- Provides both passthrough and structured Git commands
- Handles error output and exit codes

#### 2. **Component Detection** (`src/utils/component-detector.ts`)
- Pattern-based file detection
- Supports: prompts, agents, SQL queries, configs
- Collision detection and name generation

#### 3. **Git Tag Manager** (`src/utils/git-tags.ts`)
- Creates/moves/deletes Git tags
- Manages tag namespace: `components/<name>/<version>`
- Handles version tags (immutable) vs deployment tags (mutable)

#### 4. **Command System**
- Mix of class-based (extending `Command`) and functional approaches
- Commands receive parsed arguments and execute operations
- Help text and error handling per command

#### 5. **AI Commit** (`src/utils/ai-commit.ts`)
- OpenAI API integration for commit messages
- Analyzes diffs and generates conventional commit messages
- Falls back to manual input if API unavailable

### Data Flow

```
1. User runs: edgit tag create my-prompt v1.0.0
2. CLI parses arguments → routes to TagCommand
3. TagCommand loads component registry (.edgit/components.json)
4. Validates component exists and version is valid semver
5. GitWrapper creates Git tag: components/my-prompt/v1.0.0
6. Tag points to current HEAD SHA
7. User can now: git show components/my-prompt/v1.0.0
```

### Tag Namespace Design

```bash
# Version tags (immutable - semantic versioning)
components/my-prompt/v1.0.0
components/my-prompt/v1.1.0
components/data-agent/v2.0.0

# Deployment tags (mutable - can point to different versions)
components/my-prompt/prod     → points to v1.0.0
components/my-prompt/staging  → points to v1.1.0
components/data-agent/prod    → points to v2.0.0
```

## Development Guidelines

### Current Code Patterns

#### Command Pattern (Recommended for new commands)
```typescript
// src/commands/example.ts
import { Command } from './base.js';

export class ExampleCommand extends Command {
  async execute(args: string[]): Promise<void> {
    if (this.hasOption(args, '--help')) {
      this.showHelp();
      return;
    }

    // Implementation
  }

  showHelp(): void {
    console.log('Help text...');
  }
}
```

#### Functional Pattern (Used in some commands)
```typescript
// src/commands/example.ts
export async function exampleCommand(args: string[]): Promise<void> {
  // Direct implementation
}
```

**Recommendation**: Prefer Command class pattern for consistency and testability.

### Error Handling

⚠️ **Current State**: Inconsistent error handling
- Some commands throw errors (caught in main())
- Some use process.exit(1)
- Error messages manually formatted

**TODO**: Implement custom error types:
```typescript
// Needed: src/lib/errors/types.ts
class EdgitError extends Error {
  constructor(message: string, public code: string, public suggestions: string[]) {}
}

class ComponentNotFoundError extends EdgitError {
  constructor(componentName: string, available: string[]) {
    super(`Component '${componentName}' not found`, 'COMPONENT_NOT_FOUND', [...suggestions]);
  }
}
```

### TypeScript Conventions

- **Strict mode enabled** - No implicit any, strict null checks
- **ES Modules** - Use `.js` extensions in imports (required for ESM)
- **Node types** - `@types/node` available
- **Explicit return types** - Preferred for public functions
- **Interface over type** - Use `interface` for object shapes

### Git Operations

#### Always use GitWrapper
```typescript
// ✅ Good
import { GitWrapper } from '../utils/git.js';
const git = new GitWrapper();
await git.exec(['tag', '-l']);

// ❌ Bad - don't call git directly
import { exec } from 'child_process';
exec('git tag -l'); // Don't do this
```

#### Tag Operations
```typescript
import { GitTagManager } from '../utils/git-tags.js';

const tagManager = new GitTagManager();
await tagManager.createVersionTag('my-component', 'v1.0.0');
await tagManager.createDeploymentTag('my-component', 'prod', 'v1.0.0');
```

### Version Control

- Follow Conventional Commits strictly
- Keep commits atomic and focused
- Write commit messages in imperative mood
- No AI attribution in any git operations
- See [Git Commit Standards](#git-commit-standards) section for detailed requirements

### Component Detection

Components are detected by file patterns:

```typescript
// Prompt patterns
'prompts/**/*', '*.prompt.md', 'instructions/**/*', 'templates/**/*'

// Agent patterns
'agents/**/*', 'scripts/**/*.{js,ts,py,sh,bash}', '*.agent.*'

// SQL patterns
'queries/**/*', 'sql/**/*', 'database/**/*', '*.sql', '*.query.*'

// Config patterns
'configs/**/*', 'config/**/*', 'settings/**/*', '*.config.*', '*.{yaml,yml,json,toml,ini}'
```

## Common Tasks

### Adding a New Command

1. **Create command file**: `src/commands/my-command.ts`
2. **Extend Command class or create function**
3. **Add command to index.ts router** (in main switch statement)
4. **Add help text** to showHelp() function
5. **Update README.md** with new command

Example:
```typescript
// src/commands/my-command.ts
import { Command } from './base.js';

export class MyCommand extends Command {
  async execute(args: string[]): Promise<void> {
    if (this.hasOption(args, '--help')) {
      this.showHelp();
      return;
    }

    // Implementation
    const [firstArg] = args;
    console.log(`Processing: ${firstArg}`);
  }

  showHelp(): void {
    console.log(`
Usage: edgit my-command [options]

Description of what this command does.

Options:
  --help    Show this help message
    `);
  }
}
```

```typescript
// src/index.ts - Add to switch statement
case 'my-command':
  const myCmd = new MyCommand();
  await myCmd.execute(args);
  break;
```

### Adding a New Component Type

1. **Update component detector** patterns in `src/utils/component-detector.ts`
2. **Add type** to `ComponentType` in `src/models/components.ts`
3. **Update README** with new patterns
4. **Add tests** (when test infrastructure exists)

### Working with Git Tags

```typescript
// List tags for a component
const tagManager = new GitTagManager();
const tags = await tagManager.listVersionTags('my-component');

// Create immutable version tag
await tagManager.createVersionTag('my-component', 'v1.0.0');

// Create/move deployment tag
await tagManager.createDeploymentTag('my-component', 'prod', 'v1.0.0');

// Delete tag
await tagManager.deleteTag('my-component', 'v1.0.0');
```

### AI Commit Integration

```typescript
import { generateCommitMessage } from '../utils/ai-commit.js';

// Generate AI commit message from diff
const diff = await git.exec(['diff', '--cached']);
const message = await generateCommitMessage(diff.stdout);

// Fallback if API unavailable
if (!process.env.OPENAI_API_KEY) {
  console.log('⚠️  No OpenAI API key, using manual commit');
  // Prompt user for message
}
```

## Testing Strategy

### Current State
⚠️ **No tests implemented yet**

### Planned Approach

1. **Test Framework**: Jest or Vitest
2. **Test Structure**:
   ```
   tests/
   ├── unit/
   │   ├── utils/
   │   └── models/
   ├── integration/
   │   └── commands/
   ├── fixtures/
   │   └── sample-repos/
   └── helpers/
       ├── git-test-repo.ts
       └── mock-filesystem.ts
   ```

3. **Key Test Areas**:
   - Git operations (mocked)
   - Component detection
   - Tag creation/management
   - Command parsing
   - Error handling

4. **Test Utilities Needed**:
   - Mock Git wrapper
   - Temporary repo creation
   - Fixture components
   - Snapshot testing for output

## Known Issues & TODOs

### Critical
- [ ] No test infrastructure
- [ ] No error type system
- [ ] Inconsistent error handling patterns
- [ ] No ESLint/Prettier configuration

### High Priority
- [ ] Component name collision handling could be improved
- [ ] GitWrapper should support dependency injection (currently creates instances)
- [ ] AI commit timeout is hardcoded (10s)
- [ ] No validation before destructive operations

### Medium Priority
- [ ] Registry could be cached in memory
- [ ] Component detection is O(n) on all files
- [ ] No progress indicators for long operations
- [ ] Limited logging/debug mode

### Documentation
- [ ] JSDoc comments sparse in utilities
- [ ] No architecture decision records (ADRs)
- [ ] No API documentation
- [ ] Examples directory is empty

## Troubleshooting

### Build Issues
```bash
# Clean build
rm -rf dist/
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

### Git Tag Issues
```bash
# List all edgit tags
git tag -l "components/*"

# Show tag details
git show components/my-prompt/v1.0.0

# Delete local tag
git tag -d components/my-prompt/v1.0.0

# Sync with remote
git fetch --tags
git push --tags
```

### Component Registry Issues
```bash
# Registry file location
cat .edgit/components.json

# Reinitialize (force)
edgit init --force

# Manually inspect Git tags
git tag -l "components/*" | sort
```

### AI Commit Issues
```bash
# Check API key
echo $OPENAI_API_KEY

# Use in .env file (recommended)
echo "OPENAI_API_KEY=sk-..." > .env

# Skip AI and use manual message
edgit commit -m "manual message"
```

## Integration with Other Tools

### CI/CD
```yaml
# GitHub Actions example
- name: Install edgit
  run: npm install -g @ensemble-edge/edgit

- name: Check components
  run: edgit components list

- name: Create version tag
  run: edgit tag create my-component v${{ github.run_number }}.0.0

- name: Deploy to staging
  run: edgit deploy set my-component v${{ github.run_number }}.0.0 --to staging
```

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Validate component changes
edgit discover scan --validate
```

### VSCode
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "edgit: tag version",
      "type": "shell",
      "command": "edgit tag create ${input:component} ${input:version}"
    }
  ]
}
```

## Project Context

### Business Domain
Edgit solves the "AI component multiverse problem" where:
- AI systems have dozens of independently-evolving components
- Traditional monorepos force components to share one version number
- Edge deployment needs component-level version control
- Developers need to access any historical version instantly

### Key Innovation
Using Git tags as "portals" to component versions instead of:
- Version files (cause merge conflicts)
- Separate repositories (lose monorepo benefits)
- Custom databases (adds complexity)

### Target Users
- AI/ML engineers managing prompts and agents
- Platform teams deploying to edge infrastructure
- Teams using monorepos but needing component independence
- Anyone versioning AI components (prompts, configs, queries)

## Resources

- [Repository](https://github.com/ensemble-edge/edgit)
- [README](./README.md) - User-facing documentation
- [CONTRIBUTING](./CONTRIBUTING.md) - Contribution guidelines
- [Issues](https://github.com/ensemble-edge/edgit/issues)
