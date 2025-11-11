---
"@ensemble-edge/conductor": patch
---

Fix YAML indentation errors in page templates that prevented runtime parsing. All page templates (examples, errors, static) now have proper indentation for nested properties under seo, cache, head, hydration, and input blocks.
