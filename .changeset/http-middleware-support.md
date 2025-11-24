---
"@ensemble-edge/conductor": patch
---

Migrate from Pages to HTTP triggers with full middleware support

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
