---
"@ensemble-edge/conductor": patch
---

Fix PageMember validation to accept component at root or nested in config

The PageMember validation now accepts component/componentPath at both:
- Root level (correct, current structure)
- Nested under config wrapper (backward compatibility)

This fixes the dev server validation error that prevented pages from loading
even when templates had correct structure. The validator now automatically
migrates config-wrapped components to root level for compatibility.

Fixes issues seen in versions 1.1.5-1.1.8 where templates were correct but
validation failed.
