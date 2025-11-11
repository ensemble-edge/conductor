---
"@ensemble-edge/conductor": patch
---

## Conductor 1.1.1 - Template Fixes

### Critical Fixes

**nodejs_compat Flag Missing** (Bug #5)
- Added `compatibility_flags = ["nodejs_compat"]` to wrangler.toml template
- Fixes dev server startup failure: "Could not resolve fs/promises"
- Conductor's component-resolver requires Node.js built-ins (fs/promises, path)
- Without this flag, `npm run dev` fails immediately

**Package Version Mismatch** (Bug #4)  
- Updated template package.json from `^1.0.10` to `^1.1.0`
- Ensures generated projects use correct Conductor version
- Prevents confusion during debugging and version-specific issues

### New Files

**Added .gitignore**
- Prevents committing secrets (.dev.vars, .env)
- Excludes build outputs (.wrangler/, dist/, node_modules/)
- Improves security and repository hygiene

### Testing

All template fixes verified with:
- Fresh `conductor init` installation
- 9/9 tests passing
- Dev server starts successfully with nodejs_compat flag
