# Members Directory

This directory contains all member implementations for Conductor - both built-in members that ship with the framework and user-defined members that you create for your specific use cases.

---

## Directory Structure

```
src/members/
├── base-member.ts           # Abstract base class for all members
├── think-member.ts          # Built-in Think member (AI reasoning)
├── function-member.ts       # Built-in Function member (user-defined functions)
├── data-member.ts           # Built-in Data member (storage operations)
├── api-member.ts            # Built-in API member (HTTP requests)
│
├── built-in/                # 🔋 Built-in members (ship with Conductor)
│   ├── registry.ts          # Built-in member registry
│   ├── scrape/              # Web scraping with 3-tier fallback
│   ├── validate/            # Validation and evaluation framework
│   ├── rag/                 # RAG using Cloudflare Vectorize
│   ├── hitl/                # Human-in-the-loop workflows
│   └── fetch/               # HTTP client with retry logic
│
└── lib/                     # 🛠️ Shared utilities for custom members
    ├── README.md            # Documentation for lib folder
    └── (shared code)        # Utilities, helpers, types, etc.
```

---

## Built-In Members

Built-in members are production-ready, pre-implemented members that ship with Conductor. They provide "batteries included" functionality for common patterns.

### Available Built-In Members

| Member | Type | Description |
|--------|------|-------------|
| **scrape** | Built-in | 3-tier web scraping with bot protection and fallback |
| **validate** | Built-in | Validation and evaluation with pluggable evaluators |
| **rag** | Built-in | RAG system using Cloudflare Vectorize and AI embeddings |
| **hitl** | Built-in | Human-in-the-loop workflows with approval gates |
| **fetch** | Built-in | HTTP client with retry logic and exponential backoff |

### Using Built-In Members

Built-in members work exactly like user-defined members in your ensembles:

```yaml
# ensembles/my-ensemble/ensemble.yaml
flow:
  - member: scrape
    input:
      url: https://example.com
    config:
      strategy: balanced
    output: content
```

No implementation needed - just use them!

---

## User-Defined Members

Your custom members should be created in the root of your Conductor project:

```
your-conductor-project/
├── conductor.yaml
├── ensembles/
├── members/                  # 👈 Your custom members go here
│   ├── lib/                  # Shared utilities for your members
│   │   ├── normalizers.ts
│   │   └── validators.ts
│   │
│   └── domain-classifier/    # Example custom member
│       ├── member.yaml
│       └── index.ts
└── wrangler.toml
```

See the [lib/README.md](lib/README.md) for details on shared utilities.

---

**Happy building with Conductor! 🚀**
