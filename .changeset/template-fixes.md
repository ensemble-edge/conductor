---
"@ensemble-edge/conductor": patch
---

Fix critical template issues in auto-discovery

**Template Fixes:**
- Fix package.json to use npm version placeholder instead of file path
- Update wrangler.toml to use .mjs extension (Rolldown outputs .mjs not .js)
- Add pages/ directory watcher for dev mode HMR

**Documentation:**
- Add critical release workflow section to CLAUDE.md
- Clarify changeset-based release process
