---
"@ensemble-edge/conductor": patch
---

## v0.2.3 - Critical Template & Schema Fixes

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
    config: {...}

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
    config: {...}

# flow is auto-generated!
```

Both formats work in v0.2.3.
