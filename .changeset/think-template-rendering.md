---
"@ensemble-edge/conductor": patch
---

Fix template rendering in ThinkAgent systemPrompt

ThinkAgent now properly renders Handlebars templates in systemPrompt before sending to LLMs. Previously, literal template syntax like `{{input.name}}` was sent directly to the AI provider instead of being rendered with actual values.

**Fixed**: Template variables (`{{input.*}}`, `{{env.*}}`, `{{context.*}}`) now render correctly in ThinkAgent system prompts.
