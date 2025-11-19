# Documentation Generation Agents

**Location**: `agents/generate-docs/`

**Conductor's built-in documentation infrastructure**

These agents **auto-generate API documentation** from your agents and ensembles. They're production-ready tools that work out of the box!

**Key Feature**: 🔄 Documentation auto-updates when you add/modify agents and ensembles

**Note**: This is separate from `docs/` which contains markdown documentation as first-class components (like `prompts/`) that these agents can reference and serve.

---

## How It Works Out of the Box

```bash
npx conductor init my-project
cd my-project
npm run dev

# Documentation is ALREADY live at:
curl http://localhost:8787/docs
# or visit in browser
```

**What you get immediately**:
- ✅ Interactive API documentation UI (Stoplight Elements)
- ✅ Auto-generated OpenAPI 3.1 spec from your agents/ensembles
- ✅ Multiple endpoints: `/docs`, `/docs/openapi.yaml`, `/docs/openapi.json`
- ✅ Auto-updates when you add/change agents (with 1-hour caching)

---

## Available Documentation Agents

### 1. Simple Docs (`docs-simple.yaml`) ⭐ Default

**Purpose**: Basic API documentation - works immediately on first install

**Access**: `GET /docs` (main endpoint)

**Best for**: Getting started, small projects, quick documentation

**Try it**:
```bash
curl http://localhost:8787/docs
curl http://localhost:8787/docs/openapi.yaml
curl http://localhost:8787/docs/openapi.json
```

### 2. Public Docs (`docs-public.yaml`)

**Purpose**: Advanced API documentation with AI-powered descriptions and interactive UI

**Access**: `GET /api/docs` (also serves OpenAPI at `/api/openapi.yaml` and `/api/openapi.json`)

**Best for**: External APIs, partner documentation, developer portals, production docs

**Features**:
- Stoplight Elements interactive UI
- AI-enhanced descriptions
- Auto-generates from your API agents
- OpenAPI 3.1 spec generation
- 1-hour caching

### 3. Authenticated Docs (`docs-authenticated.yaml`)

**Purpose**: Documentation for logged-in users only

**Access**: `GET /docs-authenticated` (requires authentication)

**Best for**: Customer-specific docs, internal tools, authenticated APIs

### 4. Admin Docs (`docs-admin.yaml`)

**Purpose**: Admin-only documentation for privileged operations

**Access**: `GET /docs-admin` (requires admin role)

**Best for**: Internal APIs, admin operations, dangerous endpoints

### 5. AI Doc Writer (`docs-writer/`)

**Purpose**: AI-powered documentation enhancement

**Best for**: Generating better descriptions, examples, and explanations

**Requires**: Workers AI binding

### 6. Docs Search (`docs-search/`)

**Purpose**: Semantic search for documentation

**Best for**: Large documentation sets, helping users find information

**Requires**: Vectorize binding

---

## Auto-Update Feature 🔄

**The docs automatically update when you change your code!**

### How It Works

1. You add a new agent or modify an existing one
2. On next request to `/docs`, DocsMember regenerates the OpenAPI spec
3. Your documentation reflects the latest API structure
4. Caching (1 hour default) prevents regeneration on every request

### Configuration

```yaml
autoGenerate:
  enabled: true           # Enable auto-generation
  includeAgents: true     # Document your agents
  includeEnsembles: true  # Document your ensembles
  includePages: true      # Document your page routes

cache:
  enabled: true           # Cache generated specs
  ttl: 3600              # 1 hour (adjust as needed)
```

---

## Troubleshooting

### Docs Not Showing

**Problem**: `/docs` returns 404

**Solutions**:
1. Check server is running: `npm run dev`
2. Verify DocsRouter is initialized in `src/index.ts`
3. Look for errors in console

### Documentation Outdated

**Problem**: Docs don't reflect recent changes

**Solutions**:
1. Wait for cache to expire (1 hour default)
2. Restart dev server: `npm run dev`
3. Reduce cache TTL for development

---

## Best Practices

### ✅ Do

- **Keep docs simple** - Start with `docs-simple.yaml`
- **Use auto-generation** - Let Conductor document your API automatically
- **Separate by audience** - Public, authenticated, and admin docs
- **Enable caching** - Improves performance (1-hour default is good)

### ❌ Don't

- **Don't disable auto-generation** - You'll lose automatic updates
- **Don't expose internal endpoints publicly** - Use separate doc agents
- **Don't skip authentication** - Protect sensitive documentation

---

## Directory Structure

```
agents/
└── generate-docs/          # This directory (generates docs)
    ├── README.md           # This file
    ├── docs-simple.yaml    # Basic docs (at /docs)
    ├── docs-public.yaml    # Public API docs
    ├── docs-authenticated.yaml  # Authenticated docs
    ├── docs-admin.yaml     # Admin-only docs
    ├── docs-writer/        # AI doc enhancement
    │   └── agent.yaml
    └── docs-search/        # Semantic search
        └── agent.yaml

docs/                       # First-class components (like prompts/)
    ├── README.md
    └── *.md                # Markdown docs with Handlebars support
```

**Remember**: `agents/generate-docs/` = GENERATES documentation (active)
**vs**: `docs/` = Documentation CONTENT as first-class components (referenceable)

---

## Referencing docs/ Content

The generation agents can reference markdown files from `docs/` directory (first-class components):

### Using DocsLoader

```typescript
// In your custom endpoint or generation agent
import { DocsLoader } from './lib/docs-loader'

const loader = new DocsLoader()
await loader.init(docsMap) // Auto-discovered from docs/

// Get rendered markdown with variables
const gettingStarted = await loader.get('getting-started', {
  projectName: 'My API',
  version: '1.0.0'
})

// Use in your docs generation or serve it directly
```

### Benefits

- **Handlebars rendering** - Dynamic content with variables
- **Auto-discovery** - Files automatically loaded at build time
- **Caching** - Fast in-memory access
- **Component pattern** - Same as prompts, configs, queries

This enables you to combine **auto-generated API docs** with **human-written guides** in a unified documentation system.

---

**Questions?** The documentation is already working at `/docs` - just visit it in your browser!
