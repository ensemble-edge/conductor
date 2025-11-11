---
"@ensemble-edge/conductor": patch
---

Fix Worker initialization hang by moving page discovery to lazy initialization. The top-level await in src/index.ts template was blocking Worker startup. Pages are now initialized on first request instead.
