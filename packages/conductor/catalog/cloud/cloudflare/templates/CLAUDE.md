# Conductor Project Context

This document provides context for AI assistants (Claude, Copilot, etc.) working on this Conductor project.

## Project Overview

This is a Conductor orchestration system built on Cloudflare Workers. Conductor enables you to build AI-powered workflows by composing reusable "agents" (AI agents, functions, APIs) into "ensembles" (workflows).

## Project Structure

```
.
├── src/
│   ├── index.ts              # Worker entry point (fetch/scheduled handlers)
│   └── lib/                  # Shared utilities
├── agents/                  # Reusable workflow components
│   ├── greet/                # Example: greeting agent
│   │   ├── agent.yaml       # Agent configuration
│   │   └── index.ts          # Optional: custom logic
│   └── docs-writer/          # Example: AI documentation writer
├── ensembles/                # Workflow definitions
│   ├── hello-world.yaml      # Simple greeting workflow
│   └── parallel-workflow.yaml # Parallel execution example
├── prompts/                  # AI prompt templates
│   └── hello.md           # Used by greet agent
├── configs/                  # Agent configurations
│   └── hello-settings.yaml   # Settings for greet agent
├── tests/                    # Test files
│   └── hello-world.test.ts   # Ensemble tests
├── wrangler.toml             # Cloudflare Workers config
└── types.d.ts                # Global TypeScript declarations

```

## Key Concepts

### Members
Individual components that do one thing well:
- **Think**: AI-powered reasoning (uses prompts from `prompts/`)
- **Function**: Custom JavaScript/TypeScript logic
- **API**: HTTP requests to external services
- **Data**: Storage operations (KV, D1, R2)
- **Built-in**: Scraping, RAG, validation, HITL, etc.

### Ensembles
Workflows that compose agents together:
- Define execution flow in YAML
- Support sequential and parallel execution
- Handle state management
- Enable conditional logic

## Common Tasks

### Adding a New Agent

1. Create directory: `agents/my-agent/`
2. Create config: `agents/my-agent/agent.yaml`
   ```yaml
   name: my-agent
   type: think  # or function, api, data
   description: What this agent does
   config:
     # Agent-specific config
   ```
3. (Optional) Add custom logic: `agents/my-agent/index.ts`
4. (For Think agents) Add prompt: `prompts/my-prompt.md`

### Creating an Ensemble

1. Create YAML: `ensembles/my-workflow.yaml`
   ```yaml
   name: my-workflow
   description: What this workflow does
   flow:
     - agent: agent-1
       input:
         key: value
     - agent: agent-2
       input:
         data: ${agent-1.output.result}
   ```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test hello-world.test.ts

# Watch mode
pnpm run test:watch
```

### Deployment

```bash
# Deploy to Cloudflare
pnpm run deploy

# Set production secrets
wrangler secret put ANTHROPIC_API_KEY
```

## Important Files

- **[wrangler.toml](wrangler.toml)**: Cloudflare Workers configuration, bindings, triggers
- **[types.d.ts](types.d.ts)**: Global types for YAML imports and Env interface
- **[src/index.ts](src/index.ts)**: Main worker with fetch/scheduled handlers
- **[.dev.vars](.dev.vars)**: Local development secrets (not committed)

## State Management

Conductor supports stateful workflows:
- Define state schema in ensemble YAML
- Access via `${state.key}` interpolation
- Persist across workflow steps
- Backed by Durable Objects

## AI Providers

Supported providers (configured in agent.yaml):
- **Anthropic**: Claude models (default)
- **OpenAI**: GPT models
- **Cloudflare**: Workers AI (env.AI binding)
- **Custom**: Your own AI endpoint

## Interpolation Syntax

Reference data in ensemble YAML:
- `${input.key}` - Input data
- `${state.key}` - Workflow state
- `${agent-name.output.key}` - Previous agent output

## Common Patterns

### Sequential Flow
```yaml
flow:
  - agent: step-1
  - agent: step-2
    input:
      data: ${step-1.output}
```

### Parallel Execution
```yaml
flow:
  - agent: task-1
  - agent: task-2  # Runs in parallel with task-1
  - agent: task-3  # Runs in parallel with task-1 and task-2
```

### Conditional Execution
```yaml
flow:
  - agent: check
  - agent: action
    condition: ${check.output.shouldRun}
```

## Getting Help

- **Conductor Docs**: https://docs.ensemble-edge.com/conductor
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

## Development Tips

1. **Local Testing**: Use `wrangler dev` for local development
2. **Hot Reload**: Changes auto-reload in dev mode
3. **Logging**: Use `console.log()` - visible in wrangler output
4. **Debugging**: Check `.wrangler/tmp/` for build artifacts
5. **Type Safety**: Run `pnpm run cf-typegen` to generate Cloudflare types

## Architecture Notes

- **Edge-Native**: Runs on Cloudflare's global network
- **Zero Cold Starts**: V8 isolates, not containers
- **Durable Objects**: Used for state persistence and HITL
- **Event-Driven**: Supports webhooks, cron, and HTTP triggers
