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

**Dynamic Version Injection** (Automation)
- `conductor init` now dynamically injects the correct version into package.json
- Template uses `__CONDUCTOR_VERSION__` placeholder
- No more manual version updates needed in template
- Generated projects always reference the installed Conductor version

### Testing
- ✅ All 712 tests passing
- ✅ Dev server validation fixed
- ✅ Template structure corrected
- ✅ Dynamic version injection working
