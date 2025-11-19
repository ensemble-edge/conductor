---
"@ensemble-edge/conductor": patch
---

Fix Windows path separator issue in page discovery plugin

Fixed ESM import error on Windows where `path.relative()` was generating backslashes instead of forward slashes, causing build failures with message "Could not resolve './pages\examples\blog-post\handler.ts'". The plugin now normalizes all path separators to forward slashes for ESM compatibility.
