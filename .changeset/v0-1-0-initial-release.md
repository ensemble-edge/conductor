---
"@ensemble-edge/conductor": major
---

v0.1.0 Initial Release - Complete architectural refactor

**BREAKING CHANGES**: This release includes comprehensive architectural improvements across storage, data operations, plugin system, and pages module.

## 1. Storage/Data Operation Split (BREAKING)

Complete architectural split between simple storage and structured databases.

**storage operation** - Simple persistence primitives:
- KV (key-value store)
- R2 (object storage)
- Cache (edge cache)

**data operation** - Structured databases:
- D1 (SQLite database)
- Vectorize (vector search)
- Hyperdrive (database pooling)
- External databases (Supabase, Neon, PlanetScale)

**Breaking Config Changes**:
```yaml
# OLD (DEPRECATED)
operation: storage
config:
  type: d1
  query: SELECT ...

# NEW (REQUIRED)
operation: data
config:
  backend: d1
  binding: DB
  operation: query
  sql: SELECT ...
  params: [...]
```

**Migration Required**:
- `type: d1` → `backend: d1`
- `type: vectorize` → `backend: vectorize`
- `query:` → `sql:` for SQL statements
- Add `binding:` field (e.g., `DB`, `VECTORIZE`)
- Add `operation:` field (`query`, `execute`, `transaction`, `batch`)

**New Implementation**:
- Created `StorageAgent` for KV/R2/Cache operations
- Refactored `DataAgent` to handle only database operations
- Split `StorageType` and `DatabaseType` enums with type guards
- SDK factory functions: `createStorageAgent()`, `createDataAgent()`

## 2. Plugin System & Operation Registry

Global plugin system enabling extensible operations across all contexts.

**Plugin System Infrastructure**:
- Global `OperationRegistry` singleton for operation management
- Two plugin patterns: Functional & Lifecycle
- Proper TypeScript types and interfaces
- Operations work universally (ensembles, pages, forms, APIs)

**New Plugins Included**:

### @conductor/cloudflare (0.1.0)
Cloudflare services integration:
- R2 Storage: `r2:put`, `r2:get`, `r2:delete`, `r2:list`
- KV Storage: `kv:put`, `kv:get`, `kv:delete`, `kv:list`
- D1 Database: `d1:query`, `d1:batch`
- API: `api:request`, `dns:create`

### @conductor/unkey (0.1.0)
API key authentication:
- `unkey:validate` - Validate API keys
- `unkey:create` - Create API keys with rate limiting
- `unkey:revoke` - Revoke/delete API keys

### @conductor/payload (0.1.0)
Payload CMS integration:
- `payload:find` - Query documents with filters
- `payload:findById` - Get single document
- `payload:create` - Create new documents
- `payload:update` - Update documents
- `payload:delete` - Delete documents

### @conductor/attio (0.1.0)
Attio CRM integration:
- `attio:queryRecords` - Query CRM records
- `attio:getRecord` - Get single record
- `attio:createRecord` - Create records
- `attio:updateRecord` - Update records
- `attio:deleteRecord` - Delete records
- `attio:createNote` - Add notes to records
- `attio:listRecords` - Get records from lists

## 3. Hono Pages Module Refactor

Complete rewrite of pages system with better Hono integration.

**Architecture Changes**:
- Replaced `PageRouter` with `HonoConductorBridge`
- Added `PageLoader` for dynamic page discovery
- Proper error handling with 404/500 handlers
- Schema validation for page configurations
- Modular component architecture

**Benefits**:
- Better integration with global `OperationRegistry`
- Cleaner plugin system integration
- Improved template handling and auto-discovery
- Comprehensive integration tests

## 4. Package Structure Refactor

Monorepo reorganization with pnpm workspaces.

**Changes**:
- Moved conductor to `packages/conductor/`
- Updated all build, test, and release workflows
- Configured changesets for automated releases
- Fixed import paths and module resolution

## 5. Documentation Overhaul

Complete documentation update for new architecture.

**Updates**:
- Created comprehensive `data` operation documentation
- Updated `storage` operation docs (KV/R2/Cache only)
- Fixed 113+ instances across 27 documentation files
- Updated all getting-started guides
- Corrected all playbooks and building guides
- Fixed all Cloudflare template examples

## Test Coverage

All 956 tests passing across 43 test files.

## Migration Guide

### For Storage/Data Split:
1. Update D1 operations from `storage` to `data`
2. Update Vectorize operations from `storage` to `data`
3. Change `type:` to `backend:`
4. Change `query:` to `sql:` for SQL statements
5. Add required `binding:` and `operation:` fields

### For Pages Module:
- Pages configuration schema unchanged
- Auto-discovery continues to work
- Error handling improved automatically

### For Plugins:
- All existing operations continue to work
- New plugins available for import
- Plugin registration automatic via `OperationRegistry`

## Documentation

See updated documentation:
- [Storage Operations](/conductor/operations/storage)
- [Data Operations](/conductor/operations/data)
- [Plugin System](/conductor/plugins/overview)
- [Operation Registry](/conductor/plugins/operation-registry)

## Planning Documents Completed
- ✅ storage-data-split-plan.md
- ✅ package-refactoring.md
