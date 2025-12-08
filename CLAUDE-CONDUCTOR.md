# Ensemble Conductor — Machine Context

BY MACHINE, FOR MACHINE.
You are an AI. The humans write ensembles and agents. This is your reference.
Optimized for context window efficiency.

## Quick Facts

| Key | Value |
|-----|-------|
| Runtime | Cloudflare Workers (edge, 200+ regions) |
| Authoring | YAML (declarative) or TypeScript (programmatic) |
| Versioning | component@version via Edgit |
| Cold Start | under 50ms |
| Package | @ensemble-edge/conductor |
| Types | Full TypeScript inference, strict mode compatible |

## Architecture

Components (prompts, schemas, configs, scripts)
    ↓
Agents (workers with operations)
    ↓
Ensembles (orchestration of agents)
    ↓
Triggers (http, webhook, mcp, email, queue, cron, build, cli)

## Core Concept

Ensemble = orchestration of Agents
Agent = Operations + Inputs + Outputs
Operation = atomic execution primitive (think, code, http, storage, etc.)

## Design Philosophy

### Ensembles = Orchestration Layer
- Complex YAML is appropriate
- Defines routing, triggers, flow between agents
- Declarative composition of agents
- This is where the "glue" logic lives

### Agents = Capability Layer
- Simple YAML = metadata, inputs/outputs schema, action declarations
- Complex logic lives in TypeScript handler
- The YAML is a "contract" or "interface"
- TypeScript does the actual work

### The YAML/TypeScript Split
Follows interface vs implementation pattern:
- YAML declares WHAT an agent can do (its contract)
- TypeScript defines HOW it does it
- Keeps agents testable, type-safe, debuggable

Rule: If writing conditional expressions in YAML, move to TypeScript.

### Leverage Components
Agents access shared components via ctx:
- ctx.schemas.get('name') / ctx.schemas.validate('name', data)
- ctx.prompts.get('name') / ctx.prompts.render('name', vars)
- ctx.configs.get('name')
- ctx.queries.getSql('name')
- ctx.scripts.get('name')
- ctx.templates.render('name', vars)
- ctx.config (project ConductorConfig)

### Discovery Registries
Agents can introspect available components:
- ctx.agentRegistry.list() / ctx.agentRegistry.get('name')
- ctx.ensembleRegistry.list() / ctx.ensembleRegistry.get('name')

### Eating Our Own Dog Food
Built-in capabilities ship as catalog templates (real agents/ensembles):
- catalog/agents/system/redirect/ → agents/system/redirect/
- catalog/agents/system/docs/ → agents/system/docs/
- catalog/ensembles/system/docs/ → ensembles/system/docs/
No magic. Framework must support all use cases.

## Operations (16 types)

| Operation | Purpose | Config Keys |
|-----------|---------|-------------|
| think | LLM reasoning | provider, model, prompt, schema, temperature, maxTokens |
| code | JS/TS execution | handler: ./file.ts OR script: scripts/path |
| storage | KV/R2 access | type: kv|r2, action: get|put|delete, key |
| data | D1/Hyperdrive/Vectorize | backend: d1|hyperdrive|vectorize, binding, query|operation |
| http | HTTP requests | url, method, headers, body |
| tools | MCP tools | tool, params |
| email | Send email | to, from, subject, body |
| sms | Send SMS | to, from, body |
| html | Render HTML | template, data |
| pdf | Generate PDF | html, filename, format |
| form | Generate forms | fields, csrf |
| queue | Queue messages | action: send|consume, queue, body |
| docs | API docs | OpenAPI generation |
| transform | Data transformation | mode: value|merge|input, pick, omit, rename, defaults |
| convert | Format conversion | from: html|markdown|docx, to: html|markdown, options |
| chart | Data visualization | type: bar|line|area|pie|scatter|sparkline, data, x, y, output: svg|url|vega|html |

## Flow Control (TypeScript)

| Primitive | Signature | Purpose |
|-----------|-----------|---------|
| createEnsemble(name) | .addStep().build() | Ensemble container |
| step(name) | .agent()|.operation().input().config() | Unit of work |
| parallel(name) | .steps([...]) | Concurrent execution |
| branch(name) | .condition().then().else() | If/else |
| switchStep(name) | .value().case().default() | Multi-branch |
| foreach(name) | .items().as().step() | Iterate array |
| tryStep(name) | .try().catch() | Error handling |
| whileStep(name) | .condition().maxIterations().step() | Loop |
| mapReduce(name) | .items().map().reduce() | Map-reduce pattern |

## Lifecycle Hooks

| Hook | Trigger | Use Case |
|------|---------|----------|
| beforeExecute | Before agent runs | Logging, validation |
| afterExecute | After agent completes | Metrics, cleanup |
| onError | On agent failure | Error reporting, fallback |

## Pre-built Agents (7 types)

| Agent | Purpose | Key Inputs |
|-------|---------|------------|
| scraper | Web scraping with retries | url |
| validator | Data validation | data, schema |
| rag | Vector search + LLM | query, action: embed|search |
| hitl | Human approval flow | prompt, context |
| fetcher | HTTP with caching | url |
| transformer | Data transformation | data, template |
| scheduler | Cron execution | cron, task |

## Triggers (8 types)

| Trigger | Config | Use Case |
|---------|--------|----------|
| http | path, paths[], methods, auth, rateLimit, cors, public | Web apps, APIs with path params |
| webhook | path, methods, auth, async, public | External integrations |
| mcp | auth, public | AI tool exposure |
| email | addresses, reply_with_output | Email routing |
| queue | queue, batch_size, max_retries | Message processing |
| cron | cron, timezone, enabled | Scheduled execution |
| build | output, enabled, input, metadata | Static generation at build time |
| cli | command, description, options[] | Developer commands |

### Build Trigger (NEW)
trigger:
  - type: build
    enabled: true
    output: ./dist/docs
flow:
  - agent: docs
    input: { action: generate-openapi }

### CLI Trigger (NEW)
trigger:
  - type: cli
    command: generate-docs
    description: Generate documentation
    options:
      - name: format
        type: string
        default: yaml
      - name: output
        type: string
        required: true
flow:
  - agent: docs
    input: { format: ${trigger.options.format} }

### Multi-Path HTTP Trigger
trigger:
  - type: http
    paths:
      - path: /api/v1/users
        methods: [GET, POST]
      - path: /api/v1/users/:id
        methods: [GET, PUT, DELETE]
    public: true

## Components (7 types)

| Type | Extension | Reference Syntax | ctx Method |
|------|-----------|------------------|------------|
| schemas | .json | schemas/name@v1.0.0 | ctx.schemas.validate() |
| prompts | .md | prompts/name@latest | ctx.prompts.render() |
| configs | .json, .yaml | configs/name@production | ctx.configs.get() |
| queries | .sql | queries/name@v2 | ctx.queries.getSql() |
| scripts | .ts, .js | scripts/name@v1 | ctx.scripts.get() |
| templates | .html | templates/name@v1 | ctx.templates.render() |
| docs | .md | docs/name@v1 | - |

## Expression Syntax

### Variable Access
${input.field}                    # Ensemble/agent input
${agent-name.output}              # Agent output
${agent-name.output.nested.field} # Nested access
${state.field}                    # State variable
${env.VARIABLE}                   # Environment variable
${component.name@v1.0.0}          # Component reference
${trigger.options.format}         # CLI trigger options

### Execution Status
${agent.executed}                 # Boolean: ran
${agent.failed}                   # Boolean: errored
${agent.success}                  # Boolean: succeeded
${agent.cached}                   # Boolean: from cache
${agent.duration}                 # Number: ms

### Conditions
condition: ${input.value > 10}
condition: ${agent.failed}
condition: ${!agent.executed}
condition: ${input.type === 'premium'}
condition: ${input.age >= 18 && input.verified}

## YAML Agent Schema (with handler)

name: my-agent
operation: code
handler: ./my-handler.ts          # TypeScript implementation
description: What this agent does

schema:
  input:
    field: type
  output:
    field: type

## YAML Ensemble Schema

name: string                       # Required (filename-derived)
description: string                # Optional
trigger:                           # Optional
  - type: http|webhook|mcp|email|queue|cron|build|cli
state:                             # Optional
  schema:
    field: type
flow:                              # Required
  - name: string
    agent: string                  # OR operation
    operation: string              # OR agent
    input: { key: value }
    config: { key: value }
    condition: string
    cache: { ttl: number, key: string }
    retry: { maxAttempts: number, backoff: exponential|linear }
    timeout: number
    state: { use: [fields], set: { field: value } }
output:                            # Optional - supports conditional blocks
  key: value

## Conditional Output Blocks

output:
  # Success case
  - when: ${agent.output.found}
    status: 200
    body: { data: ${agent.output.data} }

  # Not found
  - when: ${agent.output.error === 'not_found'}
    status: 404
    body: { error: 'not_found' }

  # Redirect
  - when: ${shouldRedirect}
    redirect:
      url: ${targetUrl}
      status: 302

  # Custom headers + raw body
  - when: ${format === 'yaml'}
    status: 200
    headers:
      Content-Type: text/yaml
    rawBody: ${yamlContent}

  # Default fallback (no when = always matches)
  - status: 500
    body: { error: 'unknown' }

## Common Patterns

### Linear Pipeline
flow:
  - name: fetch
    operation: http
    config: { url: "${input.url}" }
  - name: process
    operation: code
    config: { script: scripts/process }
    input: { data: ${fetch.output} }

### Cache-or-Generate
flow:
  - name: check-cache
    operation: storage
    config: { type: kv, action: get, key: "result-${input.query}" }
  - name: generate
    condition: ${check-cache.output.value === null}
    operation: think
    config: { provider: openai, model: gpt-4o, prompt: "${input.query}" }

### Fallback Chain
flow:
  - name: try-primary
    operation: http
    config: { url: "https://primary-api.com" }
    retry: { maxAttempts: 2 }
  - name: try-backup
    condition: ${try-primary.failed}
    operation: http
    config: { url: "https://backup-api.com" }

## File Structure

project/
├── agents/                 # Reusable agents
│   ├── examples/           # Example agents (shipped with template)
│   ├── system/             # Built-in system agents
│   │   ├── redirect/       # URL redirect service
│   │   ├── docs/           # Documentation agent
│   │   ├── fetch/          # HTTP fetching agent
│   │   ├── validate/       # Validation agent
│   │   ├── slug/           # Slug generation agent
│   │   ├── tools/          # MCP tools agent
│   │   ├── queries/        # SQL query agent
│   │   └── scrape/         # Web scraping agent
│   ├── debug/              # Debug/dev agents
│   │   ├── delay/          # Add artificial delay
│   │   ├── echo/           # Echo input back
│   │   └── inspect-context/ # Inspect execution context
│   └── user/               # User-created agents
├── ensembles/              # Workflow definitions
│   ├── examples/           # Example ensembles
│   ├── system/             # Built-in system ensembles
│   ├── debug/              # Debug ensembles
│   └── user/               # User-created ensembles
├── prompts/                # Prompt templates
├── schemas/                # JSON schemas
├── configs/                # Reusable configs
├── queries/                # SQL templates
├── scripts/                # TS/JS for code operations
├── templates/              # HTML templates
├── wrangler.toml           # Cloudflare config
└── .dev.vars               # Local secrets (gitignored)

## CLI Quick Reference

```bash
ensemble conductor init [name]    # Create project (use --yes for CI)
ensemble conductor validate       # Validate YAML/TS

# Project commands (pnpm/npm)
pnpm run dev                      # Local dev server
pnpm run build                    # Build project
pnpm test                         # Run tests
npx wrangler deploy               # Deploy to CF Workers
```

## Common Mistakes

| Don't | Do |
|-------|-----|
| Inline JS in YAML | Use handler: ./file.ts or script: scripts/path |
| Hardcode secrets | Use ${env.SECRET} |
| Skip error handling | Use tryStep() or condition: ${x.failed} |
| Create mega-ensembles | Compose via agents |
| Forget cache | Add cache: { ttl: 3600 } to expensive ops |
| HTTP trigger without auth | Add public: true or auth config |

## Provider Models (think operation)

| Provider | Models |
|----------|--------|
| openai | gpt-4o, gpt-4o-mini, text-embedding-3-small |
| anthropic | claude-3-5-sonnet-20241022, claude-sonnet-4 |
| workers-ai | @cf/meta/llama-3.1-8b-instruct, @cf/meta/llama-3-8b-instruct |
| groq | llama3-70b-8192, mixtral-8x7b-32768 |

## Think Agent Schema Output Mapping

For inline think agents, use schema.output to map AI response to named fields:

```yaml
agents:
  - name: greet
    operation: think
    config:
      provider: workers-ai
      model: "@cf/meta/llama-3.1-8b-instruct"
      temperature: 0.7
    schema:
      output:
        greeting: string    # AI response maps to this field
    prompt: "Generate a friendly greeting for ${input.name}"

output:
  message: ${greet.output.greeting}  # Access via schema field name
  model: ${greet.output._meta.model} # Metadata available via _meta
```

## Workers AI Local Development

For local dev with Workers AI, configure wrangler.toml:

```toml
account_id = "your-account-id"  # Required for remote binding

[ai]
binding = "AI"
remote = true  # Required for local dev
```

Add CLOUDFLARE_API_TOKEN to .dev.vars for authentication.

Machine context ends. The humans thank you for building their ensembles.
