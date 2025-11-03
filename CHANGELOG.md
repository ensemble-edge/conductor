# @ensemble-edge/conductor

## 1.0.0

### Major Changes

- 0fab408: Initial public release of Conductor v0.0.1

  **Core Features:**
  - 🚀 Edge-native orchestration on Cloudflare Workers
  - 📝 YAML-driven workflow definitions
  - 🧩 Four member types: Think (AI), Function (JS), Data (KV/D1/R2), API (HTTP)
  - 🔄 Immutable state management with access tracking
  - 💾 Built-in caching with KV integration
  - 🔁 Durable Objects for ExecutionState and HITL workflows
  - ⏰ Scheduled execution with cron triggers
  - 🪝 Webhook support for HTTP triggers
  - 🤝 Human-in-the-Loop (HITL) approval workflows
  - 📊 Async execution tracking

  **Testing & Development:**
  - 🧪 Built-in testing framework (276 tests passing, 40%+ coverage)
  - 🎯 Custom Vitest matchers for workflow testing
  - 🔧 Mock providers for AI, databases, and HTTP
  - 📦 TestConductor for comprehensive integration testing
  - 🛠️ CLI tools (init, add member, validate, upgrade)
  - 📚 SDK with client library and testing utilities

  **Platform Architecture:**
  - 🤖 AI provider catalog (Workers AI, OpenAI, Anthropic, Groq)
  - 🌐 AI Gateway integration for caching and analytics
  - 🔧 Smart routing modes (cloudflare, cloudflare-gateway, direct)
  - 📋 Model deprecation tracking
  - ☁️ Cloudflare-first with extensible platform support

  **Planned Features:**
  - Edgit integration for component versioning
  - MCP (Model Context Protocol) support
  - Scoring system for quality evaluation
