---
"@ensemble-edge/conductor": patch
---

Fix bugs discovered during v0.4.0 release testing

**HTML Agent Template Normalization**
- Added `normalizeConfig()` to handle YAML shorthand `template: "<string>"` format
- Automatically converts string templates to `{ inline: "<string>" }` structure
- Maintains backward compatibility with existing TypeScript configs

**Ensemble Execution API**
- Added support for `ensemble` parameter in POST `/api/v1/execute` endpoint
- New `executeEnsembleFromBody()` helper for body-based ensemble routing
- Validates that either `agent` or `ensemble` is provided

**Liquid Template Engine**
- Fixed context unwrapping to match SimpleTemplateEngine behavior
- Properly handles both `{ data: {...} }` and flat context objects

**Vite Plugin Auto-Discovery**
- Added `'examples'` to default `excludeDirs` alongside `'generate-docs'`
- Prevents example files from being included in agent discovery
