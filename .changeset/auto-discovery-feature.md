---
"@ensemble-edge/conductor": minor
---

Add auto-discovery for agents and ensembles

Implement zero-config agent and ensemble loading via build-time discovery. Vite plugins automatically scan and register agents from `agents/**/*.yaml` and ensembles from `ensembles/**/*.yaml`, eliminating manual imports and registration.

**New Features:**
- `vite-plugin-agent-discovery`: Build-time agent discovery with handler detection
- `vite-plugin-ensemble-discovery`: Build-time ensemble discovery
- `MemberLoader.autoDiscover()`: Runtime agent registration from virtual modules
- `EnsembleLoader`: New class for ensemble management with auto-discovery
- `createAutoDiscoveryAPI()`: Unified API with lazy initialization
- Virtual module TypeScript declarations for type safety

**Template Updates:**
- Updated `vite.config.ts` with discovery plugins
- Added `index-auto-discovery.ts` example entry point
- Added `virtual-modules.d.ts` for TypeScript support

**Impact:**
- Reduces agent setup from 4 steps to 2 steps (50% reduction)
- Eliminates 400+ lines of manual registration boilerplate
- Fully backward compatible - manual registration still supported
- 44 comprehensive tests added, all passing
