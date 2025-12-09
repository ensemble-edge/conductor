---
"@ensemble-edge/conductor": patch
---

Remove deprecated backward compatibility code

Breaking changes:
- Removed deprecated `useAI` config option (use `ai.enabled` instead)
- Removed deprecated `getOperationRegistry()` (use `getPluginRegistry()` instead)
- Removed deprecated `OperationRegistry` export (use `PluginRegistry` instead)
- Removed deprecated `'page'` context type (valid types: ensemble, form, api, webhook)

Philosophy: Clean slate with zero backward compatibility shims for a better product.
