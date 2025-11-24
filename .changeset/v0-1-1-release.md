---
"@ensemble-edge/conductor": minor
---

v0.1.1 - Major architectural improvements and documentation overhaul

This release includes comprehensive architectural refactoring across storage operations, plugin system, pages module, and documentation.

## 1. Storage/Data Operation Split (BREAKING)

Split the monolithic `storage` operation into two specialized operations:

### New `storage` Operation (Simple Persistence)
For key-value storage and object storage:
- **KV**: `operation: storage` with `backend: kv`
- **R2**: `operation: storage` with `backend: r2`
- **Cache**: `operation: storage` with `backend: cache`

### New `data` Operation (Structured Databases)
For relational and vector databases:
- **D1**: `operation: data` with `backend: d1`
- **Vectorize**: `operation: data` with `backend: vectorize`
- **Hyperdrive**: `operation: data` with `backend: hyperdrive`

**Breaking Changes:**
- `type:` parameter renamed to `backend:`
- `query:` parameter renamed to `sql:` (for D1 operations)
- D1 operations moved from `storage` to `data` operation

**Migration:**
```yaml
# Before
- name: query-db
  operation: storage
  config:
    type: d1
    query: SELECT * FROM users

# After
- name: query-db
  operation: data
  config:
    backend: d1
    sql: SELECT * FROM users
```

## 2. Plugin System & Operation Registry

Introduced a comprehensive plugin architecture with global operation registry:

### New Plugins
- **@conductor/cloudflare** - Cloudflare platform integrations (Workers AI, AI Gateway, Queues, Analytics, Email)
- **@conductor/unkey** - API key management and rate limiting
- **@conductor/payload** - Payload CMS integration for content management
- **@conductor/attio** - CRM operations for contacts, companies, lists

### Plugin Patterns
- **Functional plugins**: Register custom operations
- **Lifecycle plugins**: Hook into execution lifecycle (before/after agent execution)
- **Global registry**: All operations registered in centralized OperationRegistry

## 3. Hono Pages Module Refactor

Rebuilt pages module on Hono framework:
- Full Hono middleware ecosystem support (CORS, compression, JWT, etc.)
- Use any Conductor operation in `beforeRender`
- Template engine support (Handlebars, Liquid, Simple)
- Content negotiation (HTML/JSON based on Accept header)
- Dynamic routes with URL parameters (e.g., `/blog/:slug`)
- Auto-discovery from `pages/` directory

## 4. Package Structure Refactor

Transitioned to pnpm monorepo:
- Migrated from npm to pnpm workspaces
- Updated all CI/CD workflows to use pnpm
- Updated all template files distributed via `conductor init`
- Updated CLI scripts and install messages

## 5. Documentation Overhaul

Comprehensive documentation updates:
- Fixed 100+ storage/data operation references across 20+ docs files
- Updated 86+ npm→pnpm install commands across all getting-started guides
- Updated all template READMEs and package.json scripts
- Separated storage and data operations clearly in all examples
- Updated playbooks, operations reference, and getting-started guides

**Testing:** All 956 unit tests passing
