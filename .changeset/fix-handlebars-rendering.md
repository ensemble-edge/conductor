---
"@ensemble-edge/conductor": patch
---

Fix ThinkAgent template rendering by switching to real Handlebars library

**ROOT CAUSE IDENTIFIED**: ThinkAgent was using a custom lightweight PromptParser instead of the real Handlebars library. PageAgent and other components use the full Handlebars library (`import * as Handlebars from 'handlebars'`), which is why template rendering worked correctly there.

**The Fix**: Replace PromptParser with the real Handlebars library in ThinkAgent, matching the proven implementation used by PageAgent.

**Changes**:
- ThinkAgent now uses `Handlebars.compile()` for systemPrompt template rendering
- Consistent template engine across all agent types (PageAgent, EmailAgent, ThinkAgent)
- Added proper error handling for template compilation failures
- Removed unused PromptParser and PromptManager classes (were never actually used in the codebase)
- Retained debug logging to trace template rendering

This fixes the critical bug where `{{input.name}}` was sent literally to LLMs instead of being rendered as "Alice".
