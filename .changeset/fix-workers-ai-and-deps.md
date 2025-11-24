---
"@ensemble-edge/conductor": patch
---

Fix Workers AI blocker and missing template dependencies

**Critical Fix:**
- Replace dynamic require() with async import() in built-in agent registry
- Enables Workers AI functionality with wrangler dev (previously blocked by esbuild errors)
- Maintains lazy loading with bundler-compatible dynamic imports

**Template Improvements:**
- Add missing dependencies (hono, mjml) to template package.json
- Silence expected browser compatibility warnings in vite.config.ts
- Add troubleshooting documentation for build warnings

**All tests passing:** 956 unit tests + 39 integration tests ✅
