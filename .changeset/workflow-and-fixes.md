---
"@ensemble-edge/conductor": patch
---

Bug fixes and workflow improvements:

- Fix PageRouter to properly register pages with explicit route configuration (dynamic routes now work!)
- Remove package-lock.json from template to prevent npm install corruption errors
- Add comprehensive DEVELOPMENT.md guide explaining watch mode behavior
- Fix release workflow to eliminate push conflicts - workflow now only publishes artifacts without modifying master
- Update CLAUDE.md with truly conflict-free workflow documentation
