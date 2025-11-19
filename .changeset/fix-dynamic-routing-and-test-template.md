---
"@ensemble-edge/conductor": minor
---

Template reorganization and comprehensive documentation improvements

**Dynamic Routing Fix**:
- Fixed PageRouter to properly handle dynamic route parameters like `/blog/:slug`
- Routes are now checked at both root level (`pageConfig.route`) and nested level (`pageConfig.config.route`) for backward compatibility
- Dynamic routes now return 200 with proper content instead of 404

**Agent Signature Documentation**:
- Documented that agents must use `AgentExecutionContext` signature to work in ensembles
- Added comprehensive examples and troubleshooting to documentation
- All template agents now follow correct pattern

**Test Template Fix**:
- Fixed ExecutionContext mock in test template (`catalog/cloud/cloudflare/templates/tests/basic.test.ts`)
- Added proper `waitUntil()` and `passThroughOnException()` methods to mock
- All template tests now pass without TypeError

**Template Reorganization**:
- Implemented three-tier agent organization: production (root), docs (infrastructure), examples (learning)
- Created comprehensive README.md files for each tier (~1,200 lines total)
- Moved docs agents to `agents/docs/` subdirectory
- Moved example agents to `agents/examples/` subdirectory
- Updated main README to reflect new structure (agents/ instead of members/)

**Documentation**:
- Added "Your First Documentation" comprehensive guide (950+ lines)
- Updated all path references from `agents/hello/` to `agents/examples/hello/`
- Documented AgentExecutionContext requirement throughout all guides

**Testing**:
- All 811 conductor tests passing
- Dynamic routes verified working with curl tests
- Template tests verified in fresh init project
- Template reorganization verified with auto-discovery
