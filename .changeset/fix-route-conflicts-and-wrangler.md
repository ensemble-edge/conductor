---
"@ensemble-edge/conductor": patch
---

Fix template configuration issues in Cloudflare template

- Fixed route path conflict: moved docs-public from /docs to /api/docs to avoid conflict with docs-simple agent
- Removed unsupported watch_dirs field from wrangler.toml configuration (not yet officially supported)
- Updated documentation to reflect new endpoint paths for API documentation
