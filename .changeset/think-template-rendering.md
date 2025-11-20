---
"@ensemble-edge/conductor": patch
---

Fix critical template rendering bug in ensemble agents

**CRITICAL BUG FIX**: The v1.12.2 template rendering fix for ThinkAgent only applied to standalone agent execution. When agents were used in ensembles, the legacy ThinkMember class was used instead, which lacked the template rendering code. This caused literal `{{input.name}}` syntax to be sent to LLMs instead of rendered values.

**Changes**:
- Remove separate Member/Agent class distinction - all agents now use unified Agent classes
- Template rendering now works correctly in ALL contexts (standalone and ensemble)
- Rename API: `createThinkMember` → `createThinkAgent` (backward compatible aliases provided)
- Deleted 6,250+ lines of duplicate legacy Member class code

**Impact**: This fixes template rendering for agents used in ensembles, which was the primary use case affected by the bug.
