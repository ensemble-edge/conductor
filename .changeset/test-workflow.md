---
"@ensemble-edge/conductor": patch
---

Workflow improvements:

- Fix release workflow to create git tag before GitHub release step
- Ensure proper ordering: npm publish → tag → GitHub release → version commit
