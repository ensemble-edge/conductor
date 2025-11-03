# Conductor Implementation Plan (Revised)

**Status:** Core architecture complete
**Goal:** Production-ready with batteries-included members and world-class API
**Changes:** Skip migration validation (Phase 2), add HITL/RAG/Memory/Evals from inspired-improvements

---

## Strategic Approach

**Philosophy:**
- "Batteries included" - ship powerful built-in members
- Edge-first - leverage Cloudflare native functionality (Vectorize, Durable Objects, D1)
- Production-ready from day one

**What we're building:**
1. **Built-in members** - scrape, validate, fetch, HITL, RAG
2. **Enhanced frameworks** - Memory system, Evaluation framework
3. **World-class API** - REST API with streaming, webhooks, SDK
4. **Core utilities** - Normalization, prompt versioning

**What we're skipping:**
- ~~Phase 2 migration validation~~ (trust the design, validate in production)

---

## Phase 1: Built-In Members & Core Systems (Weeks 1-6)

### Week 1: Scrape Member (Critical)
**Priority:** 🔴 P0 - Most complex, validates architecture

**What to build:**
```
src/members/built-in/
├── scrape/
│   ├── scrape-member.ts       # Main member class
│   ├── browser-renderer.ts    # CF Browser Rendering API client
│   ├── bot-detection.ts       # Bot protection detection
│   ├── html-parser.ts         # Tier 3 HTML parsing
│   └── __tests__/
│       └── scrape-member.test.ts
```

**Implementation:**
```typescript
// src/members/built-in/scrape/scrape-member.ts
export class ScrapeMember extends BaseMember {
  name = 'scrape';
  type = MemberType.Function;
  builtIn = true;

  async run(context: MemberExecutionContext): Promise<ScrapeResult> {
    const url = context.input.url;
    const strategy = context.config?.strategy || 'balanced';

    // 🥇 Tier 1: CF Browser (domcontentloaded) - Fast, ~350ms
    try {
      const result = await this.tier1Fast(url);
      if (this.isSuccessful(result)) {
        return { ...result, tier: 1 };
      }
    } catch (error) {
      console.log('Tier 1 failed, trying Tier 2');
    }

    if (strategy === 'fast') return this.fallbackResult(url);

    // 🥈 Tier 2: CF Browser (networkidle2) - JS wait, ~2s
    try {
      const result = await this.tier2Slow(url);
      if (this.isSuccessful(result)) {
        return { ...result, tier: 2 };
      }
    } catch (error) {
      console.log('Tier 2 failed, trying Tier 3');
    }

    if (strategy === 'balanced') return this.fallbackResult(url);

    // 🥉 Tier 3: Raw HTML fetch + parsing - ~1.5s
    const result = await this.tier3HTMLParsing(url);
    return { ...result, tier: 3 };
  }

  private isSuccessful(result: any): boolean {
    // Bot protection detection
    return result.content.length >= 800 &&
           !this.detectBotProtection(result.content);
  }
}
```

**Deliverables:**
- [x] CF Browser Rendering API client
- [x] 3-tier fallback logic
- [x] Bot protection detection (800 char threshold, keywords)
- [x] Resource/pattern blocking (analytics, tracking)
- [x] HTML → Markdown conversion
- [x] Per-tier caching
- [x] Tests for all tiers

---

### Week 2: Validate Member + Evaluation Framework
**Priority:** 🔴 P0 - Used by scrape, foundation for evals

**What to build:**
```
src/members/built-in/
├── validate/
│   ├── validate-member.ts     # Rule-based validation
│   ├── evaluators/
│   │   ├── judge-evaluator.ts     # LLM-based assessment
│   │   ├── nlp-evaluator.ts       # BLEU, ROUGE, perplexity
│   │   ├── embedding-evaluator.ts # Semantic similarity
│   │   └── rule-evaluator.ts      # Custom rules
│   └── __tests__/
```

**Implementation:**
```typescript
// src/members/built-in/validate/validate-member.ts
export class ValidateMember extends BaseMember {
  name = 'validate';
  type = MemberType.Scoring;
  builtIn = true;

  async run(context: MemberExecutionContext): Promise<ValidationResult> {
    const evalType = context.config?.evalType || 'rule';
    const evaluator = this.getEvaluator(evalType);

    const scores = await evaluator.evaluate(
      context.input.content,
      context.config
    );

    return {
      passed: scores.average >= (context.config?.threshold || 0.7),
      scores: scores,
      details: scores.breakdown
    };
  }

  private getEvaluator(type: string): Evaluator {
    switch (type) {
      case 'judge':
        return new JudgeEvaluator();     // LLM-based
      case 'nlp':
        return new NLPEvaluator();       // BLEU, ROUGE
      case 'embedding':
        return new EmbeddingEvaluator(); // Semantic similarity
      default:
        return new RuleEvaluator();      // Custom rules
    }
  }
}
```

**Evaluation Framework:**
```yaml
# Example: Judge eval (LLM-based)
evalType: judge
criteria:
  - name: accuracy
    description: Is the information factually correct?
    weight: 0.4
  - name: relevance
    description: Is the content relevant to the query?
    weight: 0.3
  - name: completeness
    description: Does it cover all necessary points?
    weight: 0.3
threshold: 0.8

# Example: NLP eval (statistical)
evalType: nlp
metrics:
  - bleu
  - rouge-l
  - perplexity
reference: "expected output text"
threshold: 0.75

# Example: Embedding eval (semantic)
evalType: embedding
model: "@cf/baai/bge-base-en-v1.5"
reference: "expected meaning"
threshold: 0.85

# Example: Rule eval (custom)
evalType: rule
rules:
  - name: minLength
    check: content.length >= 800
    weight: 0.4
  - name: noBotProtection
    check: "!content.includes('cloudflare')"
    weight: 0.4
  - name: hasWebsiteElements
    check: "content.includes('home')"
    weight: 0.2
threshold: 0.7
```

**Deliverables:**
- [x] ValidateMember with pluggable evaluators
- [x] Judge evaluator (LLM-based assessment)
- [x] NLP evaluator (BLEU, ROUGE, perplexity)
- [x] Embedding evaluator (semantic similarity)
- [x] Rule evaluator (custom rules)
- [x] Integration with scrape member
- [x] Tests for all evaluator types

---

### Week 3: RAG Member (Cloudflare Native)
**Priority:** 🟡 P1 - Fundamental for AI agents

**What to build:**
```
src/members/built-in/
├── rag/
│   ├── rag-member.ts          # Main RAG member
│   ├── chunker.ts             # Text chunking strategies
│   ├── embedder.ts            # CF AI embeddings
│   ├── vectorize-client.ts    # CF Vectorize integration
│   ├── reranker.ts            # Reranking algorithms
│   └── __tests__/
```

**Implementation:**
```typescript
// src/members/built-in/rag/rag-member.ts
export class RAGMember extends BaseMember {
  name = 'rag';
  type = MemberType.Data;
  builtIn = true;

  async run(context: MemberExecutionContext): Promise<RAGResult> {
    const operation = context.config?.operation || 'search';

    switch (operation) {
      case 'index':
        return await this.indexContent(context);
      case 'search':
        return await this.searchContent(context);
      default:
        throw new Error(`Unknown RAG operation: ${operation}`);
    }
  }

  // Index content into Vectorize
  private async indexContent(context: MemberExecutionContext): Promise<RAGResult> {
    const content = context.input.content;

    // 1. Chunk content
    const chunks = await this.chunker.chunk(content, {
      strategy: context.config?.chunkStrategy || 'semantic',
      size: context.config?.chunkSize || 512,
      overlap: context.config?.overlap || 50
    });

    // 2. Generate embeddings using Cloudflare AI
    const embeddings = await this.embedder.embed(chunks, {
      model: context.config?.embeddingModel || '@cf/baai/bge-base-en-v1.5'
    });

    // 3. Store in Vectorize
    const vectorize = this.getVectorizeIndex(context.env);
    await vectorize.upsert(embeddings.map((emb, i) => ({
      id: `${context.input.id}-chunk-${i}`,
      values: emb,
      metadata: {
        content: chunks[i],
        source: context.input.source,
        chunkIndex: i
      }
    })));

    return {
      indexed: chunks.length,
      chunks: chunks.length,
      embeddingModel: context.config?.embeddingModel
    };
  }

  // Search content in Vectorize
  private async searchContent(context: MemberExecutionContext): Promise<RAGResult> {
    const query = context.input.query;

    // 1. Generate query embedding
    const queryEmbedding = await this.embedder.embed([query], {
      model: context.config?.embeddingModel || '@cf/baai/bge-base-en-v1.5'
    });

    // 2. Search Vectorize
    const vectorize = this.getVectorizeIndex(context.env);
    const results = await vectorize.query(queryEmbedding[0], {
      topK: context.config?.topK || 5,
      returnValues: true,
      returnMetadata: true
    });

    // 3. Rerank results (optional)
    let rankedResults = results;
    if (context.config?.rerank) {
      rankedResults = await this.reranker.rerank(query, results, {
        algorithm: context.config?.rerankAlgorithm || 'cross-encoder'
      });
    }

    return {
      results: rankedResults.map(r => ({
        content: r.metadata.content,
        score: r.score,
        source: r.metadata.source
      })),
      count: rankedResults.length,
      reranked: context.config?.rerank || false
    };
  }
}
```

**Usage Examples:**
```yaml
# Index content into RAG
flow:
  - member: scrape
    input:
      url: https://example.com
    output: content

  - member: rag
    input:
      content: ${steps.content.result.markdown}
      id: example-com
      source: https://example.com
    config:
      operation: index
      chunkStrategy: semantic  # or 'fixed', 'recursive'
      chunkSize: 512
      overlap: 50
      embeddingModel: "@cf/baai/bge-base-en-v1.5"

# Search RAG
flow:
  - member: rag
    input:
      query: "What is the company's mission?"
    config:
      operation: search
      topK: 5
      rerank: true
      rerankAlgorithm: cross-encoder
    output: context

  - member: think
    input:
      prompt: "Answer this question: {{query}}"
      context: ${steps.context.results}
```

**Deliverables:**
- [x] RAGMember with index/search operations
- [x] Chunking strategies (fixed, semantic, recursive)
- [x] CF AI embeddings integration
- [x] CF Vectorize client
- [x] Reranking algorithms (cross-encoder, MMR)
- [x] Tests for chunking and embedding
- [x] Example ensembles

---

### Week 4: HITL Member (Human-in-the-Loop)
**Priority:** 🟡 P1 - Critical for production workflows

**What to build:**
```
src/members/built-in/
├── hitl/
│   ├── hitl-member.ts         # Main HITL member
│   ├── approval-manager.ts    # Approval state management
│   ├── notification.ts        # Notification channels (email, Slack)
│   └── __tests__/
```

**Implementation:**
```typescript
// src/members/built-in/hitl/hitl-member.ts
export class HITLMember extends BaseMember {
  name = 'hitl';
  type = MemberType.Function;
  builtIn = true;

  async run(context: MemberExecutionContext): Promise<HITLResult> {
    const action = context.config?.action || 'approve';

    switch (action) {
      case 'suspend':
        return await this.suspendForApproval(context);
      case 'resume':
        return await this.resumeExecution(context);
      case 'approve':
        return await this.requestApproval(context);
      default:
        throw new Error(`Unknown HITL action: ${action}`);
    }
  }

  // Suspend execution and wait for approval
  private async suspendForApproval(context: MemberExecutionContext): Promise<HITLResult> {
    const executionId = context.executionId;
    const timeout = context.config?.timeout || 86400000; // 24 hours default

    // 1. Store execution state in Durable Object
    const approvalDO = this.getApprovalDO(context.env, executionId);
    await approvalDO.suspend({
      executionId: executionId,
      state: context.state,
      suspendedAt: Date.now(),
      expiresAt: Date.now() + timeout,
      approvalData: context.input.approvalData
    });

    // 2. Send notification
    if (context.config?.notificationChannel) {
      await this.sendNotification(
        context.config.notificationChannel,
        context.input.approvalData,
        executionId
      );
    }

    // 3. Return suspend response
    return {
      status: 'suspended',
      executionId: executionId,
      approvalUrl: `https://your-app.com/approve/${executionId}`,
      expiresAt: Date.now() + timeout
    };
  }

  // Resume execution after approval
  private async resumeExecution(context: MemberExecutionContext): Promise<HITLResult> {
    const executionId = context.input.executionId;
    const approved = context.input.approved;

    // 1. Get execution state from Durable Object
    const approvalDO = this.getApprovalDO(context.env, executionId);
    const state = await approvalDO.resume(executionId, approved);

    // 2. Return resume response
    return {
      status: approved ? 'approved' : 'rejected',
      executionId: executionId,
      state: state
    };
  }
}
```

**Usage Example:**
```yaml
# Workflow with approval gate
flow:
  - member: think
    input:
      prompt: "Analyze this transaction for fraud"
      transaction: ${input.transaction}
    output: analysis

  # Suspend for approval if high-risk
  - member: hitl
    when: ${steps.analysis.result.risk_score > 0.8}
    config:
      action: suspend
      timeout: 86400000  # 24 hours
      notificationChannel: slack
    input:
      approvalData:
        transaction: ${input.transaction}
        analysis: ${steps.analysis.result}
        risk_score: ${steps.analysis.result.risk_score}
    output: approval

  # Execute transaction after approval
  - member: execute-transaction
    when: ${steps.approval.status == 'approved'}
    input:
      transaction: ${input.transaction}
```

**Approval Flow:**
1. User triggers workflow
2. HITL member suspends execution
3. Notification sent (Slack, email, webhook)
4. Human reviews and approves/rejects
5. Workflow resumes from suspension point
6. Execution continues or aborts

**Deliverables:**
- [x] HITLMember with suspend/resume
- [x] Durable Object for state persistence
- [x] Notification system (email, Slack, webhook)
- [x] Approval UI (basic HTML form)
- [x] Timeout handling
- [x] Tests for suspend/resume flow

---

### Week 5: Enhanced Memory System
**Priority:** 🟡 P1 - Critical for conversational AI

**What to build:**
```
src/runtime/
├── memory/
│   ├── memory-manager.ts      # Hierarchical memory system
│   ├── working-memory.ts      # Current execution context
│   ├── session-memory.ts      # Conversation/user session
│   ├── long-term-memory.ts    # Persistent user data
│   ├── semantic-memory.ts     # Vector-based retrieval
│   └── __tests__/
```

**Architecture:**
```typescript
// src/runtime/memory/memory-manager.ts
export class MemoryManager {
  private workingMemory: WorkingMemory;      // Current execution
  private sessionMemory: SessionMemory;      // Current session
  private longTermMemory: LongTermMemory;    // Persistent user data
  private semanticMemory: SemanticMemory;    // Vector search

  constructor(
    private readonly env: Env,
    private readonly userId?: string,
    private readonly sessionId?: string
  ) {
    this.workingMemory = new WorkingMemory();
    this.sessionMemory = new SessionMemory(env, sessionId);
    this.longTermMemory = new LongTermMemory(env, userId);
    this.semanticMemory = new SemanticMemory(env, userId);
  }

  // Working Memory: Current execution context
  async getWorkingMemory(): Promise<Record<string, any>> {
    return this.workingMemory.getAll();
  }

  async setWorkingMemory(key: string, value: any): Promise<void> {
    this.workingMemory.set(key, value);
  }

  // Session Memory: Conversation history (ephemeral, KV with TTL)
  async getSessionMemory(): Promise<ConversationHistory> {
    return await this.sessionMemory.get();
  }

  async addToSessionMemory(message: Message): Promise<void> {
    await this.sessionMemory.add(message);
  }

  // Long-Term Memory: Persistent user preferences (D1)
  async getLongTermMemory(key: string): Promise<any> {
    return await this.longTermMemory.get(key);
  }

  async setLongTermMemory(key: string, value: any): Promise<void> {
    await this.longTermMemory.set(key, value);
  }

  // Semantic Memory: Vector-based retrieval (Vectorize)
  async searchSemanticMemory(query: string, options?: SearchOptions): Promise<Memory[]> {
    return await this.semanticMemory.search(query, options);
  }

  async addToSemanticMemory(content: string, metadata?: any): Promise<void> {
    await this.semanticMemory.add(content, metadata);
  }

  // Memory compression: Summarize older context
  async compressMemory(maxTokens: number): Promise<void> {
    const sessionHistory = await this.sessionMemory.get();
    const compressed = await this.summarizeHistory(sessionHistory, maxTokens);
    await this.sessionMemory.replace(compressed);
  }
}
```

**Memory Layers:**
```typescript
// Working Memory: In-memory, current execution
class WorkingMemory {
  private memory = new Map<string, any>();

  set(key: string, value: any): void {
    this.memory.set(key, value);
  }

  get(key: string): any {
    return this.memory.get(key);
  }

  getAll(): Record<string, any> {
    return Object.fromEntries(this.memory);
  }
}

// Session Memory: KV with TTL, conversation history
class SessionMemory {
  constructor(
    private readonly env: Env,
    private readonly sessionId?: string
  ) {}

  async get(): Promise<ConversationHistory> {
    const key = `session:${this.sessionId}`;
    const data = await this.env.SESSIONS.get(key);
    return data ? JSON.parse(data) : { messages: [] };
  }

  async add(message: Message): Promise<void> {
    const history = await this.get();
    history.messages.push(message);

    const key = `session:${this.sessionId}`;
    await this.env.SESSIONS.put(key, JSON.stringify(history), {
      expirationTtl: 3600 // 1 hour session
    });
  }
}

// Long-Term Memory: D1, persistent user data
class LongTermMemory {
  constructor(
    private readonly env: Env,
    private readonly userId?: string
  ) {}

  async get(key: string): Promise<any> {
    const result = await this.env.DB.prepare(
      'SELECT value FROM long_term_memory WHERE user_id = ? AND key = ?'
    ).bind(this.userId, key).first();

    return result ? JSON.parse(result.value) : null;
  }

  async set(key: string, value: any): Promise<void> {
    await this.env.DB.prepare(
      'INSERT OR REPLACE INTO long_term_memory (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)'
    ).bind(this.userId, key, JSON.stringify(value), Date.now()).run();
  }
}

// Semantic Memory: Vectorize, vector-based retrieval
class SemanticMemory {
  constructor(
    private readonly env: Env,
    private readonly userId?: string
  ) {}

  async search(query: string, options?: SearchOptions): Promise<Memory[]> {
    // 1. Generate query embedding
    const embedding = await this.env.AI.run(
      '@cf/baai/bge-base-en-v1.5',
      { text: query }
    );

    // 2. Search Vectorize
    const vectorize = this.env.VECTORIZE;
    const results = await vectorize.query(embedding.data[0], {
      topK: options?.topK || 5,
      filter: { user_id: this.userId }
    });

    return results.matches.map(m => ({
      content: m.metadata.content,
      score: m.score,
      timestamp: m.metadata.timestamp
    }));
  }

  async add(content: string, metadata?: any): Promise<void> {
    // 1. Generate embedding
    const embedding = await this.env.AI.run(
      '@cf/baai/bge-base-en-v1.5',
      { text: content }
    );

    // 2. Store in Vectorize
    const vectorize = this.env.VECTORIZE;
    await vectorize.upsert([{
      id: `${this.userId}-${Date.now()}`,
      values: embedding.data[0],
      metadata: {
        user_id: this.userId,
        content: content,
        timestamp: Date.now(),
        ...metadata
      }
    }]);
  }
}
```

**Usage in Ensembles:**
```yaml
# Conversational agent with memory
name: chat-agent
memory:
  enabled: true
  layers:
    working: true      # Current execution context
    session: true      # Conversation history (1 hour TTL)
    longTerm: true     # User preferences (persistent)
    semantic: true     # Vector-based retrieval

flow:
  - member: think
    input:
      prompt: "Answer this question using context from memory"
      query: ${input.message}
      working_context: ${memory.working}
      session_history: ${memory.session}
      relevant_memories: ${memory.semantic.search(input.message)}
    output: response

  # Store response in memory
  - member: store-memory
    input:
      content: ${steps.response.result}
      type: semantic
```

**Deliverables:**
- [x] MemoryManager with hierarchical layers
- [x] WorkingMemory (in-memory, current execution)
- [x] SessionMemory (KV with TTL, conversation)
- [x] LongTermMemory (D1, persistent user data)
- [x] SemanticMemory (Vectorize, vector search)
- [x] Memory compression/summarization
- [x] Integration with StateManager
- [x] Tests for all memory layers

---

### Week 6: Core Utilities
**Priority:** 🔴 P0 - Foundation for everything

**What to build:**
```
src/utils/
├── normalization.ts           # Normalizer registry
├── url-resolver.ts            # URL resolution
└── __tests__/

src/prompts/
├── prompt-manager.ts          # Prompt loading/caching
├── prompt-parser.ts           # Template substitution
├── prompt-schema.ts           # YAML schema
└── __tests__/
```

**Normalization:**
```typescript
// src/utils/normalization.ts
export const Normalizers = {
  url: (url: string) => normalizeURL(url),
  domain: (domain: string) => normalizeDomain(domain),
  company: (company: string) => normalizeCompany(company),
  email: (email: string) => normalizeEmail(email)
};

// Extend BaseMember
class BaseMember {
  protected normalize(input: any, type: NormalizerType): any {
    return Normalizers[type](input);
  }

  protected async resolveUrl(domain: string) {
    return new URLResolver().resolve(domain);
  }
}
```

**Prompt Versioning:**
```typescript
// src/prompts/prompt-manager.ts
export class PromptManager {
  private cache = new Map<string, Prompt>();

  async loadPrompt(promptId: string, version?: string): Promise<Prompt> {
    const cacheKey = version ? `${promptId}@${version}` : promptId;

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Load from prompts/ directory
    const promptPath = version
      ? `prompts/${promptId}-${version}.yaml`
      : `prompts/${promptId}.yaml`;

    const promptYaml = await fs.readFile(promptPath, 'utf-8');
    const prompt = YAML.parse(promptYaml);

    // Cache it
    this.cache.set(cacheKey, prompt);

    return prompt;
  }

  substituteVariables(template: string, variables: Record<string, any>): string {
    // Handlebars-style {{variable}} substitution
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] || '';
    });
  }
}
```

**Deliverables:**
- [x] Normalization utilities (URL, domain, company, email)
- [x] URLResolver with www fallback
- [x] BaseMember helper methods
- [x] PromptManager (YAML loading, caching)
- [x] Template variable substitution (Handlebars)
- [x] Version pinning support
- [x] Tests for all utilities

---

## Phase 3: World-Class API (Weeks 7-10)

### Week 7: Core API Router
**Priority:** 🔴 P0 - Production deployment

**What to build:**
```
src/api/
├── router.ts                  # Main API router (Hono)
├── middleware/
│   ├── auth.ts                # API key validation
│   ├── error-handler.ts       # Standardized errors
│   ├── cors.ts                # CORS headers
│   └── validate.ts            # Request validation (Zod)
├── routes/
│   ├── ensembles/
│   │   └── execute.ts         # POST /v1/ensembles/:name/execute
│   ├── members/
│   │   ├── list.ts            # GET /v1/members
│   │   └── get.ts             # GET /v1/members/:name
│   └── health.ts              # GET /health
└── schemas/
    ├── execute-request.ts     # Zod schemas
    └── error-response.ts
```

**Implementation:**
```typescript
// src/api/router.ts
import { Hono } from 'hono';
import { authenticateRequest } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', errorHandler);
app.use('/v1/*', authenticateRequest);

// Routes
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/v1/ensembles/:name/execute', async (c) => {
  const name = c.req.param('name');
  const body = await c.req.json();

  // Execute ensemble
  const executor = new EnsembleExecutor(c.env);
  const result = await executor.execute(name, body.input, body.config);

  return c.json(result);
});

app.get('/v1/members', async (c) => {
  // List all members (built-in + custom)
  const members = await listMembers(c.env);
  return c.json({ members });
});

export default app;
```

**Deliverables:**
- [x] Hono router setup
- [x] Authentication middleware (API key validation)
- [x] Error handling middleware
- [x] CORS middleware
- [x] Execute ensemble endpoint (sync)
- [x] List members endpoint
- [x] Get member details endpoint
- [x] Health check endpoint
- [x] Request validation (Zod schemas)
- [x] Tests for all endpoints

---

### Week 8: OpenAPI & SDK Generation
**Priority:** 🟡 P1 - Developer experience

**What to build:**
```
src/api/
├── schemas/
│   └── openapi.ts             # OpenAPI 3.1 spec
└── client/
    ├── sdk-generator.ts       # TypeScript SDK generator
    └── examples/              # SDK usage examples
```

**Implementation:**
```typescript
// src/api/schemas/openapi.ts
export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Conductor API',
    version: '1.0.0',
    description: 'World-class REST API for AI agent orchestration'
  },
  servers: [
    { url: 'https://api.conductor.dev/v1', description: 'Production' }
  ],
  paths: {
    '/ensembles/{name}/execute': {
      post: {
        summary: 'Execute an ensemble',
        operationId: 'executeEnsemble',
        // ... full spec
      }
    }
  }
};
```

**Generated SDK:**
```typescript
// Auto-generated @conductor/sdk
import { Conductor } from '@conductor/sdk';

const conductor = new Conductor({
  apiKey: process.env.CONDUCTOR_API_KEY
});

// Type-safe API calls
const result = await conductor.ensembles.execute('domain-profile', {
  input: { domain: 'tesla.com' }
});
```

**Deliverables:**
- [x] OpenAPI 3.1 specification
- [x] TypeScript SDK generator
- [x] SDK npm package (@conductor/sdk)
- [x] API documentation site (Redoc/Stoplight)
- [x] Example projects
- [x] Tests for SDK

---

### Week 9: Streaming & Async Execution
**Priority:** 🟡 P1 - Production features

**What to build:**
```
src/api/routes/
├── ensembles/
│   ├── stream.ts              # POST /v1/ensembles/:name/stream (SSE)
│   └── status.ts              # GET /v1/executions/:id
└── durable-objects/
    └── async-executor.ts      # Long-running workflows
```

**Streaming (SSE):**
```typescript
// src/api/routes/ensembles/stream.ts
app.post('/v1/ensembles/:name/stream', async (c) => {
  const name = c.req.param('name');
  const body = await c.req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const executor = new EnsembleExecutor(c.env);

      // Stream events
      executor.on('execution.started', (data) => {
        controller.enqueue(`event: execution.started\ndata: ${JSON.stringify(data)}\n\n`);
      });

      executor.on('step.completed', (data) => {
        controller.enqueue(`event: step.completed\ndata: ${JSON.stringify(data)}\n\n`);
      });

      executor.on('chunk', (data) => {
        controller.enqueue(`event: chunk\ndata: ${JSON.stringify(data)}\n\n`);
      });

      await executor.execute(name, body.input, body.config);

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
});
```

**Async Execution:**
```typescript
// Async execution with Durable Objects
app.post('/v1/ensembles/:name/execute?async=true', async (c) => {
  const name = c.req.param('name');
  const body = await c.req.json();

  // Create Durable Object for long-running execution
  const executionId = generateId();
  const doId = c.env.ASYNC_EXECUTOR.idFromName(executionId);
  const executor = c.env.ASYNC_EXECUTOR.get(doId);

  // Start execution
  await executor.start(name, body.input, body.config);

  return c.json({
    id: executionId,
    status: 'running',
    status_url: `/v1/executions/${executionId}`
  }, 202);
});
```

**Deliverables:**
- [x] SSE streaming endpoint
- [x] Async execution with Durable Objects
- [x] Status polling endpoint
- [x] Cancel execution endpoint
- [x] Connection management
- [x] Tests for streaming and async

---

### Week 10: Rate Limiting & Observability
**Priority:** 🟡 P1 - Production hardening

**What to build:**
```
src/api/
├── middleware/
│   ├── rate-limit.ts          # Rate limiting
│   └── telemetry.ts           # OpenTelemetry
└── durable-objects/
    └── rate-limiter.ts        # Distributed rate limiter
```

**Rate Limiting:**
```typescript
// src/api/middleware/rate-limit.ts
export async function rateLimitRequest(
  request: Request,
  authContext: AuthContext,
  env: Env
): Promise<void> {
  const rateLimitKey = `ratelimit:${authContext.projectId}`;

  // Use Durable Objects for distributed rate limiting
  const doId = env.RATE_LIMITER.idFromName(rateLimitKey);
  const rateLimiter = env.RATE_LIMITER.get(doId);

  const allowed = await rateLimiter.checkLimit();

  if (!allowed) {
    throw new APIError('Rate limit exceeded', 429);
  }
}
```

**Observability:**
```typescript
// src/api/middleware/telemetry.ts
import { trace } from '@opentelemetry/api';

export function telemetryMiddleware(handler: Handler): Handler {
  return async (request, env, ctx) => {
    const tracer = trace.getTracer('conductor-api');

    return await tracer.startActiveSpan('http.request', async (span) => {
      span.setAttributes({
        'http.method': request.method,
        'http.url': request.url,
        'conductor.project_id': authContext.projectId
      });

      const response = await handler(request, env, ctx);

      span.setAttribute('http.status_code', response.status);
      span.end();

      return response;
    });
  };
}
```

**Deliverables:**
- [x] Durable Objects rate limiter
- [x] Rate limit tiers (free, pro, enterprise)
- [x] Rate limit headers (X-RateLimit-*)
- [x] OpenTelemetry integration
- [x] Structured logging
- [x] Request ID propagation
- [x] Tests for rate limiting

---

## Phase 4: Polish & Documentation (Weeks 11-12)

### Week 11: Built-In Fetch Member
**Priority:** 🟢 P2 - Nice to have

**What to build:**
```
src/members/built-in/
└── fetch/
    ├── fetch-member.ts        # HTTP client
    └── __tests__/
```

**Implementation:**
```typescript
export class FetchMember extends BaseMember {
  name = 'fetch';
  type = MemberType.Data;
  builtIn = true;

  async run(context: MemberExecutionContext): Promise<FetchResult> {
    const url = context.input.url;
    const method = context.config?.method || 'GET';
    const retry = context.config?.retry || 3;

    return await this.fetchWithRetry(url, {
      method,
      headers: context.config?.headers,
      body: context.input.body,
      timeout: context.config?.timeout || 5000
    }, retry);
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number
  ): Promise<FetchResult> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.json()
        };
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
  }
}
```

**Deliverables:**
- [x] FetchMember with retry logic
- [x] Timeout handling
- [x] Exponential backoff
- [x] Response transformation
- [x] Tests

---

### Week 12: Documentation & Examples
**Priority:** 🟢 P2 - Developer experience

**What to build:**
```
docs/
├── getting-started.md
├── built-in-members/
│   ├── scrape.md
│   ├── validate.md
│   ├── rag.md
│   ├── hitl.md
│   └── fetch.md
├── guides/
│   ├── memory-system.md
│   ├── prompt-versioning.md
│   ├── evaluation-framework.md
│   └── streaming-api.md
└── examples/
    ├── domain-intelligence/
    ├── chat-agent/
    ├── rag-qa-system/
    └── approval-workflow/
```

**Deliverables:**
- [x] Getting started guide
- [x] Built-in member documentation
- [x] API reference (from OpenAPI)
- [x] Example projects (4+)
- [x] Video tutorials
- [x] Migration guide (V2 → Conductor)

---

## Summary: What We're Building

### Built-In Members (Batteries Included)
1. ✅ **scrape** - 3-tier web scraping with bot protection
2. ✅ **validate** - Rule-based validation with evaluation framework
3. ✅ **rag** - RAG system using CF Vectorize
4. ✅ **hitl** - Human-in-the-loop with Durable Objects
5. ✅ **fetch** - HTTP client with retry

### Core Systems
6. ✅ **Memory System** - Hierarchical (working, session, long-term, semantic)
7. ✅ **Evaluation Framework** - Judge, NLP, Embedding, Rule evaluators
8. ✅ **Prompt Versioning** - Our own system (not PromptLayer)
9. ✅ **Normalization** - URL, domain, company utilities

### World-Class API
10. ✅ **REST API** - Execute, stream, async endpoints
11. ✅ **OpenAPI** - Auto-generated docs
12. ✅ **TypeScript SDK** - Auto-generated from OpenAPI
13. ✅ **Rate Limiting** - Durable Objects
14. ✅ **Observability** - OpenTelemetry

---

## Next Steps (Literally Right Now)

```bash
# 1. Create feature branch
cd /workspace/ensemble/conductor
git checkout -b feature/built-in-members

# 2. Create directory structure
mkdir -p src/members/built-in/{scrape,validate,rag,hitl,fetch}
mkdir -p src/runtime/memory
mkdir -p src/prompts
mkdir -p src/api/{routes,middleware,schemas,client}

# 3. Start with Week 1: Scrape Member
cd src/members/built-in/scrape
touch scrape-member.ts browser-renderer.ts bot-detection.ts html-parser.ts

# 4. Research Cloudflare Browser Rendering API
# Endpoint: https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/markdown
```

**Recommended order:**
1. Week 1: Scrape member (most complex, validates architecture)
2. Week 2: Validate + Evaluation framework
3. Week 3: RAG member (CF Vectorize)
4. Week 4: HITL member (Durable Objects)
5. Week 5: Memory system (hierarchical)
6. Week 6: Core utilities (normalization, prompts)
7. Week 7-10: API layer
8. Week 11-12: Polish

Ready to start? I can help you build the scrape member first, or we can start with any other component.

---

**Built to combine migration-gaps.md and inspired-improvements.md into a comprehensive implementation plan**
