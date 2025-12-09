---
"@ensemble-edge/conductor": patch
---

Add deployment configuration and tag-based deployment infrastructure

**Configuration (`conductor.config.ts`):**
- Add `defineConfig()` helper for type-safe configuration authoring
- Add `environments` option for environment tag configuration (staging, production, etc.)
- Add `workers` option for per-environment worker name overrides
- Add `versions` config with `sync` and `retention` options for version tag management
- Add `kv` config for component storage KV namespace binding

**Deployment Types:**
- `VersionRetention` - Version retention policies ('all', 'last-5', 'last-10', 'last-20', 'last-50')
- `VersionsConfig` - Version sync and retention settings
- `KVConfig` - KV namespace configuration

**GitHub Actions Templates:**
- `conductor.yaml` - Complete CI/CD workflow for tag-based deployments with component sync
- `validate.yaml` - PR validation workflow with component reference checking

**Validation Script:**
- `validate-refs.ts` - Validates component references exist in edgit registry before deployment
