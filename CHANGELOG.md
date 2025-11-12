# @ensemble-edge/conductor

## 1.4.2

### Patch Changes

- 1ca5e6f: Documentation improvements: comprehensive development guide, simplified CLAUDE.md workflow, and watch mode explanations

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
