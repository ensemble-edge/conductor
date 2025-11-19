---
"@ensemble-edge/conductor": minor
---

Add `docs` operation for API documentation generation

**New Feature: Docs Operation**
- Added new `docs` operation type for interactive API documentation
- DocsMember agent serves OpenAPI 3.1 specifications with multiple UI frameworks
- Supports Stoplight Elements, Redoc, Swagger UI, Scalar, and RapiDoc
- Includes custom branding, caching, and authentication options
- Template includes 6 pre-configured docs agents (simple, public, authenticated, admin)

**Type System Updates**:
- Added `Operation.docs` to Operation enum and OperationType union
- Registered DocsMember in Executor's agent factory
- Added docs to AgentSchema validation in Parser
- Updated operation metadata functions (display name, description, content generation)

**Testing**:
- Added 21 comprehensive integration tests for docs operation
- Tests cover YAML parsing, agent creation, metadata, error handling, and type safety
- All 833 tests passing (832 + 1 skipped)

**Bug Fix: Nested Agent Discovery**:
- Fixed TestConductor to recursively discover agents in subdirectories
- Now properly supports three-tier agent organization (agents/, agents/docs/, agents/examples/)
- Template tests now correctly discover all 9 agents including nested ones
