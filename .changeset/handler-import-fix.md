---
"@ensemble-edge/conductor": patch
---

Fix handler import paths in Vite plugin - add ./ prefix for proper module resolution

Critical fix: Vite/Rolldown requires relative import paths to start with `./`, `../`, or `/`. Without this prefix, handler imports fail with "failed to resolve import" error, completely breaking the dynamic pages feature introduced in v1.4.0.
