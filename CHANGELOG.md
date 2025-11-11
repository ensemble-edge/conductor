# @ensemble-edge/conductor

## 1.1.3

### Patch Changes

- c4d76de: ## Conductor 1.1.3 - Critical Template Fixes

  ### P0 - Critical (Blocks Development)

  **Page Validation Error Fixed** (Bug #3)
  - Moved `component` from nested `config.component` to root level in page.yaml template
  - Fixes dev server startup failure: "Page member requires either component or componentPath"
  - Dev server now starts correctly with `npm run dev`

  ### P1 - High Priority

  **Missing .gitignore** (Security Issue)
  - Added comprehensive .gitignore to template
  - Prevents accidental commits of secrets (.dev.vars, .env files)
  - Includes build outputs, OS files, IDE configs

  **Package Version Reference Updated**
  - Updated template package.json from `^1.1.0` to `^1.1.1`
  - Ensures generated projects reference correct Conductor version

  ### Testing
  - ✅ All 712 tests passing
  - ✅ Dev server validation fixed
  - ✅ Template structure corrected

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
