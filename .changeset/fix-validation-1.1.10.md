---
"@ensemble-edge/conductor": patch
---

Actually fix PageMember validation (build was missing in 1.1.9)

v1.1.9 had the source code fix but the built dist/ was not committed,
so the published package still had the old validation logic.

This release includes the built JavaScript with the validation fix that
accepts component at both root level and nested in config wrapper.
