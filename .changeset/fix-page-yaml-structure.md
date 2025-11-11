---
"@ensemble-edge/conductor": patch
---

## Critical Fix - Page YAML Structure

**The REAL Issue**

v1.1.5 moved `component` to root level but missed the fundamental problem: ALL page properties were wrapped in unnecessary `config:` object that doesn't exist in the TypeScript `PageMemberConfig` interface.

**Incorrect structure (v1.1.5 and earlier):**
```yaml
component: |
  <div>...</div>
config:                # ← This wrapper shouldn't exist!
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
renderMode: ssr        # ← All properties at root level
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
