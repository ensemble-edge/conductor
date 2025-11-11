---
"@ensemble-edge/conductor": patch
---

## Dynamic Version Injection

**Automation Improvement**
- `conductor init` now dynamically injects the correct version into package.json
- Template uses `__CONDUCTOR_VERSION__` placeholder that gets replaced at init time
- No more manual version updates needed in template files
- Generated projects always reference the installed Conductor version

This solves the "version mess" - the template package.json will automatically use the correct version without any manual updates on each release.
