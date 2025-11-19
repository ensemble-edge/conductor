# Documentation Tools

**Conductor's built-in documentation infrastructure**

These agents help you auto-generate and maintain documentation for your codebase. They're production-ready tools, not examples!

---

## Available Documentation Agents

### 1. Simple Docs (`docs-simple.yaml`)

**Purpose**: Basic API documentation with minimal configuration

**Access**: `GET /docs-simple`

**Best for**: Quick documentation needs, small projects

**Configuration**:
```yaml
name: docs-simple
operation: docs
# Auto-discovers and documents your API endpoints
```

---

### 2. Public Docs (`docs-public.yaml`)

**Purpose**: Public-facing API documentation

**Access**: `GET /docs-public`

**Best for**: Public APIs, external developers, open documentation

**Configuration**:
```yaml
name: docs-public
operation: docs
auth: none  # No authentication required
```

---

### 3. Authenticated Docs (`docs-authenticated.yaml`)

**Purpose**: Documentation for authenticated users only

**Access**: `GET /docs-authenticated` (with auth token)

**Best for**: Partner APIs, internal tools requiring login

**Configuration**:
```yaml
name: docs-authenticated
operation: docs
auth: required  # Authentication required
```

---

### 4. Admin Docs (`docs-admin.yaml`)

**Purpose**: Admin-only API documentation (sensitive endpoints)

**Access**: `GET /docs-admin` (requires admin privileges)

**Best for**: Administrative endpoints, internal operations, sensitive APIs

**Configuration**:
```yaml
name: docs-admin
operation: docs
auth: admin  # Admin role required
```

---

### 5. AI Documentation Writer (`docs-writer/`)

**Purpose**: AI-powered documentation generation from code

**How it works**:
1. Analyzes your codebase structure
2. Uses AI to write clear, helpful descriptions
3. Generates examples and usage patterns
4. Maintains consistent documentation style

**Configuration**:
```yaml
name: docs-writer
operation: think  # Uses AI model
model: @cf/meta/llama-3.1-8b-instruct

input:
  codebase_path: ./src
  style: conversational  # or: technical, beginner-friendly
  include_examples: true
```

**Requirements**: Cloudflare Workers AI binding

**Best for**: Generating initial docs, maintaining large codebases

---

### 6. Searchable Docs (`docs-search/`)

**Purpose**: Vector-powered documentation search

**How it works**:
1. Indexes your documentation using vector embeddings
2. Enables semantic search (not just keyword matching)
3. Returns relevant docs even with fuzzy queries
4. Ranks results by relevance

**Configuration**:
```yaml
name: docs-search
operation: data
vectorize: true  # Requires Vectorize binding

input:
  query: string  # Search query
  limit: 10      # Max results
```

**Access**: `POST /docs-search` with `{"query": "how to authenticate"}`

**Requirements**: Cloudflare Vectorize binding

**Best for**: Large documentation sets, complex APIs, better UX

---

## Getting Started

### 1. Choose Your Docs Type

Start with `docs-simple.yaml` for basic needs:

```bash
# Already configured at /docs-simple
curl http://localhost:8787/docs-simple
```

### 2. Configure Authentication (Optional)

Update `docs-authenticated.yaml` or `docs-admin.yaml` to match your auth system:

```yaml
auth:
  type: bearer  # or: basic, api-key
  required: true
  roles: [admin]  # for admin docs
```

### 3. Add AI Writer (Optional)

For AI-powered docs, ensure Workers AI is bound:

```toml
# wrangler.toml
[ai]
binding = "AI"
```

Then use `docs-writer` agent to generate content.

### 4. Enable Search (Optional)

For vector search, add Vectorize binding:

```toml
# wrangler.toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "docs-index"
```

Then use `docs-search` agent for semantic search.

---

## Configuration Patterns

### Custom Documentation Paths

```yaml
# agents/docs/api-v2.yaml
name: api-v2-docs
operation: docs
path: /api/v2/docs  # Custom path
```

### Multiple Doc Sets

Create separate configs for different audiences:

```
agents/docs/
├── customer-facing.yaml    # External customers
├── partner-api.yaml        # Partners/integrators
├── internal-tools.yaml     # Internal developers
└── admin-panel.yaml        # Administrators
```

### Documentation Metadata

```yaml
name: docs-public
operation: docs

metadata:
  title: "My API Documentation"
  version: "2.0"
  description: "Complete API reference"
  contact: api@mycompany.com
```

---

## Integration with Your Workflow

### Auto-Generate on Deploy

```bash
# In your CI/CD pipeline
npm run build
conductor generate-docs --output ./docs
npm run deploy
```

### Documentation Ensemble

Create `ensembles/auto-docs.yaml`:

```yaml
name: auto-docs
description: Automatically generate and index documentation

flow:
  - agent: docs-writer
    input:
      codebase: ./src

  - agent: docs-search
    input:
      content: ${docs-writer.output.markdown}
      operation: index

output:
  documentation: ${docs-writer.output.markdown}
  search_ready: ${docs-search.output.indexed}
```

---

## Customization Examples

### Brand Your Docs

```yaml
# agents/docs/custom.yaml
name: custom-docs
operation: docs

style:
  theme: dark
  logo: /assets/logo.png
  primary_color: "#007bff"
  font: "Inter, sans-serif"
```

### Filter Endpoints

```yaml
name: public-api-docs
operation: docs

include:
  - /api/v1/*
  - /api/v2/*

exclude:
  - /api/*/admin/*
  - /api/*/internal/*
```

### Add Examples

```yaml
name: docs-with-examples
operation: docs

examples:
  authentication:
    curl: |
      curl -H "Authorization: Bearer TOKEN" \
           https://api.example.com/endpoint
    javascript: |
      fetch('https://api.example.com/endpoint', {
        headers: { 'Authorization': 'Bearer TOKEN' }
      })
```

---

## Troubleshooting

### Docs Not Showing

1. Check agent is registered: `npm run dev` should show in agent list
2. Verify path: `/docs-simple` matches agent name
3. Check logs for parsing errors
4. Ensure `operation: docs` is set correctly

### Authentication Issues

1. Verify auth config in `conductor.config.ts`
2. Check auth middleware is registered
3. Test with authentication headers
4. Review error responses for auth failures

### AI Writer Not Working

1. Confirm Workers AI binding: `wrangler.toml` has `[ai]` section
2. Check model availability: Some models region-restricted
3. Verify input format matches schema
4. Review AI usage limits/quotas

### Search Not Finding Results

1. Confirm Vectorize binding configured
2. Check index exists and is populated
3. Verify embeddings are being generated
4. Test with simpler queries first

---

## Best Practices

### Documentation Maintenance

- **Update regularly** - Docs should match current API
- **Use AI writer** - Auto-generate from code changes
- **Version your docs** - Separate docs for each API version
- **Test examples** - Ensure code samples actually work

### Performance

- **Cache generated docs** - Use Workers KV for static docs
- **Lazy load** - Don't generate all docs on every request
- **Index incrementally** - Update only changed docs in search

### Security

- **Separate sensitive docs** - Use `docs-admin.yaml` for internal APIs
- **Audit access** - Log who accesses documentation
- **Sanitize output** - Don't leak secrets in examples
- **Rate limit** - Prevent abuse of doc generation

---

## Production Deployment

### Environment Variables

```bash
# .env.production
DOCS_ENABLED=true
DOCS_AUTH_TYPE=bearer
DOCS_ADMIN_ROLE=admin
AI_MODEL=@cf/meta/llama-3.1-8b-instruct
```

### Monitoring

Track documentation usage:

```typescript
// Log doc access
analytics.track('docs_accessed', {
  agent: 'docs-public',
  endpoint: req.url,
  user: auth.user
});
```

### Backup

```bash
# Export generated docs
conductor export-docs --format markdown --output ./backups/
```

---

## Next Steps

1. **Start with `docs-simple.yaml`** - Get basic docs working
2. **Add authentication** - Protect sensitive endpoints
3. **Enable AI writer** - Auto-generate better docs
4. **Add search** - Make docs easily discoverable
5. **Customize styling** - Match your brand
6. **Automate generation** - Integrate with CI/CD

---

## Need Help?

- **Conductor Docs**: https://docs.ensemble.ai/conductor
- **Examples**: See `agents/examples/api-docs/`
- **Issues**: Report at Conductor GitHub repo

These documentation tools are your secret weapon for maintaining great API docs with minimal effort! 🚀
