# Conductor Starter Project

This is an example project showing how to use `@ensemble-edge/conductor` to build AI orchestration workflows on Cloudflare Workers.

## Project Structure

```
my-conductor-project/
├── src/
│   └── index.ts           # Worker entry point
├── members/               # Your AI members (sacred user space)
│   └── greet/
│       ├── member.yaml    # Member configuration
│       └── index.ts       # Member implementation
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

Create a new member in `members/your-member/`:

```yaml
# members/your-member/member.yaml
name: your-member
type: Function  # or Think, Data, API
description: What your member does

schema:
  input:
    param: string
  output:
    result: string
```

```typescript
// members/your-member/index.ts
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
  - member: your-member
    input:
      param: ${input.value}

output:
  result: ${your-member.output.result}
```

## Learn More

- [Conductor Documentation](https://github.com/ensemble-edge/conductor)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
