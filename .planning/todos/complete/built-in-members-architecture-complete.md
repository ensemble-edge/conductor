# Built-In Members Architecture

**Status:** Design Document
**Last Updated:** 2025-11-03

---

## Overview

Built-in members are pre-implemented, production-ready members that ship with Conductor. They provide "batteries included" functionality for common patterns like web scraping, validation, RAG, human-in-the-loop workflows, and HTTP operations.

### Key Requirements

1. **Auto-registration** - Built-in members automatically register themselves on import
2. **Discoverable** - Users can list available built-in members via API/CLI
3. **Versioned** - Each built-in member has a version for future updates
4. **Well-documented** - Each member has README, usage examples, and config schema
5. **Testable** - Independent test suites for each member
6. **Lazy-loadable** - Only load members when used (bundle size optimization)
7. **Extensible** - Users can override or extend built-in members
8. **Type-safe** - Full TypeScript support with exported types

---

## Directory Structure

```
src/members/
├── base-member.ts                      # Abstract base class (existing)
├── think-member.ts                     # Think member (existing)
├── function-member.ts                  # Function member (existing)
├── data-member.ts                      # Data member (existing)
├── api-member.ts                       # API member (existing)
│
├── built-in/                           # 🆕 Built-in members
│   ├── index.ts                        # Central registry and exports
│   ├── registry.ts                     # Built-in member registry
│   ├── types.ts                        # Shared types for built-in members
│   │
│   ├── scrape/                         # Web scraping member
│   │   ├── index.ts                    # Export ScrapeMember
│   │   ├── scrape-member.ts            # Main member class
│   │   ├── browser-renderer.ts         # CF Browser Rendering API client
│   │   ├── bot-detection.ts            # Bot protection detection logic
│   │   ├── html-parser.ts              # Tier 3 HTML parsing fallback
│   │   ├── markdown-converter.ts       # HTML → Markdown conversion
│   │   ├── types.ts                    # Type definitions
│   │   ├── README.md                   # Documentation and usage examples
│   │   └── __tests__/
│   │       ├── scrape-member.test.ts
│   │       ├── bot-detection.test.ts
│   │       └── html-parser.test.ts
│   │
│   ├── validate/                       # Validation and evaluation member
│   │   ├── index.ts
│   │   ├── validate-member.ts
│   │   ├── evaluators/
│   │   │   ├── base-evaluator.ts       # Abstract evaluator
│   │   │   ├── judge-evaluator.ts      # LLM-based evaluation
│   │   │   ├── nlp-evaluator.ts        # BLEU, ROUGE, perplexity
│   │   │   ├── embedding-evaluator.ts  # Semantic similarity
│   │   │   └── rule-evaluator.ts       # Custom rule-based
│   │   ├── types.ts
│   │   ├── README.md
│   │   └── __tests__/
│   │
│   ├── rag/                            # RAG member (Cloudflare native)
│   │   ├── index.ts
│   │   ├── rag-member.ts
│   │   ├── chunker.ts                  # Text chunking strategies
│   │   ├── embedder.ts                 # CF AI embeddings
│   │   ├── vectorize-client.ts         # CF Vectorize integration
│   │   ├── reranker.ts                 # Reranking algorithms
│   │   ├── types.ts
│   │   ├── README.md
│   │   └── __tests__/
│   │
│   ├── hitl/                           # Human-in-the-loop member
│   │   ├── index.ts
│   │   ├── hitl-member.ts
│   │   ├── approval-manager.ts         # State management
│   │   ├── notification.ts             # Notification channels
│   │   ├── durable-object.ts           # Durable Object for persistence
│   │   ├── types.ts
│   │   ├── README.md
│   │   └── __tests__/
│   │
│   └── fetch/                          # HTTP client member
│       ├── index.ts
│       ├── fetch-member.ts
│       ├── retry.ts                    # Retry logic with exponential backoff
│       ├── types.ts
│       ├── README.md
│       └── __tests__/
│
└── index.ts                            # Export all member types
```

---

## Built-In Member Registry

### `src/members/built-in/registry.ts`

Central registry for all built-in members with lazy loading and auto-discovery.

```typescript
/**
 * Built-In Member Registry
 *
 * Manages registration, discovery, and lazy loading of built-in members.
 */

import type { BaseMember } from '../base-member';
import type { MemberConfig } from '../../runtime/parser';

export interface BuiltInMemberMetadata {
  name: string;
  version: string;
  description: string;
  type: 'Function' | 'Data' | 'Scoring' | 'Transform';
  configSchema?: Record<string, any>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  tags?: string[];
  examples?: string[];
}

export type BuiltInMemberFactory = (config: MemberConfig, env: Env) => BaseMember;

/**
 * Built-In Member Registry
 *
 * Features:
 * - Lazy loading (only load members when used)
 * - Auto-discovery (list all available members)
 * - Versioning (each member has a version)
 * - Metadata (description, schemas, examples)
 */
export class BuiltInMemberRegistry {
  private members = new Map<string, {
    metadata: BuiltInMemberMetadata;
    factory: BuiltInMemberFactory;
    loaded: boolean;
  }>();

  /**
   * Register a built-in member
   */
  register(
    metadata: BuiltInMemberMetadata,
    factory: BuiltInMemberFactory
  ): void {
    this.members.set(metadata.name, {
      metadata,
      factory,
      loaded: false
    });
  }

  /**
   * Check if a member is built-in
   */
  isBuiltIn(name: string): boolean {
    return this.members.has(name);
  }

  /**
   * Get a built-in member instance
   */
  create(name: string, config: MemberConfig, env: Env): BaseMember {
    const entry = this.members.get(name);

    if (!entry) {
      throw new Error(
        `Built-in member "${name}" not found. ` +
        `Available: ${this.getAvailableNames().join(', ')}`
      );
    }

    // Create instance using factory (lazy loading)
    entry.loaded = true;
    return entry.factory(config, env);
  }

  /**
   * Get metadata for a built-in member
   */
  getMetadata(name: string): BuiltInMemberMetadata | undefined {
    return this.members.get(name)?.metadata;
  }

  /**
   * List all built-in members
   */
  list(): BuiltInMemberMetadata[] {
    return Array.from(this.members.values()).map(entry => entry.metadata);
  }

  /**
   * Get available member names
   */
  getAvailableNames(): string[] {
    return Array.from(this.members.keys());
  }

  /**
   * Get members by type
   */
  listByType(type: string): BuiltInMemberMetadata[] {
    return this.list().filter(m => m.type === type);
  }

  /**
   * Get members by tag
   */
  listByTag(tag: string): BuiltInMemberMetadata[] {
    return this.list().filter(m => m.tags?.includes(tag));
  }
}

// Singleton registry instance
let registry: BuiltInMemberRegistry | null = null;

export function getBuiltInRegistry(): BuiltInMemberRegistry {
  if (!registry) {
    registry = new BuiltInMemberRegistry();
    registerAllBuiltInMembers(registry);
  }
  return registry;
}

/**
 * Register all built-in members
 * This is called once when the registry is first accessed
 */
function registerAllBuiltInMembers(registry: BuiltInMemberRegistry): void {
  // Import and register each built-in member
  // This happens lazily, so only loaded when first accessed

  // Scrape member
  registry.register(
    {
      name: 'scrape',
      version: '1.0.0',
      description: '3-tier web scraping with bot protection and fallback strategies',
      type: 'Function',
      tags: ['web', 'scraping', 'cloudflare'],
      examples: ['basic-scrape', 'aggressive-scrape']
    },
    (config, env) => {
      const { ScrapeMember } = require('./scrape');
      return new ScrapeMember(config, env);
    }
  );

  // Validate member
  registry.register(
    {
      name: 'validate',
      version: '1.0.0',
      description: 'Validation and evaluation with pluggable evaluators',
      type: 'Scoring',
      tags: ['validation', 'evaluation', 'scoring'],
      examples: ['rule-validation', 'llm-judge', 'semantic-eval']
    },
    (config, env) => {
      const { ValidateMember } = require('./validate');
      return new ValidateMember(config, env);
    }
  );

  // RAG member
  registry.register(
    {
      name: 'rag',
      version: '1.0.0',
      description: 'RAG system using Cloudflare Vectorize and AI embeddings',
      type: 'Data',
      tags: ['rag', 'vectorize', 'embeddings', 'search'],
      examples: ['index-content', 'search-content', 'rag-qa']
    },
    (config, env) => {
      const { RAGMember } = require('./rag');
      return new RAGMember(config, env);
    }
  );

  // HITL member
  registry.register(
    {
      name: 'hitl',
      version: '1.0.0',
      description: 'Human-in-the-loop workflows with approval gates',
      type: 'Function',
      tags: ['workflow', 'approval', 'human-in-loop'],
      examples: ['approval-gate', 'manual-review', 'timeout-handling']
    },
    (config, env) => {
      const { HITLMember } = require('./hitl');
      return new HITLMember(config, env);
    }
  );

  // Fetch member
  registry.register(
    {
      name: 'fetch',
      version: '1.0.0',
      description: 'HTTP client with retry logic and exponential backoff',
      type: 'Function',
      tags: ['http', 'api', 'fetch'],
      examples: ['basic-fetch', 'retry-fetch', 'api-call']
    },
    (config, env) => {
      const { FetchMember } = require('./fetch');
      return new FetchMember(config, env);
    }
  );
}
```

---

## Built-In Member Base Pattern

### Standard Pattern for All Built-In Members

```typescript
// Example: src/members/built-in/scrape/scrape-member.ts
import { BaseMember, type MemberExecutionContext } from '../../base-member';
import type { MemberConfig } from '../../../runtime/parser';
import type { ScrapeConfig, ScrapeResult } from './types';

/**
 * Scrape Member - 3-tier web scraping with bot protection
 *
 * Tier 1: CF Browser (domcontentloaded) - Fast, ~350ms
 * Tier 2: CF Browser (networkidle2) - JS wait, ~2s
 * Tier 3: HTML parsing - Fallback, ~1.5s
 *
 * @version 1.0.0
 * @builtIn true
 */
export class ScrapeMember extends BaseMember {
  name = 'scrape';
  type = 'Function';
  builtIn = true;
  version = '1.0.0';

  private scrapeConfig: ScrapeConfig;

  constructor(config: MemberConfig, private readonly env: Env) {
    super(config);

    this.scrapeConfig = {
      strategy: config.config?.strategy || 'balanced',
      returnFormat: config.config?.returnFormat || 'markdown',
      blockResources: config.config?.blockResources || true,
      userAgent: config.config?.userAgent,
      timeout: config.config?.timeout || 30000
    };
  }

  protected async run(context: MemberExecutionContext): Promise<ScrapeResult> {
    const url = context.input.url;

    if (!url) {
      throw new Error('Scrape member requires "url" in input');
    }

    // Tier 1: Fast (domcontentloaded)
    // Tier 2: Slow (networkidle2)
    // Tier 3: HTML parsing fallback

    // Implementation...
  }

  // Static metadata for registry
  static getMetadata() {
    return {
      name: 'scrape',
      version: '1.0.0',
      description: '3-tier web scraping with bot protection',
      type: 'Function',
      configSchema: {
        strategy: { type: 'string', enum: ['fast', 'balanced', 'aggressive'] },
        returnFormat: { type: 'string', enum: ['markdown', 'html', 'text'] },
        blockResources: { type: 'boolean' },
        timeout: { type: 'number' }
      },
      inputSchema: {
        url: { type: 'string', required: true }
      },
      outputSchema: {
        markdown: { type: 'string' },
        html: { type: 'string' },
        tier: { type: 'number' },
        duration: { type: 'number' }
      }
    };
  }
}
```

---

## Integration with Executor

### How Built-In Members are Loaded

The executor should check if a member is built-in before looking for user-defined members:

```typescript
// src/runtime/executor.ts (modification)

import { getBuiltInRegistry } from '../members/built-in/registry';

export class EnsembleExecutor {
  async loadMember(memberConfig: MemberConfig, env: Env): Promise<BaseMember> {
    const registry = getBuiltInRegistry();

    // 1. Check if it's a built-in member
    if (registry.isBuiltIn(memberConfig.name)) {
      return registry.create(memberConfig.name, memberConfig, env);
    }

    // 2. Otherwise, load user-defined member from members/ directory
    return await this.loadUserMember(memberConfig, env);
  }

  private async loadUserMember(memberConfig: MemberConfig, env: Env): Promise<BaseMember> {
    // Existing logic to load from members/ directory
    // ...
  }
}
```

---

## Usage in Ensembles

### User's Ensemble YAML

Built-in members are used exactly like user-defined members:

```yaml
# ensembles/domain-profile/ensemble.yaml
name: domain-profile
description: Create rich domain profile using built-in members

flow:
  # Use built-in scrape member
  - member: scrape
    input:
      url: https://${input.domain}
    config:
      strategy: balanced
      returnFormat: markdown
    output: content

  # Use built-in validate member
  - member: validate
    input:
      content: ${steps.content.result.markdown}
    config:
      evalType: rule
      rules:
        - name: minLength
          check: content.length >= 800
          weight: 0.5
        - name: noBotProtection
          check: "!content.includes('cloudflare')"
          weight: 0.5
      threshold: 0.7
    output: validation

  # Use built-in rag member to index
  - member: rag
    when: ${steps.validation.passed}
    input:
      content: ${steps.content.result.markdown}
      id: ${input.domain}
      source: https://${input.domain}
    config:
      operation: index
      chunkStrategy: semantic
      chunkSize: 512
    output: indexed

  # Use built-in think member (existing)
  - member: think
    input:
      prompt: "Analyze this domain: ${steps.content.result.markdown}"
    config:
      model: claude-3-5-haiku-20241022
    output: analysis
```

---

## API Endpoints for Built-In Members

### List Built-In Members

```http
GET /v1/members/built-in
Authorization: Bearer sk_live_...
```

**Response:**
```json
{
  "members": [
    {
      "name": "scrape",
      "version": "1.0.0",
      "description": "3-tier web scraping with bot protection",
      "type": "Function",
      "tags": ["web", "scraping", "cloudflare"],
      "configSchema": {
        "strategy": { "type": "string", "enum": ["fast", "balanced", "aggressive"] }
      }
    },
    {
      "name": "validate",
      "version": "1.0.0",
      "description": "Validation and evaluation with pluggable evaluators",
      "type": "Scoring",
      "tags": ["validation", "evaluation"]
    }
  ]
}
```

### Get Built-In Member Details

```http
GET /v1/members/built-in/scrape
Authorization: Bearer sk_live_...
```

**Response:**
```json
{
  "name": "scrape",
  "version": "1.0.0",
  "description": "3-tier web scraping with bot protection and fallback strategies",
  "type": "Function",
  "tags": ["web", "scraping", "cloudflare"],
  "configSchema": {
    "strategy": {
      "type": "string",
      "enum": ["fast", "balanced", "aggressive"],
      "default": "balanced",
      "description": "Scraping strategy: fast (Tier 1 only), balanced (Tier 1+2), aggressive (all tiers)"
    },
    "returnFormat": {
      "type": "string",
      "enum": ["markdown", "html", "text"],
      "default": "markdown"
    }
  },
  "inputSchema": {
    "url": {
      "type": "string",
      "required": true,
      "description": "URL to scrape"
    }
  },
  "outputSchema": {
    "markdown": { "type": "string" },
    "tier": { "type": "number" },
    "duration": { "type": "number" }
  },
  "examples": [
    {
      "name": "basic-scrape",
      "description": "Simple web scraping",
      "yaml": "...",
      "input": { "url": "https://example.com" },
      "output": { "markdown": "..." }
    }
  ],
  "documentation": "https://docs.conductor.dev/built-in-members/scrape"
}
```

---

## CLI Commands for Built-In Members

### List Built-In Members

```bash
conductor members list --built-in
```

**Output:**
```
Built-in members:

  scrape (v1.0.0)
    3-tier web scraping with bot protection
    Type: Function
    Tags: web, scraping, cloudflare

  validate (v1.0.0)
    Validation and evaluation with pluggable evaluators
    Type: Scoring
    Tags: validation, evaluation

  rag (v1.0.0)
    RAG system using Cloudflare Vectorize
    Type: Data
    Tags: rag, vectorize, embeddings

  hitl (v1.0.0)
    Human-in-the-loop workflows
    Type: Function
    Tags: workflow, approval

  fetch (v1.0.0)
    HTTP client with retry logic
    Type: Function
    Tags: http, api
```

### Get Built-In Member Documentation

```bash
conductor members docs scrape
```

**Output:**
```
Scrape Member (v1.0.0)

Description:
  3-tier web scraping with bot protection and automatic fallback strategies.

Type: Function

Configuration:
  strategy: fast | balanced | aggressive (default: balanced)
    - fast: Tier 1 only (domcontentloaded, ~350ms)
    - balanced: Tier 1 + 2 (networkidle2, ~2s)
    - aggressive: All tiers including HTML parsing

  returnFormat: markdown | html | text (default: markdown)

Usage Example:
  - member: scrape
    input:
      url: https://example.com
    config:
      strategy: balanced
      returnFormat: markdown
    output: content

Documentation: https://docs.conductor.dev/built-in-members/scrape
```

---

## Testing Built-In Members

### Test Structure

Each built-in member has its own test suite:

```typescript
// src/members/built-in/scrape/__tests__/scrape-member.test.ts

import { describe, it, expect, vi } from 'vitest';
import { ScrapeMember } from '../scrape-member';
import type { MemberConfig } from '../../../../runtime/parser';

describe('ScrapeMember', () => {
  const mockConfig: MemberConfig = {
    name: 'scrape',
    type: 'Function',
    config: {
      strategy: 'balanced',
      returnFormat: 'markdown'
    }
  };

  const mockEnv = {
    BROWSER: { /* mock CF Browser Rendering binding */ }
  } as Env;

  it('should scrape with Tier 1 (fast)', async () => {
    const member = new ScrapeMember(mockConfig, mockEnv);

    const result = await member.execute({
      input: { url: 'https://example.com' },
      env: mockEnv,
      ctx: {} as ExecutionContext
    });

    expect(result.success).toBe(true);
    expect(result.data.tier).toBe(1);
    expect(result.data.markdown).toBeDefined();
  });

  it('should fallback to Tier 2 on bot protection', async () => {
    // Test bot protection detection and fallback
  });

  it('should fallback to Tier 3 (HTML parsing) on failure', async () => {
    // Test HTML parsing fallback
  });

  it('should validate config schema', () => {
    expect(() => {
      new ScrapeMember({
        ...mockConfig,
        config: { strategy: 'invalid' }
      }, mockEnv);
    }).toThrow();
  });
});
```

---

## Benefits of This Architecture

### 1. Lazy Loading
- Built-in members are only loaded when used
- Optimizes bundle size for edge deployments
- Fast startup time

### 2. Discoverable
- Users can list all built-in members via API/CLI
- Metadata includes description, version, schemas, examples
- Searchable by type, tags

### 3. Versioned
- Each built-in member has a version
- Future versions can coexist (e.g., `scrape@1.0.0` vs `scrape@2.0.0`)
- Breaking changes are clear

### 4. Testable
- Each built-in member has independent test suite
- Can mock dependencies (CF bindings, APIs)
- Fast test execution

### 5. Extensible
- Users can override built-in members by creating their own
- User members take precedence over built-in members
- Can wrap or extend built-in members

### 6. Type-Safe
- Full TypeScript support
- Exported types for each member (Config, Input, Output)
- IDE autocomplete for config options

### 7. Well-Documented
- Each member has README with usage examples
- Config schema is exported for validation
- API returns full documentation URLs

---

## Migration Path

### Phase 1: Create Registry Infrastructure (Week 1)
1. Create `src/members/built-in/registry.ts`
2. Create `src/members/built-in/types.ts`
3. Update executor to check built-in registry
4. Add tests for registry

### Phase 2: Implement Built-In Members (Weeks 2-6)
1. Scrape member (Week 1)
2. Validate member (Week 2)
3. RAG member (Week 3)
4. HITL member (Week 4)
5. Fetch member (Week 5)
6. Documentation and examples (Week 6)

### Phase 3: API Integration (Weeks 7-8)
1. Add `/v1/members/built-in` endpoint
2. Add `/v1/members/built-in/:name` endpoint
3. Update OpenAPI spec
4. Add to TypeScript SDK

### Phase 4: CLI Integration (Week 9)
1. Add `conductor members list --built-in`
2. Add `conductor members docs <name>`
3. Add autocomplete for built-in member names

---

## Next Steps

1. **Review this architecture** - Ensure it meets all requirements
2. **Create feature branch** - `git checkout -b feature/built-in-members`
3. **Create directory structure** - `mkdir -p src/members/built-in/{scrape,validate,rag,hitl,fetch}`
4. **Implement registry** - Start with `registry.ts` and `types.ts`
5. **Implement first member** - Start with Scrape member (most complex)

---

**This architecture ensures built-in members are:**
- ✅ Auto-registered and discoverable
- ✅ Lazy-loaded for optimal bundle size
- ✅ Versioned for future updates
- ✅ Well-documented with schemas and examples
- ✅ Independently testable
- ✅ Type-safe with full TypeScript support
- ✅ Extensible by users
- ✅ Scalable to large corpus of built-in members
