---
'@ensemble-edge/conductor': patch
---

Comprehensive lazy initialization to prevent Worker blocking

All module-scope YAML parsing, PageRouter instantiation, and PageMember creation now deferred to first request. This fixes HTTP request hanging issue where top-level operations blocked the fetch handler.
