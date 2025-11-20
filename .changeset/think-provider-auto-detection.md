---
"@ensemble-edge/conductor": patch
---

Fix critical bugs in v1.12.0 auto-discovery and think agents

**Provider Auto-Detection:** ThinkAgent now automatically detects the AI provider from model name prefix:
- Models starting with @cf/ → Cloudflare Workers AI
- Models starting with gpt- or o1- → OpenAI
- Models starting with claude- → Anthropic

Explicit `provider` setting in YAML config takes precedence over auto-detection.

**Missing /api Export:** Added `/api` export to package.json, enabling imports of `createAutoDiscoveryAPI` and related auto-discovery functions.

**Unicode Support:** Added UTF-8 charset configuration to template vite.config.ts (Rolldown and esbuild), fixing build failures when source files contain Unicode characters like emojis.
