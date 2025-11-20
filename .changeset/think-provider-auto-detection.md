---
"@ensemble-edge/conductor": patch
---

Fix ThinkAgent provider auto-detection for Cloudflare Workers AI models

ThinkAgent now automatically detects the AI provider from model name prefix:
- Models starting with @cf/ → Cloudflare Workers AI
- Models starting with gpt- or o1- → OpenAI
- Models starting with claude- → Anthropic

Explicit `provider` setting in YAML config takes precedence over auto-detection.

Fixes issue where Cloudflare Workers AI models (@cf/) were incorrectly defaulting to Anthropic API, causing "API key not found" errors even with correct Workers AI configuration.
