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

2. **Set up local secrets (optional):**
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Edit `.dev.vars` to add your API keys (Anthropic, OpenAI, etc.)

   **Note:** This step is only needed if your members require external API keys.

3. **Run tests:**
   ```bash
   npm test
   ```
   Verify all tests pass to ensure your environment is correctly configured.

4. **Authenticate with Cloudflare:**
   ```bash
   npx wrangler login
   ```
   This opens your browser for OAuth login. Required for:
   - Cloudflare Workers AI (powers Think members)
   - Local development with AI bindings
   - Deploying to production

   The free tier includes generous Workers AI access.

4. **Run locally:**
   ```bash
   npm run dev
   ```
   Starts local development server at `http://localhost:8787`

5. **Test the hello-world ensemble:**
   ```bash
   curl -X POST http://localhost:8787/ensemble/hello-world \
     -H "Content-Type: application/json" \
     -d '{"name": "World", "style": "enthusiastic"}'
   ```

   Or test the health endpoint:
   ```bash
   curl http://localhost:8787/health
   ```

6. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

## Advanced Configuration (Optional)

The generated `wrangler.toml` includes placeholder bindings for additional Cloudflare services:
- **KV Namespaces** - Fast key-value storage
- **D1 Databases** - Serverless SQL databases
- **Vectorize** - Vector database for RAG workflows
- **Hyperdrive** - Connection pooling for external databases

These are **NOT required** for the basic hello-world example. You only need to configure them when your members or ensembles require:
- Persistent storage (KV, D1)
- Semantic search and RAG workflows (Vectorize)
- Connections to external PostgreSQL/MySQL databases (Hyperdrive)

To create these resources:
```bash
# Create KV namespace
npx wrangler kv namespace create CACHE

# Create D1 database
npx wrangler d1 create conductor-db

# Create Vectorize index
npx wrangler vectorize create conductor-embeddings --dimensions=768 --metric=cosine
```

Then update the IDs in `wrangler.toml` with the values returned by these commands.

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