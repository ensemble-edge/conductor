---
"@ensemble-edge/conductor": patch
---

Fix critical template rendering bug in ensemble agents

**CRITICAL BUG FIX**: The v1.12.2 template rendering fix for ThinkAgent only applied to standalone agent execution. When agents were used in ensembles, the legacy ThinkMember class was used instead, which lacked the template rendering code. This caused literal `{{input.name}}` syntax to be sent to LLMs instead of rendered values.

**Root Cause**: Conductor maintained separate Agent and Member class hierarchies. The template rendering fix was only applied to ThinkAgent, not ThinkMember.

**Solution**: Unified all Agent/Member classes into a single Agent class hierarchy. Deleted 6,250+ lines of duplicate legacy code.

**Changes**:
- Remove separate Member/Agent class distinction - all agents now use unified Agent classes
- Template rendering now works correctly in ALL contexts (standalone and ensemble)
- API renamed for clarity: `createThinkMember` → `createThinkAgent` (backward compatible aliases provided)
- Deleted obsolete *-member.js build artifacts

**Breaking Changes**: None (backward compatibility aliases provided for all renamed functions)

**Impact**: This fixes template rendering for agents used in ensembles, which was the primary use case affected by the bug reported in user testing.
