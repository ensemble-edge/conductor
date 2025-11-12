# Conductor Starter Project

This is an example project showing how to use `@ensemble-edge/conductor` to build AI orchestration workflows on Cloudflare Workers.

## Project Structure

```
my-conductor-project/
├── src/
│   └── index.ts           # Worker entry point
├── agents/               # Your AI agents (sacred user space)
│   └── greet/
│       ├── agent.yaml    # Agent configuration
│       └── index.ts       # Agent implementation
├── ensembles/             # Your workflows (sacred user space)
│   └── hello-world.yaml   # Example ensemble
├── wrangler.toml          # Cloudflare configuration
├── package.json
└── tsconfig.json
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

3. **Test the hello-world ensemble:**
   ```bash
   curl -X POST http://localhost:8787/ensemble/hello-world \
     -H "Content-Type: application/json" \
     -d '{"name": "World"}'
   ```

4. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

## Creating New Members

Create a new agent in `agents/your-agent/`:

```yaml
# agents/your-agent/agent.yaml
name: your-agent
type: Function  # or Think, Data, API
description: What your agent does

schema:
  input:
    param: string
  output:
    result: string
```

```typescript
// agents/your-agent/index.ts
export default async function yourMember({ input }) {
  return {
    result: `Processed: ${input.param}`
  };
}
```

## Creating New Ensembles

Create a new ensemble in `ensembles/your-ensemble.yaml`:

```yaml
name: your-ensemble
description: What your ensemble does

flow:
  - agent: your-agent
    input:
      param: ${input.value}

output:
  result: ${your-agent.output.result}
```

## Learn More

- [Conductor Documentation](https://github.com/ensemble-edge/conductor)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
