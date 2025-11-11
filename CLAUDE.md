# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and other AI assistants when working with code in this repository.

---

# 🚨 CRITICAL: RELEASE WORKFLOW - READ THIS FIRST 🚨

## ❌ WHEN PUSH IS REJECTED: NEVER PULL, REBASE, OR TRY TO FIX CONFLICTS

When `git push` is rejected because remote has new commits, **THIS MEANS A NEW RELEASE WAS JUST PUBLISHED**.

### ✅ CORRECT Workflow When Push Rejected:

1. **Reset to origin/master** (get the new release):
   ```bash
   git fetch
   git reset --hard origin/master
   ```

2. **Re-apply your changes manually** (don't cherry-pick - causes conflicts)

3. **Create NEW changeset** for your changes:
   ```bash
   cat > .changeset/fix-name.md << 'EOF'
   ---
   "@ensemble-edge/conductor": patch
   ---
   Description of your fix
   EOF
   ```

4. **Commit and push**:
   ```bash
   git add -A
   git commit -m "fix: your fix description"
   git push  # This will now work
   ```

### ❌ NEVER DO THESE THINGS:
- ❌ **DO NOT run `git pull`** - This creates merge commits
- ❌ **DO NOT run `git rebase`** - This rewrites history
- ❌ **DO NOT run `git cherry-pick`** - Causes changeset conflicts
- ❌ **DO NOT try to "fix" version conflicts**
- ❌ **DO NOT manually edit package.json version**
- ❌ **DO NOT manually edit CHANGELOG.md**
- ❌ **DO NOT create git tags yourself**
- ❌ **DO NOT run `npm run version-packages` locally**
- ❌ **DO NOT run `npm run release` locally**

### ✅ CORRECT Release Workflow (Normal Case):

1. **Create changeset file** in `.changeset/`:
   ```bash
   cat > .changeset/my-feature.md << 'EOF'
   ---
   "@ensemble-edge/conductor": minor
   ---
   Description of changes
   EOF
   ```

2. **Commit changes + changeset**:
   ```bash
   git add -A
   git commit -m "feat: description"
   ```

3. **Push** (GitHub Actions handles everything else):
   ```bash
   git push
   ```

4. **GitHub Actions will automatically**:
   - Detect changeset
   - Run tests and build
   - Run `changeset version` to bump version
   - Update CHANGELOG.md
   - Commit and tag the new version
   - Publish to npm
   - Create GitHub release

### Why This Matters:

**This happened 25+ times in one session because I kept forgetting this workflow.**

Every time I tried to "fix" a rejected push by pulling or rebasing, I created conflicts and wasted hours. The correct approach is simple: reset to the new release, manually re-apply changes, create a new changeset, and push.

---

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
- `npm run deploy` - Deploy to Cloudflare Workers

### Testing
⚠️ **Current State**: Test framework being developed
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Code Quality
- **TypeScript** - Strict mode enabled (`tsconfig.json`)
- **ESLint** - Linting for code quality
- **Prettier** - Code formatting

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
- `feat: add agent orchestration support`
- `fix: resolve workflow execution timeout`
- `docs: update deployment guide`
- `refactor: extract shared runtime utilities`

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

**Conductor** is an edge orchestration runtime for agent workflows. It runs on Cloudflare Workers and coordinates AI agents, tool execution, and workflow management across edge locations.

### Core Philosophy

1. **Edge-First Runtime**: Built for Cloudflare Workers edge infrastructure
2. **Agent Orchestration**: Coordinates multiple AI agents and their interactions
3. **Workflow Management**: Defines and executes complex agent workflows
4. **Tool Integration**: Connects agents to external tools and APIs

### Project Structure

```
conductor/
├── src/
│   ├── index.ts                 # Cloudflare Workers entry point
│   ├── runtime/                 # Core runtime engine
│   ├── agents/                  # Agent management
│   ├── workflows/               # Workflow execution
│   ├── tools/                   # Tool integration
│   └── utils/                   # Shared utilities
├── dist/                        # Build output (Workers bundle)
├── wrangler.toml               # Cloudflare Workers configuration
└── package.json
```

### Key Components

#### 1. **Runtime Engine**
- Executes on Cloudflare Workers edge network
- Manages agent lifecycle and state
- Handles workflow orchestration

#### 2. **Agent System**
- Defines agent behaviors and capabilities
- Manages agent interactions and communication
- Integrates with AI models (OpenAI, Anthropic, etc.)

#### 3. **Workflow Engine**
- Defines multi-step agent workflows
- Handles branching, looping, and conditional logic
- Manages workflow state and persistence

#### 4. **Tool Integration**
- Connects agents to external APIs and services
- Provides standard tool interfaces
- Handles authentication and rate limiting

## Development Guidelines

### TypeScript Conventions

- **Strict mode enabled** - No implicit any, strict null checks
- **ES Modules** - Use `.js` extensions in imports (required for ESM)
- **Node types** - `@types/node` and `@cloudflare/workers-types` available
- **Explicit return types** - Preferred for public functions
- **Interface over type** - Use `interface` for object shapes

### Version Control

- Follow Conventional Commits strictly
- Keep commits atomic and focused
- Write commit messages in imperative mood
- No AI attribution in any git operations
- See [Git Commit Standards](#git-commit-standards) section for detailed requirements

## Release Process

### Automated Release Workflow

This repository uses an automated release workflow powered by [Changesets](https://github.com/changesets/changesets). Version bumping, tagging, and npm publishing are fully automated via GitHub Actions.

#### How to Release

**Step 1: Create a Changeset** (manual)
```bash
cd /workspace/ensemble/conductor
npx changeset add
```

You'll be prompted to:
- Select the bump type (patch/minor/major)
- Write a description of the changes

This creates a markdown file in `.changeset/` documenting your changes.

**Step 2: Commit and Push** (triggers automation)
```bash
git add .changeset/
git commit -m "feat: add new feature X"
git push
```

**Step 3: Automation Takes Over** (GitHub Actions)

Once you push to main/master, the release workflow automatically:
1. ✅ Runs tests, lint, typecheck, and build
2. ✅ Detects changeset exists
3. ✅ Runs `changeset version` (bumps package.json, updates CHANGELOG.md)
4. ✅ Rebuilds with new version
5. ✅ Commits with message: `chore: release v1.2.0`
6. ✅ Creates git tag: `v1.2.0`
7. ✅ Pushes commit and tag to GitHub
8. ✅ Publishes to npm automatically

#### Complete Example

```bash
# Create changeset for a new feature
npx changeset add
# → Select: minor
# → Description: "Add email batch sending support"

# Commit and push
git add .changeset/
git commit -m "feat: add batch email sending"
git push

# GitHub Actions does the rest!
# → Version bumps to 1.2.0
# → Publishes to npm
# → Done! 🎉
```

#### Notes
- No manual version bumps needed
- No manual tagging needed
- No manual `npm publish` needed
- Just create the changeset and push!

### Deploying to Cloudflare Workers

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Test locally with wrangler
npx wrangler dev
```

### Adding a New Agent

1. **Create agent definition** in `src/agents/`
2. **Register agent** with runtime
3. **Add tests** for agent behavior
4. **Update documentation**

### Adding a New Workflow

1. **Define workflow** in `src/workflows/`
2. **Configure workflow steps**
3. **Add error handling**
4. **Test workflow execution**

## Testing Strategy

### Test Structure
```
tests/
├── unit/
│   ├── agents/
│   ├── workflows/
│   └── utils/
├── integration/
│   └── runtime/
└── fixtures/
    └── sample-workflows/
```

### Key Test Areas
- Agent execution
- Workflow orchestration
- Tool integration
- Runtime behavior
- Error handling

## Known Issues & TODOs

### Critical
- [ ] Initial development in progress
- [ ] Core runtime architecture being finalized
- [ ] Agent system design in development

### High Priority
- [ ] Workflow engine implementation
- [ ] Tool integration framework
- [ ] Edge deployment configuration
- [ ] State management strategy

### Medium Priority
- [ ] Performance optimization for edge
- [ ] Logging and observability
- [ ] Rate limiting and quotas
- [ ] Error recovery mechanisms

### Documentation
- [ ] Architecture documentation
- [ ] Agent development guide
- [ ] Workflow creation guide
- [ ] Deployment guide

## Project Context

### Business Domain
Conductor solves the edge orchestration problem where:
- AI agents need to coordinate complex workflows
- Edge deployment requires distributed execution
- Multiple agents must work together seamlessly
- Workflows need to be reliable and observable

### Key Innovation
Running agent orchestration on Cloudflare Workers edge network:
- Low latency execution worldwide
- Scalable and cost-effective
- Integrated with edge infrastructure
- Native support for distributed state

### Target Users
- AI/ML engineers building agent systems
- Platform teams deploying edge applications
- Teams building distributed AI workflows
- Developers integrating multiple AI services

## Resources

- [Repository](https://github.com/ensemble-edge/conductor)
- [README](./README.md) - User-facing documentation
- [CONTRIBUTING](../CONTRIBUTING.md) - Contribution guidelines
- [Documentation](https://docs.ensemble.ai/conductor)
