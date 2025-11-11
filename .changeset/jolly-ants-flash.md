---
"@ensemble-edge/conductor": patch
---

Fix page template loading in src/index.ts by parsing YAML imports. Wrangler's text loader returns raw strings, not parsed objects. Added yaml parser import and parsing step before creating PageMember instances.
