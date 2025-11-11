---
"@ensemble-edge/conductor": patch
---

## Conductor 1.1.3 - Critical Template Fixes

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
