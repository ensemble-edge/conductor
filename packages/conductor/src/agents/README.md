# Members Directory

This directory contains all agent implementations for Conductor - both built-in agents that ship with the framework and user-defined agents that you create for your specific use cases.

---

## Directory Structure

```
src/agents/
├── base-agent.ts           # Abstract base class for all agents
├── think-agent.ts          # Built-in Think agent (AI reasoning)
├── function-agent.ts       # Built-in Function agent (user-defined functions)
├── data-agent.ts           # Built-in Data agent (storage operations)
├── api-agent.ts            # Built-in API agent (HTTP requests)
│
├── built-in/                # 🔋 Built-in agents (ship with Conductor)
│   ├── registry.ts          # Built-in agent registry
│   ├── scrape/              # Web scraping with 3-tier fallback
│   ├── validate/            # Validation and evaluation framework
│   ├── rag/                 # RAG using Cloudflare Vectorize
│   ├── hitl/                # Human-in-the-loop workflows
│   └── fetch/               # HTTP client with retry logic
│
└── lib/                     # 🛠️ Shared utilities for custom agents
    ├── README.md            # Documentation for lib folder
    └── (shared code)        # Utilities, helpers, types, etc.
```

---

## Built-In Members

Built-in agents are production-ready, pre-implemented agents that ship with Conductor. They provide "batteries included" functionality for common patterns.

### Available Built-In Members

| Agent | Type | Description |
|--------|------|-------------|
| **scrape** | Built-in | 3-tier web scraping with bot protection and fallback |
| **validate** | Built-in | Validation and evaluation with pluggable evaluators |
| **rag** | Built-in | RAG system using Cloudflare Vectorize and AI embeddings |
| **hitl** | Built-in | Human-in-the-loop workflows with approval gates |
| **fetch** | Built-in | HTTP client with retry logic and exponential backoff |

### Using Built-In Members

Built-in agents work exactly like user-defined agents in your ensembles:

```yaml
# ensembles/my-ensemble/ensemble.yaml
flow:
  - agent: scrape
    input:
      url: https://example.com
    config:
      strategy: balanced
    output: content
```

No implementation needed - just use them!

---

## User-Defined Members

Your custom agents should be created in the root of your Conductor project:

```
your-conductor-project/
├── conductor.yaml
├── ensembles/
├── agents/                  # 👈 Your custom agents go here
│   ├── lib/                  # Shared utilities for your agents
│   │   ├── normalizers.ts
│   │   └── validators.ts
│   │
│   └── domain-classifier/    # Example custom agent
│       ├── agent.yaml
│       └── index.ts
└── wrangler.toml
```

See the [lib/README.md](lib/README.md) for details on shared utilities.

---

**Happy building with Conductor! 🚀**
