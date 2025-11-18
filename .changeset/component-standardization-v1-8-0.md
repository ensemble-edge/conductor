---
"@ensemble-edge/conductor": minor
---

Standardize component system and add schema protocol

**New Features:**
- Added `schema://` protocol for JSON Schema components
- Component protocols now support all 6 types: template, prompt, script, query, config, schema

**Improvements:**
- Standardized component loader to handle all component types consistently
- Updated component-loader tests to cover script:// and schema:// protocols
- Cleaned up invalid component URI references (removed page://, form://, component://)

**Bug Fixes:**
- Fixed component-loader to properly handle schema:// URIs with schemas/ KV prefix

**Testing:**
- All 45 component-loader tests passing
- Full test suite: 811/812 tests passing
