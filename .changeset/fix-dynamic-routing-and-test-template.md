---
"@ensemble-edge/conductor": patch
---

Fix dynamic routing and test template ExecutionContext mock

**Dynamic Routing Fix**:
- Fixed PageRouter to properly handle dynamic route parameters like `/blog/:slug`
- Routes are now checked at both root level (`pageConfig.route`) and nested level (`pageConfig.config.route`) for backward compatibility
- Dynamic routes now return 200 with proper content instead of 404

**Test Template Fix**:
- Fixed ExecutionContext mock in test template (`catalog/cloud/cloudflare/templates/tests/basic.test.ts`)
- Added proper `waitUntil()` and `passThroughOnException()` methods to mock
- All template tests now pass without TypeError

**Testing**:
- All 812 conductor tests passing
- Dynamic routes verified working with curl tests
- Template tests verified in fresh init project
