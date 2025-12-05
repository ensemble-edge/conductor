# @ensemble-edge/conductor

## 0.4.13

### Patch Changes

- 2690785: CLI and documentation improvements:
  - Add -y/--yes flag to init command for non-interactive CI/CD usage
  - Auto-detect package manager (npm, pnpm, yarn, bun) from lockfiles
  - Auto-install dependencies after project initialization
  - Add --skip-install flag to skip automatic installation
  - Update README with Cloudflare-native positioning
  - Standardize CLI patterns to use npx @ensemble-edge/ensemble

## 0.4.12

### Patch Changes

- 01b5ec1: Remove deprecated CLI bin entry - CLI now available through unified ensemble CLI
  - Remove `bin` entry from package.json (conductor CLI is deprecated)
  - Update documentation to use `ensemble conductor` commands
  - CLI functionality moved to @ensemble-edge/ensemble package

## 0.4.11

### Patch Changes

- d8c23a2: Add Cloud module for managed platform integration

  **Cloud Module (`/cloud` endpoint):**
  - New `/cloud` route handler for Ensemble Cloud platform connectivity
  - Health endpoint for worker status monitoring
  - Structure endpoint exposing project agents/ensembles/triggers
  - Executions endpoint for remote execution history access
  - Logs endpoint for centralized log streaming
  - Sync endpoint for configuration synchronization

  **Cloud CLI Handlers:**
  - `ensemble cloud init` - Initialize Cloud connection with API key setup
  - `ensemble cloud status` - Display current Cloud sync status
  - `ensemble cloud rotate` - Rotate Cloud API keys
  - `ensemble cloud disable` - Disable Cloud integration

  **Auto-Discovery Enhancements:**
  - Improved project detection for Conductor projects
  - Better wrangler.toml parsing for Cloud initialization

  This patch implements the foundation for the Ensemble Cloud managed platform,
  enabling workers to communicate with the central dashboard for monitoring,
  execution history, and configuration management.

## 0.4.10

### Patch Changes

- 0388b41: Remove dead DocsRouteConfig code and orphaned docs.yaml template

## 0.4.9

### Patch Changes

- bb39b31: ### Discovery System Improvements
  - Add centralized discovery configuration via `conductor.config.json`
  - Export discovery types and functions from main package entry point (`DiscoveryConfig`, `mergeDiscoveryConfig`, `DEFAULT_*_DISCOVERY`)
  - Create `src/config/discovery.ts` with types, defaults, and Zod schemas
  - Update all 4 Vite plugins to use config loader with fallback to defaults
  - Add build-time config-loader.ts for Vite plugin configuration
  - Fix template files to use package imports instead of relative paths (required for `conductor init`)

  ### Type System Refactoring
  - Create `flow-types.ts` as single source of truth for flow step types
  - Unify `FlowStepType` and type guards across `primitives/types.ts` and `parser.ts`
  - Remove ~200 lines of duplicate type definitions
  - Fix `config-checker` to use canonical types from `parser.ts`
  - Export Zod schemas from `parser.ts` for external validation

  ### HTTP Triggers & Response Formats
  - Add support for custom Content-Type in HTTP triggers (text/xml, text/csv, etc.)
  - Implement format-aware response handling (json, text, xml, csv, yaml, ics)
  - Add output interpolation operators (uppercase, lowercase, trim, etc.)
  - Update template ensembles to use auth/public configuration pattern
  - Add example ensembles for RSS, CSV, ICS calendar, and YAML formats

  ### Template & Naming Updates
  - Complete `member→agent` rename across codebase
  - Remove legacy template files (index.ts, index-legacy.ts)
  - Clean up pages system (removed vite-plugin-page-discovery.ts)
  - Simplify debug ensembles (echo, headers, ping, info, slow)
  - Add proper auth configuration to system ensembles (robots, sitemap)

## 0.4.8

### Patch Changes

- 1b0dcb1: ### Runtime & Memory System
  - Consolidate graph executor by removing separate graph-types.ts
  - Add `GraphState` interface with comprehensive node execution tracking
  - Add `getMemoryManager()` accessor to `BaseAgent` for easier memory access
  - Add `getFullHistory()`, `getAllShortTerm()`, and `getRecentShortTerm()` methods to session memory
  - Add `MessageRole` type and `MemoryExportData` interface for memory serialization

  ### Security & Auth
  - Add timing-safe comparison for JWT signature verification
  - Implement SSRF protection with URL/IP validation in safe-fetch utility
  - Add PII redaction in logger for sensitive data patterns
  - Use constant-time string comparison for API key/token validation
  - Add Unkey validator integration via dynamic import

  ### RAG Agent (Cloudflare AI & Vectorize)
  - Real embedding generation with `@cf/baai/bge-base-en-v1.5`
  - Real vector storage/search with Cloudflare Vectorize
  - Optional reranking with `@cf/baai/bge-reranker-base`
  - Batching: 100 texts/embedding, 1000 vectors/upsert
  - Multi-tenant isolation via namespace config

  ### HITL Agent (Durable Object Integration)
  - Full integration with `HITLState` Durable Object
  - Slack webhook notifications with Block Kit UI
  - Email notifications via MailChannels API
  - Webhook notifications with callback URLs

  ### MCP Routes (Model Context Protocol)
  - `discoverExposedEnsembles()` via CatalogLoader
  - `buildInputSchema()` for JSON Schema generation
  - JWT authentication with env var resolution

  ### Email Trigger
  - Complete RFC822 header parsing with continuations
  - RFC 2047 encoded word decoding
  - MIME multipart handling with attachment extraction

  ### Template & Test Fixes
  - Fix hello-world.yaml conditional output evaluation
  - Fix basic.test.ts assertions for output structure
  - Fix trigger-auth.test.ts for async validator functions
  - Fix mcp-integration.test.ts for MCP protocol error responses

  ### Cloudflare Compatibility
  - Move CLI-only dependencies to optionalDependencies
  - Add `nodejs_compat` flag to wrangler.toml
  - Document CLI-only functions in loader.ts

## 0.4.7

### Patch Changes

- 769e5c8: ### Features
  - **Simplified HITL callback API** - Cleaner Human-in-the-Loop callbacks with configurable base path
  - **Framework extensions** - Conditional outputs, multi-path HTTP triggers, and component registries
  - **Catalog restructuring** - Purposeful categorization (`debug/`, `system/`, `user/`) with redirect and debug services
  - **Migrate built-in agents to catalog** - fetch, queries, scrape, tools, validate agents as templates
  - **Docs as ensemble architecture** - New build and CLI triggers for static documentation generation
  - **Align ComponentType with Edgit** - Improved catalog templates and middleware

  ### Documentation
  - Added AI context files (CLAUDE-CONDUCTOR.md) for machine-optimized agent/ensemble development
  - Expanded template test coverage

## 0.4.6

### Patch Changes

- 65b218f: ## Architecture Improvements

  ### Simplified HITL Callback API

  Redesigned the HITL workflow resumption system with a cleaner 2-endpoint design:
  - `POST /callback/:token` - Resume suspended workflow with body `{ approved: true/false, feedback?, reason? }`
  - `GET /callback/:token` - Get token metadata without consuming it

  **Breaking change from v0.4.5**: The previous `/callbacks/resume/:token`, `/callbacks/approve/:token`, and `/callbacks/reject/:token` endpoints have been consolidated into a single `/callback/:token` endpoint.

  ### Configurable Callback Base Path

  New `APIConfig.hitl.resumeBasePath` option allows customizing the callback endpoint path:

  ```typescript
  createConductorAPI({
    hitl: {
      resumeBasePath: '/resume', // Results in POST /resume/:token
    },
  })
  ```

  Default is `/callback`.

  ### Cleaned Up Webhook Routes
  - Removed legacy broken `/webhooks/trigger/:ensembleName` endpoint
  - `/webhooks` now only lists registered webhook endpoints
  - Users own the `/webhooks/*` namespace for their trigger paths

  ## Bug Fixes
  - Changed generic "Invalid API key" error to "Invalid credentials" for improved security

  ## Documentation & Examples
  - Updated HITL docs with simplified callback URL examples
  - Updated catalog templates to use recommended `/webhooks/*` prefix for webhook triggers

  ## Tests
  - Added 14 new callback route integration tests
  - Added 8 new webhook route integration tests

## 0.4.5

### Patch Changes

- d4b22aa: ## Bug Fixes

  Fix trigger authentication for user-defined routes:
  - **Critical**: Global API auth middleware now only applies to built-in `/api/v1/*` routes
  - User-defined trigger routes (e.g., `/api/protected`) now correctly use their own auth config
  - Previously, global middleware blocked trigger-specific auth from running, causing all authenticated trigger endpoints to return 401

## 0.4.4

### Patch Changes

- 56f57a8: ## Bug Fixes

  Fix trigger authentication environment variable resolution:
  - `$env.VAR_NAME` and `${env.VAR_NAME}` syntax now properly resolves to environment variable values
  - Fixes bearer, signature, and basic auth when using environment-sourced secrets
  - Previously, the literal string (e.g., "$env.API_SECRET") was compared instead of the resolved value

  ## Features

  Add optional chaining (`?.`) support to interpolation system:
  - `${input.user?.name}` - safely access nested properties, returns undefined if parent is null/undefined
  - `${input.data?.items?.[0]}` - optional array access
  - Works with all existing operators (`??`, `||`, `?:`, `!`)

  ## Other Changes
  - Update release testing plan to clarify HTML vs JSON endpoint distinction:
    - `/docs/*` routes return HTML documentation pages
    - `/api/v1/*` routes return JSON for programmatic access

## 0.4.3

### Patch Changes

- b6a4877: Add expression operators to interpolation system:
  - `??` (nullish coalescing): `${input.name ?? "default"}` - fallback for null/undefined
  - `||` (falsy coalescing): `${input.name || "default"}` - fallback for all falsy values
  - `?:` (ternary): `${input.enabled ? "yes" : "no"}` - conditional expressions
  - `!` (negation): `${!input.disabled}` - boolean negation
  - `[n]` (array indexing): `${input.items[0].name}` - access array elements by index

  Fixes HTTP trigger query/body param interpolation where `??` expressions failed.

## 0.4.2

### Patch Changes

- 44c1d81: Add authentication and security infrastructure including trigger-level auth, permissions system, signature-based authentication, and improved observability context propagation

## 0.4.1

### Patch Changes

- 26f2025: Fix bugs discovered during v0.4.0 release testing

  **HTML Agent Template Normalization**
  - Added `normalizeConfig()` to handle YAML shorthand `template: "<string>"` format
  - Automatically converts string templates to `{ inline: "<string>" }` structure
  - Maintains backward compatibility with existing TypeScript configs

  **Ensemble Execution API**
  - Added support for `ensemble` parameter in POST `/api/v1/execute` endpoint
  - New `executeEnsembleFromBody()` helper for body-based ensemble routing
  - Validates that either `agent` or `ensemble` is provided

  **Liquid Template Engine**
  - Fixed context unwrapping to match SimpleTemplateEngine behavior
  - Properly handles both `{ data: {...} }` and flat context objects

  **Vite Plugin Auto-Discovery**
  - Added `'examples'` to default `excludeDirs` alongside `'generate-docs'`
  - Prevents example files from being included in agent discovery

## 0.4.0

### Minor Changes

- 7959377: ## Migrate `docs/` to First-Class Component Directory

  ### Breaking Changes
  - **Removed `Operation.docs`**: The `docs` operation type has been removed from the Operation enum
  - **Removed `src/agents/docs/`**: The `DocsMember` class and related code have been deleted
  - **Removed `generate-docs` templates**: The `agents/generate-docs/` and `agents/examples/api-docs/` template directories have been removed

  ### New Features
  - **First-class `docs/` directory**: Documentation is now a top-level component directory alongside `agents/`, `ensembles/`, and `prompts/`
  - **`docs/docs.yaml` configuration**: Configure documentation with route settings, UI framework selection, navigation, and theming
  - **DocsDirectoryLoader**: New loader class for discovering and loading docs configuration and markdown files
  - **DocsNavigation**: Automatic navigation generation from markdown files with ordering support
  - **OpenAPI generation**: Full OpenAPI spec generation from agents and ensembles via `/docs/openapi.json` route
  - **Multiple UI frameworks**: Support for Stoplight, Redoc, Swagger UI, Scalar, and RapiDoc documentation viewers
  - **Handlebars templating**: Markdown files support Handlebars variables and helpers
  - **Frontmatter support**: YAML frontmatter for metadata in markdown documentation

  ### Migration Guide

  **Before (0.3.x):**

  ```yaml
  # agents/api-docs/agent.yaml
  name: api-docs
  operation: docs
  config:
    title: API Documentation
    ui: stoplight
  ```

  **After (0.4.0):**

  ```yaml
  # docs/docs.yaml
  name: docs
  description: API Documentation

  route:
    path: /docs
    auth:
      requirement: public

  title: API Documentation
  ui: stoplight

  nav:
    order:
      - getting-started
      - authentication
  ```

  Place markdown files directly in the `docs/` directory. They will be auto-discovered and rendered with Handlebars support.

## 0.3.4

### Patch Changes

- ce670f8: Template improvements and release workflow updates
  - Added 10 example agent folders (greet-user, authenticate, fetch-user, etc.) with proper agent.yaml + index.ts structure
  - Fixed example ensemble YAML files to use correct `flow:` syntax with `agent:` key
  - Enabled AI binding in template wrangler.toml
  - Updated changeset config to include plugins in release workflow
  - Added plugin changeset instructions to CLAUDE.md

## 0.3.3

### Patch Changes

- 8d533c2: Schema-aware output for think agents and improved developer experience
  - Think agents now map AI responses to schema-defined field names (e.g., `output: { greeting: string }` makes response available as `${agent.output.greeting}`)
  - AI metadata (model, provider, tokensUsed) now accessible via `_meta` namespace
  - Better validation error messages with helpful hints for common mistakes
  - Improved Workers AI setup documentation in templates
  - Documented YAML hot-reload limitation with workaround

## 0.3.2

### Patch Changes

- a66a337: Fix template src/build/ vite plugins not being committed to git

  The root .gitignore had `build/` which ignored ALL directories named build/ at any depth, including the template vite plugins at `catalog/cloud/cloudflare/templates/src/build/`. Changed to `/build/` to only ignore the root build directory, and committed the template vite plugin files.

## 0.3.1

### Patch Changes

- 3db5493: Fix npm packaging to include template src/build/ vite plugins

  The .npmignore was excluding all `src/` directories, which prevented the vite build plugins in `catalog/cloud/cloudflare/templates/src/build/` from being included in the published package. This caused `conductor init` to create projects that couldn't build due to missing vite plugin files.

## 0.3.0

### Minor Changes

- 8cf07f9: ## TypeScript-First SDK & Hyperdrive Support

  ### TypeScript Agent & Ensemble Authoring
  - Add full TypeScript support for defining agents and ensembles programmatically
  - New primitives: `createEnsemble()`, `step()`, `parallel()`, `branch()`, `foreach()`, `tryStep()`, `whileStep()`, `mapReduce()`
  - Version primitives for component management with semver support
  - Type-safe ensemble building with fluent builder API
  - Support for `.ts` agent and ensemble files alongside YAML

  ### Hyperdrive Database Integration
  - Wire `HyperdriveRepository` into data-agent for PostgreSQL/MySQL access via Cloudflare Hyperdrive
  - Automatic connection pooling and edge caching for external databases
  - Dialect-aware SQL (Postgres `$1` vs MySQL `?` placeholders)
  - Support for `query`, `get`, `put`, `delete`, `list` operations
  - New config options: `databaseType`, `schema`, `readOnly`

  ### Improvements
  - Enhanced component loader for TypeScript files
  - Better validation for agent and ensemble definitions
  - Expanded parser support for programmatic definitions

## 0.2.5

### Patch Changes

- 0c5d482: Fix inline code agents, HTTP input parameters, and build warnings
  - **Inline Code Agents**: Ensembles can now define agents with inline `operation: code` and embedded code strings that execute correctly
  - **HTTP Input Parameters**: HTTP triggers now provide structured access to `body`, `params`, `query`, `method`, `path`, and `headers` with backwards compatibility
  - **Build Warnings**: Eliminated Node.js import warnings by using browser-optimized builds for liquidjs and handlebars, reducing bundle size by ~15%
  - **Component Resolver**: Refactored to be Workers-compatible using KV storage instead of filesystem

## 0.2.4

### Patch Changes

- 8e41363: Fix all v0.2.3 testing report issues including ensemble validation errors, inline agent registration, HTTP trigger input mapping, and template syntax fixes. Add autorag operation type and MCP trigger handler. Add validate CLI command with auto-fix capability.

## 0.2.3

### Patch Changes

- 47853d0: ## v0.2.3 - Critical Template & Schema Fixes

  This patch release fixes all critical issues from the v0.2.2 testing report, ensuring a smooth out-of-box experience.

  ### 🔴 Critical Fixes

  **Template Build Failures**
  - Fixed wrong entry point in `vite.config.ts` - now uses `src/index-auto-discovery.ts` instead of `src/index.ts`
  - Removed JSDoc glob patterns (`**/*.yaml`) that broke esbuild compilation
  - Removed invalid `rolldown` config that caused TypeScript errors

  **Agent Discovery Issues**
  - Fixed `api-docs` agent: `operation: 'Docs'` → `'docs'` (case sensitivity)
  - Fixed `vectorize-search` agent: `operation: 'vectorize-rag'` → `'data'` (invalid enum)
  - All 3 template agents now load successfully at runtime (was 1/3, now 3/3)

  **YAML Syntax Errors**
  - Fixed indentation in `parallel-workflow.yaml` and `advanced-workflow.yaml`
  - All ensemble YAML files now parse successfully

  ### 🚀 Major Schema Improvement

  **Optional Flow with Auto-Generation**
  - Made `flow` field optional in ensemble schema
  - Added `agents` and `inputs` fields to schema
  - Parser now auto-generates sequential flow from inline agent definitions
  - **Backward compatible** with v0.2.1 ensemble format
  - Eliminates need for manual ensemble conversions

  ### 📊 Impact
  - ✅ Build succeeds on fresh template install
  - ✅ No esbuild or TypeScript errors
  - ✅ All custom agents load at runtime
  - ✅ Simple ensembles require less boilerplate
  - ✅ All 927 tests pass

  ### 🔧 Technical Details

  **Schema Changes:**
  - `EnsembleSchema.flow` is now optional
  - `EnsembleSchema.agents` added (optional, for inline definitions)
  - `EnsembleSchema.inputs` added (optional, for input schema)
  - Parser auto-generates flow when missing but agents present

  **TypeScript Fixes:**
  - Updated `executor.ts` to handle optional flow
  - Updated `openapi-generator.ts` to handle optional flow
  - Fixed type guard for `FlowStep` type

  ### Migration Guide

  No migration needed! This release is fully backward compatible with v0.2.1 and v0.2.2 ensemble formats.

  **Before (v0.2.2 - verbose):**

  ```yaml
  agents:
    - name: check-health
      operation: code
      config: { ... }

  flow:
    - agent: check-health

  output:
    status: ${check-health.output.status}
  ```

  **After (v0.2.3 - concise, flow auto-generated):**

  ```yaml
  agents:
    - name: check-health
      operation: code
      config: { ... }
  # flow is auto-generated!
  ```

  Both formats work in v0.2.3.

## 0.2.2

### Patch Changes

- b6b8d52: Migrate from Pages to HTTP triggers with full middleware support

  **Breaking Changes:**
  - Remove `operation: page` in favor of HTTP triggers with `type: http`
  - Delete Pages system (page-agent, page-loader, page-router, hono-bridge)
  - Remove plugin packages (plugin-attio, plugin-cloudflare, plugin-payload, plugin-unkey) - functionality moved to core

  **New Features:**
  - Add HTTP trigger system with TriggerRegistry for extensible trigger types
  - Add HTTP and Webhook built-in triggers supporting CORS, rate limiting, caching, auth
  - Add HttpMiddlewareRegistry for named middleware management
  - Add 6 built-in Hono middleware: logger, compress, timing, secure-headers, pretty-json, etag
  - Support both string references (YAML) and direct functions (TypeScript) for middleware
  - Migrate all example Pages to HTTP trigger ensembles

  **Migration:**
  - Rename OperationRegistry to PluginRegistry for clarity
  - Move catalog from pages/ to ensembles/ directory structure
  - Update auto-discovery to register built-in triggers and middleware

## 0.2.1

### Patch Changes

- eceb7c1: Fix Workers AI blocker and missing template dependencies

  **Critical Fix:**
  - Replace dynamic require() with async import() in built-in agent registry
  - Enables Workers AI functionality with wrangler dev (previously blocked by esbuild errors)
  - Maintains lazy loading with bundler-compatible dynamic imports

  **Template Improvements:**
  - Add missing dependencies (hono, mjml) to template package.json
  - Silence expected browser compatibility warnings in vite.config.ts
  - Add troubleshooting documentation for build warnings

  **All tests passing:** 956 unit tests + 39 integration tests ✅

## 0.2.0

### Minor Changes

- e86b476: v0.1.1 - Major architectural improvements and documentation overhaul

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

## 1.12.5

### Patch Changes

- 64e160a: Remove handlebars and mjml template engines from Workers agents (CSP incompatible)

  **BREAKING**: Removed 'handlebars' and 'mjml' from all Workers agent template engine options. These engines use eval() which fails in Cloudflare Workers due to CSP restrictions.

  **Changes**:
  - Removed 'handlebars' and 'mjml' from TemplateEngine type (now only 'simple' | 'liquid')
  - Updated all agents (ThinkAgent, PageAgent, HtmlAgent) to only support Workers-compatible engines
  - HandlebarsTemplateEngine and MJMLTemplateEngine classes kept for server-side use only (DocsManager, EmailAgent)
  - All 903 tests passing

  **Migration**: If using `templateEngine: 'handlebars'` or `templateEngine: 'mjml'`, switch to `'simple'` (default) or `'liquid'`. SimpleTemplateEngine supports {{variable}}, {{#if}}, {{#each}} syntax.

## 1.12.4

### Patch Changes

- 597ec04: Fix ThinkAgent template rendering by switching to real Handlebars library

  **ROOT CAUSE IDENTIFIED**: ThinkAgent was using a custom lightweight PromptParser instead of the real Handlebars library. PageAgent and other components use the full Handlebars library (`import * as Handlebars from 'handlebars'`), which is why template rendering worked correctly there.

  **The Fix**: Replace PromptParser with the real Handlebars library in ThinkAgent, matching the proven implementation used by PageAgent.

  **Changes**:
  - ThinkAgent now uses `Handlebars.compile()` for systemPrompt template rendering
  - Consistent template engine across all agent types (PageAgent, EmailAgent, ThinkAgent)
  - Added proper error handling for template compilation failures
  - Removed unused PromptParser and PromptManager classes (were never actually used in the codebase)
  - Retained debug logging to trace template rendering

  This fixes the critical bug where `{{input.name}}` was sent literally to LLMs instead of being rendered as "Alice".

## 1.12.3

### Patch Changes

- 477a744: Fix critical template rendering bug in ensemble agents

  **CRITICAL BUG FIX**: The v1.12.2 template rendering fix for ThinkAgent only applied to standalone agent execution. When agents were used in ensembles, the legacy ThinkMember class was used instead, which lacked the template rendering code. This caused literal `{{input.name}}` syntax to be sent to LLMs instead of rendered values.

  **Root Cause**: Conductor maintained separate Agent and Member class hierarchies. The template rendering fix was only applied to ThinkAgent, not ThinkMember.

  **Solution**: Unified all Agent/Member classes into a single Agent class hierarchy. Deleted 6,250+ lines of duplicate legacy code.

  **Changes**:
  - Remove separate Member/Agent class distinction - all agents now use unified Agent classes
  - Template rendering now works correctly in ALL contexts (standalone and ensemble)
  - API renamed for clarity: `createThinkMember` → `createThinkAgent` (backward compatible aliases provided)
  - Deleted obsolete \*-member.js build artifacts

  **Breaking Changes**: None (backward compatibility aliases provided for all renamed functions)

  **Impact**: This fixes template rendering for agents used in ensembles, which was the primary use case affected by the bug reported in user testing.

## 1.12.2

### Patch Changes

- 802720f: Fix template rendering in ThinkAgent systemPrompt

  ThinkAgent now properly renders Handlebars templates in systemPrompt before sending to LLMs. Previously, literal template syntax like `{{input.name}}` was sent directly to the AI provider instead of being rendered with actual values.

  **Fixed**: Template variables (`{{input.*}}`, `{{env.*}}`, `{{context.*}}`) now render correctly in ThinkAgent system prompts.

## 1.12.1

### Patch Changes

- ffe61cd: Fix ThinkAgent provider auto-detection for Cloudflare Workers AI models

  ThinkAgent now automatically detects the AI provider from model name prefix:
  - Models starting with @cf/ → Cloudflare Workers AI
  - Models starting with gpt- or o1- → OpenAI
  - Models starting with claude- → Anthropic

  Explicit `provider` setting in YAML config takes precedence over auto-detection.

  Fixes issue where Cloudflare Workers AI models (@cf/) were incorrectly defaulting to Anthropic API, causing "API key not found" errors even with correct Workers AI configuration.

## 1.12.0

### Minor Changes

- eb7f578: Add auto-discovery for agents and ensembles

  Implement zero-config agent and ensemble loading via build-time discovery. Vite plugins automatically scan and register agents from `agents/**/*.yaml` and ensembles from `ensembles/**/*.yaml`, eliminating manual imports and registration.

  **New Features:**
  - `vite-plugin-agent-discovery`: Build-time agent discovery with handler detection
  - `vite-plugin-ensemble-discovery`: Build-time ensemble discovery
  - `MemberLoader.autoDiscover()`: Runtime agent registration from virtual modules
  - `EnsembleLoader`: New class for ensemble management with auto-discovery
  - `createAutoDiscoveryAPI()`: Unified API with lazy initialization
  - Virtual module TypeScript declarations for type safety

  **Template Updates:**
  - Updated `vite.config.ts` with discovery plugins
  - Added `index-auto-discovery.ts` example entry point
  - Added `virtual-modules.d.ts` for TypeScript support

  **Impact:**
  - Reduces agent setup from 4 steps to 2 steps (50% reduction)
  - Eliminates 400+ lines of manual registration boilerplate
  - Fully backward compatible - manual registration still supported
  - 44 comprehensive tests added, all passing

## 1.11.2

### Patch Changes

- e678765: Fix template configuration issues in Cloudflare template
  - Fixed route path conflict: moved docs-public from /docs to /api/docs to avoid conflict with docs-simple agent
  - Removed unsupported watch_dirs field from wrangler.toml configuration (not yet officially supported)
  - Updated documentation to reflect new endpoint paths for API documentation

## 1.11.1

### Patch Changes

- 7f54f9d: Fix Windows path separator issue in page discovery plugin

  Fixed ESM import error on Windows where `path.relative()` was generating backslashes instead of forward slashes, causing build failures with message "Could not resolve './pages\examples\blog-post\handler.ts'". The plugin now normalizes all path separators to forward slashes for ESM compatibility.

## 1.11.0

### Minor Changes

- a4766c6: Add first-class docs component support with Handlebars rendering
  - **DocsManager**: New class for managing markdown documentation with Handlebars rendering, YAML frontmatter parsing, and in-memory caching
  - **DocsLoader**: Template utility for easy docs access with auto-discovery integration
  - **Vite Plugin**: Auto-discovers markdown files at build time via vite-plugin-docs-discovery
  - **Component Protocol**: Added `docs://` protocol support in ComponentLoader for versioned component references
  - **Template Integration**: DocsLoader initialization with lazy loading, DocsRouter for HTTP endpoints
  - **Full Handlebars Support**: Variables, conditionals, loops, helpers, and partials
  - **Testing**: 21 comprehensive tests covering all DocsManager functionality
  - **Agent Organization**: Renamed agents/docs → agents/generate-docs for clarity

  The docs/ directory now works exactly like prompts/ with versioning, component references, and dynamic rendering capabilities.

## 1.10.0

### Minor Changes

- 50819b8: Add `docs` operation for API documentation generation

  **New Feature: Docs Operation**
  - Added new `docs` operation type for interactive API documentation
  - DocsMember agent serves OpenAPI 3.1 specifications with multiple UI frameworks
  - Supports Stoplight Elements, Redoc, Swagger UI, Scalar, and RapiDoc
  - Includes custom branding, caching, and authentication options
  - Template includes 6 pre-configured docs agents (simple, public, authenticated, admin)

  **Type System Updates**:
  - Added `Operation.docs` to Operation enum and OperationType union
  - Registered DocsMember in Executor's agent factory
  - Added docs to AgentSchema validation in Parser
  - Updated operation metadata functions (display name, description, content generation)

  **Testing**:
  - Added 21 comprehensive integration tests for docs operation
  - Tests cover YAML parsing, agent creation, metadata, error handling, and type safety
  - All 833 tests passing (832 + 1 skipped)

  **Bug Fix: Nested Agent Discovery**:
  - Fixed TestConductor to recursively discover agents in subdirectories
  - Now properly supports three-tier agent organization (agents/, agents/docs/, agents/examples/)
  - Template tests now correctly discover all 9 agents including nested ones

## 1.9.0

### Minor Changes

- 4356268: Template reorganization and comprehensive documentation improvements

  **Dynamic Routing Fix**:
  - Fixed PageRouter to properly handle dynamic route parameters like `/blog/:slug`
  - Routes are now checked at both root level (`pageConfig.route`) and nested level (`pageConfig.config.route`) for backward compatibility
  - Dynamic routes now return 200 with proper content instead of 404

  **Agent Signature Documentation**:
  - Documented that agents must use `AgentExecutionContext` signature to work in ensembles
  - Added comprehensive examples and troubleshooting to documentation
  - All template agents now follow correct pattern

  **Test Template Fix**:
  - Fixed ExecutionContext mock in test template (`catalog/cloud/cloudflare/templates/tests/basic.test.ts`)
  - Added proper `waitUntil()` and `passThroughOnException()` methods to mock
  - All template tests now pass without TypeError

  **Template Reorganization**:
  - Implemented three-tier agent organization: production (root), docs (infrastructure), examples (learning)
  - Created comprehensive README.md files for each tier (~1,200 lines total)
  - Moved docs agents to `agents/docs/` subdirectory
  - Moved example agents to `agents/examples/` subdirectory
  - Updated main README to reflect new structure (agents/ instead of members/)

  **Documentation**:
  - Added "Your First Documentation" comprehensive guide (950+ lines)
  - Updated all path references from `agents/hello/` to `agents/examples/hello/`
  - Documented AgentExecutionContext requirement throughout all guides

  **Testing**:
  - All 811 conductor tests passing
  - Dynamic routes verified working with curl tests
  - Template tests verified in fresh init project
  - Template reorganization verified with auto-discovery

## 1.8.1

### Patch Changes

- 4c0b024: Fix dynamic routing and test template ExecutionContext mock

  **Dynamic Routing Fix**:
  - Fixed PageRouter to properly handle dynamic route parameters like `/blog/:slug`
  - Routes are now checked at both root level (`pageConfig.route`) and nested level (`pageConfig.config.route`) for backward compatibility
  - Dynamic routes now return 200 with proper content instead of 404

  **Test Template Fix**:
  - Fixed ExecutionContext mock in test template (`catalog/cloud/cloudflare/templates/tests/basic.test.ts`)
  - Added proper `waitUntil()` and `passThroughOnException()` methods to mock
  - All template tests now pass without TypeError

  **Testing**:
  - All 812 conductor tests passing
  - Dynamic routes verified working with curl tests
  - Template tests verified in fresh init project

## 1.8.0

### Minor Changes

- c700785: Standardize component system and add schema protocol

  **New Features:**
  - Added `schema://` protocol for JSON Schema components
  - Component protocols now support all 6 types: template, prompt, script, query, config, schema

  **Improvements:**
  - Standardized component loader to handle all component types consistently
  - Updated component-loader tests to cover script:// and schema:// protocols
  - Cleaned up invalid component URI references (removed page://, form://, component://)

  **Bug Fixes:**
  - Fixed component-loader to properly handle schema:// URIs with schemas/ KV prefix

  **Testing:**
  - All 45 component-loader tests passing
  - Full test suite: 811/812 tests passing

## 1.7.0

### Minor Changes

- 8d9fa9b: Add unified trigger system with queue operation

  **Breaking Changes:**
  - Renamed `expose:` to `trigger:` in ensemble YAML configuration
  - Removed `schedules:` array - use `trigger: [{ type: cron }]` instead

  **New Features:**
  - Added `queue` operation for Cloudflare Queues integration
  - Added 5 trigger types: webhook, mcp, email, queue, cron
  - Queue triggers support batch processing with configurable sizes
  - Cron triggers now part of unified trigger array
  - All triggers use consistent discriminated union schema

  **Migration Guide:**

  ```yaml
  # Old (v1.6.0)
  expose:
    - type: webhook
      path: /endpoint

  schedules:
    - cron: '0 0 * * *'

  # New (v1.6.1+)
  trigger:
    - type: webhook
      path: /endpoint
    - type: cron
      cron: '0 0 * * *'
  ```

  **Documentation:**
  - Added comprehensive triggers guide
  - Added queue operation documentation
  - Updated all examples to use new syntax

## 1.6.0

### Minor Changes

- d02ef58: ## Documentation Improvements

  Fixed visual duplication in all 71 documentation pages where Mintlify was rendering both frontmatter metadata and markdown content. Removed duplicate H1 headings and bold taglines, consolidating all descriptive text into frontmatter description fields for cleaner presentation.

  **Documentation updates:**
  - Introduction docs (4 files)
  - Edgit docs (9 files)
  - Conductor overview & core concepts (12 files)
  - Conductor operations (12 files)
  - Conductor agents, playbooks & building (26 files)
  - API docs (8 files)

  All documentation pages now render cleanly without duplication.

## 1.5.1

### Patch Changes

- b8b13b9: Fix code formatting and add pre-commit checklist to CLAUDE.md
  - Run prettier to fix formatting in 7 TypeScript files
  - Add pre-commit checklist section to CLAUDE.md with commands to run before committing
  - Emphasize running format/typecheck/lint/test locally to prevent CI failures

## 1.5.0

### Minor Changes

- **BREAKING CHANGE: Nomenclature refactor from "members" to "agents"**

  This release contains breaking changes to the core terminology used throughout Conductor. All references to "members" have been replaced with "agents", and "MemberType" has been replaced with "Operation". **This is not backward compatible.**

  **What Changed:**
  - **Type System:**
    - `MemberType` → `Operation` enum
    - `MemberName` → `AgentName` branded type
    - `MemberReference` → `AgentReference` interface
    - `MemberConfig` → `AgentConfig`
    - All member-related types renamed to agent equivalents

  - **Operation Names (lowercase with semantic renames):**
    - `Think` → `think` (AI operations)
    - `Function` → `code` (JavaScript/TypeScript execution)
    - `Data` → `storage` (Database/KV/R2/D1 operations)
    - `API` → `http` (External HTTP/REST calls)
    - `MCP` → `tools` (Model Context Protocol/tool integration)
    - `Scoring`, `Email`, `SMS`, `Form`, `Page`, `HTML`, `PDF` → lowercase versions

  - **YAML Configuration:**

    ```yaml
    # OLD syntax (no longer supported)
    flow:
      - member: greeter
        type: Think

    # NEW syntax (required)
    flow:
      - agent: greeter
        operation: think
    ```

  - **File Structure:**
    - `src/members/` → `src/agents/`
    - `member.yaml` → `agent.yaml`
    - `*-member.ts` → `*-agent.ts`
    - All catalog and example directories updated

  - **TypeScript/JavaScript Code:**
    - `import { MemberType } from '@ensemble-edge/conductor'` → `import { Operation } from '@ensemble-edge/conductor'`
    - `BaseMember` → `BaseAgent`
    - `executeMember()` → `executeAgent()`
    - All function and variable names updated

  - **Configuration:**
    - `aiMember` config option → `aiAgent`
    - Environment variable: `CONDUCTOR_DOCS_AI_MEMBER` → `CONDUCTOR_DOCS_AI_AGENT`

  **Migration Guide:**
  1. **Update YAML files:**
     - Replace `member:` with `agent:` in flow definitions
     - Replace `type:` with `operation:` in agent definitions
     - Update operation values to lowercase: `Think` → `think`, `Function` → `code`, `Data` → `storage`, etc.
     - Update variable references: `${members.x}` → `${agents.x}`

  2. **Update TypeScript/JavaScript:**
     - Replace all `Member` types with `Agent` types
     - Replace `MemberType` with `Operation`
     - Update enum references: `Operation.Think` → `Operation.think`, `Operation.Function` → `Operation.code`, etc.
     - Update import statements

  3. **Update file structure:**
     - Rename `members/` directories to `agents/`
     - Rename `member.yaml` files to `agent.yaml`

  4. **No backward compatibility:**
     - Old YAML syntax will not work
     - No migration tools provided
     - Clean break for v1.x (pre-stable)

  **Why This Change:**
  - Aligns with industry-standard AI/agent terminology
  - Clearer distinction between execution primitives (operations) and autonomous units (agents)
  - Better conceptual clarity for new users
  - Foundation for future agent capabilities

## 1.4.6

### Patch Changes

- 44e7c96: Add npm version badge to README

## 1.4.5

### Patch Changes

- 041fcf2: Bug fixes and workflow improvements:
  - Fix PageRouter to properly register pages with explicit route configuration (dynamic routes now work!)
  - Remove package-lock.json from template to prevent npm install corruption errors
  - Add comprehensive DEVELOPMENT.md guide explaining watch mode behavior
  - Fix release workflow to eliminate push conflicts - workflow now only publishes artifacts without modifying master
  - Update CLAUDE.md with truly conflict-free workflow documentation

- b042eb4: Improve README Quick Start section wording
- af07eb5: Update README to list all nine member types

## 1.4.4

### Patch Changes

- c3291f2: Bug fixes and workflow improvements:
  - Fix PageRouter to properly register pages with explicit route configuration (dynamic routes now work!)
  - Remove package-lock.json from template to prevent npm install corruption errors
  - Add comprehensive DEVELOPMENT.md guide explaining watch mode behavior
  - Fix release workflow to eliminate push conflicts - workflow now only publishes artifacts without modifying master
  - Update CLAUDE.md with truly conflict-free workflow documentation

## 1.4.0

### Minor Changes

- 9302bec: Add dynamic pages with handler functions and parameter support

  **New Features:**
  - Handler functions for dynamic data fetching in pages
  - Route parameters (`:slug`), query parameters, and header access in handlers
  - Automatic handler detection and import via Vite plugin
  - Full template context with `params`, `query`, and `headers` variables

  **Example:**

  ```typescript
  // pages/blog/post/handler.ts
  export async function handler({ params, query, headers, env }) {
    const post = await env.DB.prepare('SELECT * FROM posts WHERE slug = ?')
      .bind(params.slug)
      .first()
    return { post }
  }
  ```

  ```yaml
  # pages/blog/post/page.yaml
  route:
    path: /blog/:slug

  component: |
    <h1>{{post.title}}</h1>
    <p>Slug: {{params.slug}}</p>
    <p>Preview: {{query.preview}}</p>
  ```

  **API:**
  - `HandlerContext` type with `request`, `env`, `ctx`, `params`, `query`, `headers`
  - `HandlerFunction` type: `(context: HandlerContext) => HandlerResult`
  - PageMember automatically calls handler before rendering
  - Template receives handler data merged with route/query params

  **Template Support:**
  - Updated blog-post example with full handler implementation
  - Mock data, KV, and D1 database examples
  - 404 handling when data not found

## 1.3.1

### Patch Changes

- cb319d7: Fix critical template issues in auto-discovery

  **Template Fixes:**
  - Fix package.json to use npm version placeholder instead of file path
  - Update wrangler.toml to use .mjs extension (Rolldown outputs .mjs not .js)
  - Add pages/ directory watcher for dev mode HMR

  **Documentation:**
  - Add critical release workflow section to CLAUDE.md
  - Clarify changeset-based release process

## 1.3.0

### Minor Changes

- 70deb41: Add auto-discovery for pages using Vite + Rolldown

  ### Breaking Changes
  - **Build System**: Now uses Vite with Rolldown bundler for 3x+ faster builds
  - **Page Imports**: Pages are auto-discovered at build time - remove manual imports

  ### New Features
  - **Auto-Discovery**: Pages automatically discovered from `pages/` directory
  - **Virtual Module**: `virtual:conductor-pages` provides all discovered pages
  - **Hot Module Replacement (HMR)**: Instant page updates during development
  - **Faster Builds**: Rolldown bundler provides 3-16x faster builds than Rollup
  - **Zero Configuration**: No manual page imports or registration needed

  ### Migration Guide
  1. Update dependencies:
     ```bash
     npm install -D vite @cloudflare/vite-plugin rolldown-vite fast-glob
     ```
  2. Add `vite.config.ts`:

     ```typescript
     import { defineConfig } from 'vite'
     import { pageDiscoveryPlugin } from './scripts/vite-plugin-page-discovery.js'

     export default defineConfig({
       plugins: [pageDiscoveryPlugin()],
       // ... rest of config
     })
     ```

  3. Update `src/index.ts`:

     ```typescript
     // Remove manual imports
     - import indexPageConfigRaw from '../pages/examples/index/page.yaml'
     - import dashboardPageConfigRaw from '../pages/examples/dashboard/page.yaml'

     // Replace with virtual module
     + import { pages as discoveredPages } from 'virtual:conductor-pages'
     ```

  4. Update `package.json` scripts:
     ```json
     {
       "scripts": {
         "build": "vite build",
         "dev": "vite dev",
         "deploy": "npm run build && wrangler deploy"
       }
     }
     ```
  5. Update `wrangler.toml`:
     ```toml
     main = "dist/index.js"
     [build]
     command = "npm run build"
     watch_dirs = ["src", "pages", "members", "ensembles"]
     ```

  ### Templates Updated
  - Cloudflare Workers template now uses auto-discovery by default
  - No manual page imports needed in new projects

## 1.2.2

### Patch Changes

- 467fa7b: Release v1.2.1 features: Universal cache warming and advanced caching for all member types

## 1.2.1

### Patch Changes

- Add universal cache warming and advanced caching for all member types

  **Universal Cache Support:**

  New `BaseCacheConfig` interface that works with **any member type**: Page, API, Data, Think, Queue, and future members. All members now support the same caching features.

  **New Cache Features:**
  1. **Cache Tags** - Smart cache invalidation with tags
     ```yaml
     cache:
       enabled: true
       ttl: 3600
       tags: [pages, blog, user-123]
     ```
  2. **Cache Warming** - Pre-populate edge cache on deployment
     ```yaml
     cache:
       enabled: true
       ttl: 3600
       warming: true # or prewarm: true
     ```
  3. **Stale-While-Revalidate** - Already supported, now with enhanced type safety

  **New Files:**
  - `src/types/cache.ts` - Universal `BaseCacheConfig` interface
    - `hasCacheConfig()` - Type guard for cache support
    - `isCacheWarmingEnabled()` - Check warming status
    - `getCacheConfig()` - Extract cache config
  - `src/utils/cache-warming.ts` - Cache warming utility (works with any member type)
    - `warmCache()` - Warm routes with concurrency control
    - `extractWarmableRoutes()` - Auto-discover warmable members
    - `scheduledCacheRefresh()` - Cron-based cache refresh
  - `scripts/warm-cache.js` - Deploy-time cache warming script
    - Auto-discovers all members with `cache.warming: true`
    - Supports Pages, APIs, Data members, and more
    - Sorts by priority, shows real-time progress
  - `src/utils/__tests__/cache-warming.test.ts` - 16 comprehensive tests

  **New NPM Scripts:**
  - `npm run warm-cache` - Warm cache after deployment
  - `npm run deploy:warm` - Deploy + automatic cache warming

  **Usage (works with any member type):**

  ```yaml
  # Page caching
  name: homepage
  type: Page
  cache:
    enabled: true
    ttl: 3600
    warming: true
    tags: [pages, homepage]

  # API caching
  name: products-api
  type: API
  cache:
    enabled: true
    ttl: 1800
    warming: true
    tags: [api, products]

  # Data caching
  name: user-profile
  type: Data
  cache:
    enabled: true
    ttl: 600
    warming: true
    tags: [data, users]
  ```

  **Deploy with cache warming:**

  ```bash
  # Deploy and warm cache for all members
  npm run deploy:warm -- --url https://myapp.com
  ```

  **Benefits:**
  - **Universal** - Same caching features for all member types
  - **Faster first requests** - Cache pre-populated on deploy
  - **Zero downtime** - Stale-while-revalidate ensures availability
  - **Smart invalidation** - Cache tags enable surgical purging
  - **Scheduled refresh** - Keep popular routes warm via Cron
  - **Type-safe** - Shared `BaseCacheConfig` prevents inconsistencies

  All existing functionality preserved. Cache warming is opt-in per member. PageCacheConfig now extends BaseCacheConfig for consistency.

## 1.2.0

### Minor Changes

- Switch default template engine to Liquid for edge-first architecture

  **Breaking Change:** PageMember now defaults to 'liquid' template engine instead of 'simple'

  **Why Liquid?**
  Liquid is the only template engine that works reliably in Cloudflare Workers edge runtime:
  - **Edge-Compatible**: Compiles to AST, no `new Function()` or `eval()` (blocked by Workers CSP)
  - **Real-Time Rendering**: Perfect for edge-first, real-time applications
  - **Industry Standard**: Used by Shopify, Jekyll, Salesforce - proven at massive scale
  - **Rich Features**: Powerful filters, loops, conditionals without CSP violations

  **Handlebars Limitation:**
  Handlebars uses runtime compilation (`new Function()`) which violates Cloudflare Workers Content Security Policy. It fails with: "Code generation from strings disallowed for this context"

  **Migration Guide:**

  If you have existing pages using the implicit 'simple' engine, you have two options:
  1. **Explicit simple engine** (keep current behavior):

  ```yaml
  templateEngine: simple
  ```

  2. **Migrate to Liquid** (recommended):

  ```yaml
  # Before (Handlebars/Simple):
  {{#each items}}
    <div>{{this.name}}</div>
  {{/each}}

  {{#if condition}}
    <p>{{message}}</p>
  {{/if}}

  # After (Liquid):
  {% for item in items %}
    <div>{{item.name}}</div>
  {% endfor %}

  {% if condition %}
    <p>{{message}}</p>
  {% endif %}
  ```

  **Key Syntax Differences:**
  - Loops: `{{#each items}}` → `{% for item in items %}`
  - Properties: `{{this.prop}}` → `{{item.prop}}`
  - Conditionals: `{{#if}}` → `{% if %}`
  - End tags: `{{/each}}` → `{% endfor %}`, `{{/if}}` → `{% endif %}`

  **Benefits of Migration:**
  - Works in all edge environments (Cloudflare Workers, Deno Deploy, etc.)
  - Better performance (AST compilation vs runtime eval)
  - More powerful filters and transformations
  - Industry-proven at scale (Shopify processes billions of requests/day)

  All example pages in the catalog have been updated to use Liquid.

## 1.1.15

### Patch Changes

- c2f0fe3: Fix critical Page rendering issues

  **Issue 1: Duplicate Content-Type Header (CRITICAL)**
  - PageRouter was setting content-type header AND spreading pageOutput.headers which also contained Content-Type
  - This created malformed header: 'content-type': 'text/html; charset=utf-8, text/html; charset=utf-8'
  - Caused HTMLRewriter to fail with "Parser error: Unknown character encoding"
  - Fixed by using pageOutput.headers directly without duplication

  **Issue 2: Handlebars Templates Not Rendering**
  - PageMember was returning raw template strings without rendering
  - Handlebars variables appeared as literal {{variable}} text in HTML
  - Fixed by integrating HandlebarsTemplateEngine for template rendering
  - Added support for default input props from page YAML configuration

  Both issues are now resolved and pages render correctly with interpolated template variables.

## 1.1.14

### Patch Changes

- e2fb65c: Comprehensive lazy initialization to prevent Worker blocking

  All module-scope YAML parsing, PageRouter instantiation, and PageMember creation now deferred to first request. This fixes HTTP request hanging issue where top-level operations blocked the fetch handler.

## 1.1.13

### Patch Changes

- 4a99154: Fix Worker initialization hang by moving page discovery to lazy initialization. The top-level await in src/index.ts template was blocking Worker startup. Pages are now initialized on first request instead.
- Fix Worker initialization blocking by implementing comprehensive lazy initialization for pages and members. All YAML parsing and PageMember creation now happens on first request rather than at module scope.

## 1.1.12

### Patch Changes

- 27ec795: Fix page template loading in src/index.ts by parsing YAML imports. Wrangler's text loader returns raw strings, not parsed objects. Added yaml parser import and parsing step before creating PageMember instances.

## 1.1.11

### Patch Changes

- 60faca3: Fix YAML indentation errors in page templates that prevented runtime parsing. All page templates (examples, errors, static) now have proper indentation for nested properties under seo, cache, head, hydration, and input blocks.

## 1.1.10

### Patch Changes

- 9dd2dc0: Actually fix PageMember validation (build was missing in 1.1.9)

  v1.1.9 had the source code fix but the built dist/ was not committed,
  so the published package still had the old validation logic.

  This release includes the built JavaScript with the validation fix that
  accepts component at both root level and nested in config wrapper.

## 1.1.9

### Patch Changes

- 823e2f7: Fix PageMember validation to accept component at root or nested in config

  The PageMember validation now accepts component/componentPath at both:
  - Root level (correct, current structure)
  - Nested under config wrapper (backward compatibility)

  This fixes the dev server validation error that prevented pages from loading
  even when templates had correct structure. The validator now automatically
  migrates config-wrapped components to root level for compatibility.

  Fixes issues seen in versions 1.1.5-1.1.8 where templates were correct but
  validation failed.

## 1.1.8

### Patch Changes

- 5d035ff: Update Page README documentation to remove config wrapper from examples - matches actual PageMemberConfig interface.

## 1.1.7

### Patch Changes

- d6a2541: Fix YAML indentation in page templates - properties under parent objects now properly indented with 2 spaces.

## 1.1.6

### Patch Changes

- 261ce7f: ## Critical Fix - Page YAML Structure

  **The REAL Issue**

  v1.1.5 moved `component` to root level but missed the fundamental problem: ALL page properties were wrapped in unnecessary `config:` object that doesn't exist in the TypeScript `PageMemberConfig` interface.

  **Incorrect structure (v1.1.5 and earlier):**

  ```yaml
  component: |
    <div>...</div>
  config: # ← This wrapper shouldn't exist!
    renderMode: ssr
    route:
      path: /
    cache:
      enabled: true
  ```

  **Correct structure (v1.1.6):**

  ```yaml
  component: |
    <div>...</div>
  renderMode: ssr # ← All properties at root level
  route:
    path: /
  cache:
    enabled: true
  ```

  **Fixed:** Removed `config:` wrapper and moved all properties to root level in 10 page templates:
  - pages/static/robots/page.yaml
  - pages/static/sitemap/page.yaml
  - pages/examples/index/page.yaml
  - pages/examples/dashboard/page.yaml
  - pages/examples/login/page.yaml
  - pages/examples/blog-post/page.yaml
  - pages/errors/404/401/403/500 page.yaml files

  **Result:** Page YAML structure now matches PageMemberConfig TypeScript interface. Dev server will start without "Page member requires either component or componentPath" errors.

## 1.1.5

### Patch Changes

- 0667f12: ## Template Fix - Static Pages

  **Critical Bug Fix**

  Fixed remaining static page templates that were causing dev server validation errors:
  - ✅ Fixed `pages/static/robots/page.yaml` - moved component to root level
  - ✅ Fixed `pages/static/sitemap/page.yaml` - moved component to root level
  - ✅ Added helpful comments explaining correct structure

  **What was broken (1.1.4):**
  - Static pages (robots.txt, sitemap.xml) still had `component:` nested inside `config:`
  - This caused "Page member requires either component or componentPath" error during dev server startup
  - Example pages and error pages were already fixed in 1.1.4, but static pages were missed

  **What's fixed (1.1.5):**
  - All page templates now have consistent structure with `component:` at root level
  - Dev server now starts successfully
  - Template is complete and production-ready

  **Testing:**
  Fresh `conductor init` will now generate a project where:
  - ✅ All tests pass (9/9)
  - ✅ Dev server starts without errors
  - ✅ All page types work (examples, errors, static)
  - ✅ Package.json references correct version
  - ✅ .gitignore present for security

  This completes the template fixes started in 1.1.4.

## 1.1.4

### Patch Changes

- 327f3ce: ## Dynamic Version Injection

  **Automation Improvement**
  - `conductor init` now dynamically injects the correct version into package.json
  - Template uses `__CONDUCTOR_VERSION__` placeholder that gets replaced at init time
  - No more manual version updates needed in template files
  - Generated projects always reference the installed Conductor version

  This solves the "version mess" - the template package.json will automatically use the correct version without any manual updates on each release.

## 1.1.2

### Patch Changes

- b0f7468: Test automated release workflow

## 1.1.1

### Patch Changes

- 3d3ef81: ## Conductor 1.1.1 - Critical Template Fixes

  ### P0 - Critical (Blocks Development)

  **nodejs_compat Flag Missing** (Bug #5)
  - Added `compatibility_flags = ["nodejs_compat"]` to wrangler.toml template
  - **Fixes dev server startup failure**: "Could not resolve fs/promises"
  - Conductor's component-resolver requires Node.js built-ins (fs/promises, path)
  - Without this flag, `npm run dev` fails immediately - completely blocks local development

  ### P1 - High Priority

  **Package Version Mismatch** (Bug #4)
  - Updated template package.json from `^1.0.10` to `^1.1.0`
  - Ensures generated projects use correct Conductor version
  - Prevents confusion during debugging and version-specific issues

  **Improved .gitignore**
  - Enhanced to explicitly call out secrets with "NEVER COMMIT THESE" comment
  - Added more comprehensive coverage (.pnpm-store/, .yarn/, worker/)
  - Better organized with clear sections

  ### Testing

  All fixes verified with fresh `conductor init` installation:
  - ✅ 9/9 tests passing
  - ✅ Dev server starts successfully with nodejs_compat flag
  - ✅ No secrets committed with improved .gitignore

## 1.1.0

### Minor Changes

- 06fe916: ## Conductor 1.1.0 - Component Resolution & Breaking Protocol Changes

  ### Breaking Changes

  **Removed Legacy Protocol Syntax**

  All `protocol://` syntax has been removed in favor of unified path-based component references:
  - ❌ `prompt://name@version` → ✅ `prompts/name@version`
  - ❌ `template://name@version` → ✅ `templates/name@version`
  - ❌ `kv://name@version` → ✅ `templates/name@version` (for templates)

  **Migration Guide:**

  ```yaml
  # Before (1.0.x)
  members:
    - name: analyze
      type: Think
      config:
        prompt: prompt://analyst@v1.0.0

    - name: send-email
      type: Email
      config:
        template: kv://welcome@latest

  # After (1.1.0)
  members:
    - name: analyze
      type: Think
      config:
        prompt: prompts/analyst@v1.0.0

    - name: send-email
      type: Email
      config:
        template: templates/welcome@latest
  ```

  ### New Features

  **Smart Component Resolution (Alternative 1)**

  Automatic detection and resolution of:
  - Inline values (strings, objects, arrays)
  - File paths (`./path/to/file`)
  - Component references (`type/name@version`)

  **Resolution Logic:**
  1. Non-string values → used as-is (inline)
  2. Multi-line strings → inline content
  3. Paths starting with `./` or `/` → file path
  4. Pattern `type/name@version` → component reference from Edgit
  5. Pattern `type/name` → component reference with `@latest`
  6. Everything else → inline string

  **Email Member Updates:**
  - Integrated component resolver in template rendering
  - Now supports all resolution patterns for `template` field
  - Backward-compatible test suite updated

  **Think Member Updates:**
  - Integrated component resolver in prompt loading
  - Supports versioned prompts via `prompt: prompts/name@version`
  - Seamless Edgit integration for prompt management

  ### Documentation Updates
  - Removed "planned" status from versioned component features (now implemented)
  - Fixed member discovery documentation to clarify member vs component references
  - Updated HTML member documentation to remove non-existent `protocol://` syntax
  - Updated all example ensemble YAML files with new syntax

  ### Technical Details

  **Component Resolver** (`src/utils/component-resolver.ts`):
  - `resolveValue()` - Main resolution function
  - `isComponentReference()` - Pattern detection for `type/name@version`
  - `resolveComponentRef()` - Fetches from Edgit KV or local fallback
  - `needsResolution()` - Helper to check if value needs async resolution

  **Test Coverage:**
  - All 712 tests passing
  - 29 component resolver unit tests
  - 69 email member tests updated to new syntax
  - Integration tests verified with new component resolution

  ### Upgrade Path
  1. **Update all YAML files**: Replace `protocol://` with path-based syntax
  2. **Update code**: Replace protocol references in TypeScript/JavaScript
  3. **Run tests**: Ensure all component references resolve correctly
  4. **Deploy**: Breaking changes are intentional, no backward compatibility

## 1.0.0

### Major Changes

- 0fab408: Initial public release of Conductor v0.0.1

  **Core Features:**
  - 🚀 Edge-native orchestration on Cloudflare Workers
  - 📝 YAML-driven workflow definitions
  - 🧩 Four member types: Think (AI), Function (JS), Data (KV/D1/R2), API (HTTP)
  - 🔄 Immutable state management with access tracking
  - 💾 Built-in caching with KV integration
  - 🔁 Durable Objects for ExecutionState and HITL workflows
  - ⏰ Scheduled execution with cron triggers
  - 🪝 Webhook support for HTTP triggers
  - 🤝 Human-in-the-Loop (HITL) approval workflows
  - 📊 Async execution tracking

  **Testing & Development:**
  - 🧪 Built-in testing framework (276 tests passing, 40%+ coverage)
  - 🎯 Custom Vitest matchers for workflow testing
  - 🔧 Mock providers for AI, databases, and HTTP
  - 📦 TestConductor for comprehensive integration testing
  - 🛠️ CLI tools (init, add member, validate, upgrade)
  - 📚 SDK with client library and testing utilities

  **Platform Architecture:**
  - 🤖 AI provider catalog (Workers AI, OpenAI, Anthropic, Groq)
  - 🌐 AI Gateway integration for caching and analytics
  - 🔧 Smart routing modes (cloudflare, cloudflare-gateway, direct)
  - 📋 Model deprecation tracking
  - ☁️ Cloudflare-first with extensible platform support

  **Planned Features:**
  - Edgit integration for component versioning
  - MCP (Model Context Protocol) support
  - Scoring system for quality evaluation
