# **Conductor Architecture**

## **Complete Implementation Guide**

## **Core Tenets**

These principles define how Ensemble Edge is built and evaluated. Every technical or product decision should align with them.

### Edge-First Architecture

All execution should happen at the edge — Cloudflare Workers, KV, R2, D1, and Vectorize are the core primitives. Avoid centralized compute unless absolutely necessary.

### Cache is Central

Leverage edge cache for performance everywhere. Every member must have cache settings as a key configuration, allowing work to be either refreshed always or cached for specific durations given the same input. Cache-first thinking reduces costs and latency.

### Workers Over Workflows (for Now)

Prefer lightweight Cloudflare Workers for orchestration instead of Cloudflare Workflows. Workflows may be adopted later for durability and scheduling once the platform matures.

### YAML as the Source of Truth

Every ensemble and member should be defined declaratively. YAML represents the "sheet music" — it should be portable, readable, and versioned in Git.

### Git-Native Everything

All configuration, orchestration, and versioning must live in Git. The CLI, SDK, and Cloud UI should be thin layers around Git operations.

### Language-Agnostic but JS-First

JavaScript/TypeScript is the default runtime for Workers and SDKs. Python or other languages may appear later, but the orchestration model must stay consistent across runtimes.

### Composable Members, Not Monolithic Agents

Members (LLM, Function, API, etc.) should each do one thing well. Reusability and composability trump complexity.

### Observability as a First-Class Citizen

Every execution emits structured logs, metrics, and traces to Cloudflare Analytics or external observability sinks. All metrics/events follow a shared JSON Telemetry Schema (member, ensemble, duration, tokens, confidence, etc.) — reinforcing our "structured outputs" ethos. Debugging and transparency must be effortless.

### Declarative Integrations

Tools, integrations, and syncs must be defined declaratively (YAML first). No hidden logic or stateful glue code.

### Open by Default

Everything open except where hosting adds proprietary value.

### Zero Setup, Infinite Scale

Local development, GitHub deployment, and Cloudflare scaling should be frictionless. The platform must feel "auto-scaling by design."

### Structured Outputs, Always

LLM and API members should produce machine-readable, type-safe output (validated via JSON schema or Zod).

### Durability Through Simplicity

Use KV, Durable Objects, and Vectorize for persistence before introducing external databases or workflow engines.

### Eat Our Own Dogfood

Ensemble Edge must use its own orchestration system for everything — documentation generation, CLI intelligence, and platform operations. If we wouldn't use our own tools, why should anyone else?

## **Overview**

Conductor is an orchestration platform that treats AI members as musicians and workflows as sheet music. Built entirely on Cloudflare's edge infrastructure, it enables complex multi-member systems through simple YAML definitions stored in GitHub.

### Architecture Flow Diagram

```
┌────────┐      ┌──────────┐      ┌───────────┐      ┌─────────┐
│ Member │ ───► │ Ensemble │ ───► │ Conductor │ ───► │  Cloud  │
└────────┘      └──────────┘      └───────────┘      └─────────┘
    │               │                    │                 │
    │               │                    │                 │
Musicians       Sheet Music          Performer          Stage
(Functions)    (YAML Workflow)    (Edge Runtime)    (Monitoring)
```

This simple flow makes onboarding docs instantly graspable: Members are composed into Ensembles, executed by the Conductor, and monitored through Cloud.

## **Open Source & Cloud Strategy**

All core components of Ensemble Edge are open source under the @ensemble-edge namespace — except Ensemble Cloud, a managed, Cloudflare-native platform.

### Open Source Components

- **Conductor** – Edge runtime orchestrator  
- **SDK** – Developer API for members and ensembles  
- **CLI** – Local dev/deploy tool  
- **Templates** – Starter projects and YAML blueprints  
- **Docs** – Public documentation site

### Proprietary Component: Ensemble Cloud

Ensemble Cloud runs as a Cloudflare-hosted service that allows users to:

- Connect their GitHub repo containing members and ensembles  
- Input their API endpoint and key  
- Access a visual builder to configure and run ensembles (React Flow-based)  
- View dashboards, metrics, and monitoring  
- Access marketplace functionality

The cloud/ repository hosts:

- React Flow UI / visual builder  
- User dashboard  
- Documentation viewer (embedded from public docs)  
- Internal API explorer  
- Help and guides for Ensemble Cloud users

Cloud provides collaboration, monitoring, and marketplace functionality but remains private. All other pieces are open.

## **Core Concepts**

### The Musical Metaphor

- **Members** \= Musicians (each plays one instrument/role)  
- **Ensembles** \= Sheet music (YAML files defining the performance)  
- **Conductor** \= The orchestration engine (Cloudflare Workers)  
- **Stage Manager** \= The platform (Workers \+ infrastructure)  
- **Models/LLMs** \= Instruments (GPT-4, Claude, etc.)  
- **Scorers** \= Music critics (evaluate performance quality)

### Fundamental Definitions

#### Member

A single-purpose, reusable function that performs a specific task. Formerly called "agent." Members come in several types:

- Does one thing: Transforms input → output  
- Stateless: No knowledge of other members or workflows  
- Pure: Same input always produces same output  
- Atomic: Cannot be broken down further

Each member lives in its own directory and includes:

- **Type**: LLM, Function, API, Scoring, Dataflow, MCP, etc.  
- **Code**: Implementation logic  
- **Docs**: Purpose, inputs, outputs  
- **Tests**: Integration validation (test.js or test.yaml)  
- **Version**: Semantic version

#### Ensemble

A coordinated workflow of multiple members that achieves a business goal.

- Orchestrates members, defines order and data flow  
- Manages retries, caching, and context  
- YAML-driven and Git-versioned  
- Business-focused: Represents a complete use case or workflow

#### Conductor

The runtime execution engine that reads YAML ensembles and executes member functions at the edge.

- Manages caching, retries, logging, and observability  
- Integrates with KV, R2, D1, AI Gateway, and Vectorize  
- Runs as a Cloudflare Worker (not Workflows initially)  
- Provides observability: Logs, metrics, cost tracking

## **Member Types (The Orchestra Sections)**

| Type | Description | Example |
| :---- | :---- | :---- |
| Think | Reasoning and analysis using AI models | summarize\_text, classify\_review, analyze\_sentiment |
| Data | Read/write operations for databases and storage | query\_customers, save\_company, check\_cache |
| MCP | Model Context Protocol \- enables seamless tool usage by AI models and direct tool invocation | github-mcp, filesystem-mcp, memory-mcp |
| Function | Runs JavaScript/TypeScript logic | format\_output, generate\_slug, calculate\_score |
| API | Calls external endpoints | fetch\_pricing\_data, send\_to\_webhook |
| Scoring | Validates or tests outputs with confidence scoring | check\_quality, validate\_schema, grade\_output |
| Dataflow | Transforms or merges structured data | join\_results, aggregate\_metrics |
| Loop/Parallel | Iterates or fans out tasks | process\_all\_pages |
| Webhook | Receives and processes external events | github-webhook, stripe-handler |
| n8n | Integration with n8n workflow automation | n8n-transform, n8n-process |

Members define input/output schemas and resources for predictability.

## **Scoring Members & Confidence Thresholds**

### Scoring Member Type

The Scoring member type provides quality control and confidence scoring for outputs from other members:

```
# members/grade-summary/member.yaml
name: grade-summary
type: Scoring
description: Grade the quality of generated summaries

config:
  evaluator:
    model: gpt-4
    criteria:
      - accuracy: "Does the summary accurately represent the source?"
      - completeness: "Are key points included?"
      - clarity: "Is it clear and well-structured?"
  
  thresholds:
    pass: 0.7        # Minimum confidence to pass
    excellent: 0.9   # Threshold for high-quality output
    retry: 0.4       # Below this, trigger retry

schema:
  input:
    content: string
    original: string
  output:
    confidence: number  # 0-1 score
    passed: boolean
    feedback: string
    scores: object
```

### Using Scoring in Ensembles

```
# ensembles/summarize-with-qa.yaml
name: summarize-with-qa
description: Generate summary with quality assurance

flow:
  - member: extract-article
    input:
      url: ${input.url}
    
  - member: generate-summary
    input:
      text: ${extract-article.output.text}
    cache:
      ttl: 3600
  
  - member: grade-summary
    input:
      content: ${generate-summary.output.summary}
      original: ${extract-article.output.text}
    
  - condition: ${grade-summary.output.confidence} < 0.7
    member: regenerate-summary
    input:
      text: ${extract-article.output.text}
      feedback: ${grade-summary.output.feedback}
    
  - member: final-score
    type: Scoring
    input:
      content: ${regenerate-summary.output.summary}
      original: ${extract-article.output.text}
```

### Ensemble-Level Scoring Configuration

```
name: content-generation-with-qa
description: Generate content with automatic quality assurance

# Ensemble-level scoring configuration
scoring:
  enabled: true
  defaultThresholds:
    minimum: 0.6      # Fail below this
    target: 0.8       # Ideal score
    excellent: 0.95   # Exceptional quality
  maxRetries: 3
  backoffStrategy: exponential  # linear | exponential | fixed
  
  # Track scoring metrics in state
  trackInState: true
  
  # Global scoring criteria
  criteria:
    accuracy: "Factually correct and precise"
    relevance: "Directly addresses the requirement"
    clarity: "Clear and well-structured"
    completeness: "All aspects covered"

# State includes scoring history
state:
  schema:
    scoreHistory: array      # Track all scores
    finalScore: number       # Overall ensemble score
    retryCount: object       # Per-member retry tracking
    qualityMetrics: object   # Aggregated quality data
  initial:
    scoreHistory: []
    finalScore: 0
    retryCount: {}
    qualityMetrics: {}

flow:
  - member: generate-content
    input:
      prompt: ${input.prompt}
    # Member-specific scoring
    scoring:
      evaluator: grade-content  # Which scoring member to use
      thresholds:
        minimum: 0.7           # Override ensemble defaults
        target: 0.85
      criteria:
        - originality: "Unique and creative"
        - tone: "Appropriate for audience"
      onFailure: retry         # retry | continue | abort
      retryLimit: 2
    
  - member: grade-content
    type: Scoring  # Special scoring member type
    config:
      model: gpt-4
      temperature: 0.1  # Low temperature for consistent scoring
    input:
      content: ${generate-content.output}
      criteria: ${scoring.criteria}
    output:
      score: number     # 0.0 to 1.0
      breakdown: object # Score per criterion
      feedback: string  # Improvement suggestions
      passed: boolean
```

### Scoring Implementation Patterns

#### Pattern 1: Multi-Stage Validation

```
name: document-processing
flow:
  # Stage 1: Initial generation
  - member: extract-data
    scoring:
      evaluator: validate-extraction
      thresholds: { minimum: 0.8 }
  
  # Stage 2: Enhancement if needed
  - member: enhance-data
    condition:
      - if: ${state.scoreHistory[-1].score} < 0.9
    scoring:
      evaluator: validate-enhancement
      thresholds: { minimum: 0.9 }
  
  # Stage 3: Final check
  - member: final-validation
    type: Scoring
    input:
      data: ${state.processedData}
      checkCompleteness: true
      checkAccuracy: true
```

#### Pattern 2: Comparative Scoring

```
name: multi-model-selection
flow:
  parallel:
    - member: generate-with-gpt4
      scoring:
        evaluator: score-output
    
    - member: generate-with-claude
      scoring:
        evaluator: score-output
    
    - member: generate-with-gemini
      scoring:
        evaluator: score-output
  
  - member: select-best
    input:
      scores: ${state.scoreHistory}
    output:
      selected: ${highest_scoring_output}
      model: ${highest_scoring_model}
```

#### Pattern 3: Progressive Quality Improvement

```
name: iterative-refinement
scoring:
  targetImprovement: 0.1  # Each iteration should improve by 10%
  maxIterations: 5

flow:
  - member: initial-draft
    scoring:
      evaluator: grade-quality
  
  - member: iterative-improvement
    loop:
      while: ${state.scoreHistory[-1].score} < 0.9
      maxIterations: 5
    input:
      current: ${previous.output}
      targetScore: 0.9
      feedback: ${state.scoreHistory[-1].feedback}
    scoring:
      evaluator: grade-quality
      requireImprovement: true  # Must beat previous score
```

## **State Management**

### Overview

State management allows data sharing across ensemble members without prop drilling, providing a clean way to maintain context throughout workflow execution.

### Key Benefits

- ✅ **No Prop Drilling** \- Share data between Step 1 and Step 5 without passing through Steps 2-4  
- ✅ **Selective Access** \- Members only see state they explicitly declare  
- ✅ **Type Safety** \- Full TypeScript/Zod schema validation  
- ✅ **Backwards Compatible** \- Existing ensembles work unchanged  
- ✅ **Observable** \- Track state access patterns for optimization

### Architecture Changes

#### 1\. Enhanced Ensemble YAML Structure

**Before (Current):**

```
name: process-order
flow:
  - member: validate-customer
    input:
      id: ${input.customerId}
  
  - member: calculate-pricing
    input:
      # Must pass validation through even if not needed
      validation: ${validate-customer.output}
      items: ${input.items}
```

**After (With State Management):**

```
name: process-order

# NEW: Define shared state
state:
  schema:
    customerId: string
    validationResults: object
    totalPrice: number
  initial:
    totalPrice: 0

flow:
  - member: validate-customer
    state:
      use: [customerId]        # Read these state values
      set: [validationResults] # Write these state values
    input:
      id: ${state.customerId}  # Access state directly
  
  - member: calculate-pricing
    state:
      set: [totalPrice]        # Only declares what it writes
    input:
      items: ${input.items}
  
  - member: apply-discount
    state:
      use: [validationResults, totalPrice]  # Access Step 1's results
      set: [totalPrice]
    input:
      tier: ${state.validationResults.tier}
      basePrice: ${state.totalPrice}
```

#### 2\. Conductor Runtime Integration

```javascript
// conductor/runtime/executor.js
import { StateManager } from './state-manager.js';

export class ConductorExecutor {
  async executeEnsemble(ensemble, input, context) {
    // Create state manager if ensemble has state config
    const stateManager = ensemble.state 
      ? new StateManager(ensemble.state)
      : null;

    // Your existing execution logic with state injection
    for (const step of ensemble.flow) {
      const memberContext = {
        ...context,
        // Inject state context for this member
        ...(stateManager && step.state 
          ? stateManager.createMemberContext(step.member, step.state)
          : {})
      };

      // Execute with state-aware context
      await this.executeMember(step.member, input, memberContext);
    }
  }
}
```

#### 3\. Member Implementation Updates

```javascript
// members/validate-customer/index.js
export default async function validateCustomer({ input, state, setState }) {
  // Read from state (only sees declared 'use' keys)
  const customerId = state.customerId;
  
  // Your validation logic
  const validation = await validateCustomerAPI(customerId);
  
  // Write to state (only declared 'set' keys allowed)
  setState({ 
    validationResults: {
      tier: validation.tier,
      valid: validation.isValid
    }
  });
  
  return { success: true };
}
```

### State Manager Implementation

```javascript
// conductor/runtime/state-manager.js
export class StateManager {
  constructor(config) {
    this.schema = config.schema;
    this.state = { ...config.initial };
    this.accessLog = new Map();
  }
  
  createMemberContext(memberName, memberStateConfig) {
    const { use = [], set = [] } = memberStateConfig;
    
    // Create read-only state view
    const state = {};
    for (const key of use) {
      if (key in this.state) {
        state[key] = this.state[key];
        this.logAccess(memberName, key, 'read');
      }
    }
    
    // Create setter function
    const setState = (updates) => {
      for (const key of Object.keys(updates)) {
        if (set.includes(key)) {
          this.state[key] = updates[key];
          this.logAccess(memberName, key, 'write');
        } else {
          console.warn(`Member ${memberName} tried to set undeclared state key: ${key}`);
        }
      }
    };
    
    return { state, setState };
  }
  
  logAccess(member, key, operation) {
    if (!this.accessLog.has(member)) {
      this.accessLog.set(member, []);
    }
    this.accessLog.get(member).push({ key, operation, timestamp: Date.now() });
  }
  
  getAccessReport() {
    const allKeys = Object.keys(this.state);
    const usedKeys = new Set();
    
    for (const accesses of this.accessLog.values()) {
      accesses.forEach(a => usedKeys.add(a.key));
    }
    
    return {
      unusedKeys: allKeys.filter(k => !usedKeys.has(k)),
      accessPatterns: Object.fromEntries(this.accessLog)
    };
  }
}
```

### TypeScript Support for State Management

```ts
// conductor/runtime/state-manager.ts
import { z } from 'zod';

interface StateContext<T> {
  state: Partial<T>;
  setState: (updates: Partial<T>) => void;
}

interface MemberStateConfig {
  use?: string[];
  set?: string[];
}

export class TypedStateManager<T extends z.ZodRawShape> {
  private schema: z.ZodObject<T>;
  private state: z.infer<z.ZodObject<T>>;
  private accessLog: Map<string, Array<{
    key: string;
    operation: 'read' | 'write';
    timestamp: number;
  }>>;

  constructor(
    schema: z.ZodObject<T>,
    initial?: Partial<z.infer<z.ZodObject<T>>>
  ) {
    this.schema = schema;
    this.state = schema.parse({ ...initial });
    this.accessLog = new Map();
  }

  createMemberContext<K extends keyof z.infer<z.ZodObject<T>>>(
    memberName: string,
    config: { use?: K[]; set?: K[] }
  ): StateContext<Pick<z.infer<z.ZodObject<T>>, K>> {
    const { use = [], set = [] } = config;

    // Type-safe state getter
    const getState = () => {
      const memberState: any = {};
      for (const key of use) {
        if (key in this.state) {
          memberState[key] = this.state[key as string];
          this.logAccess(memberName, key as string, 'read');
        }
      }
      return memberState;
    };

    // Type-safe state setter
    const setState = (updates: Partial<Pick<z.infer<z.ZodObject<T>>, K>>) => {
      const allowedUpdates: any = {};
      
      for (const key of Object.keys(updates) as K[]) {
        if (set.includes(key)) {
          allowedUpdates[key] = updates[key];
          this.logAccess(memberName, key as string, 'write');
        } else {
          console.warn(`Member ${memberName} tried to set undeclared state key: ${String(key)}`);
        }
      }
      
      // Validate and merge updates
      const partialSchema = this.schema.partial().pick(
        Object.fromEntries(set.map(k => [k, true])) as any
      );
      
      const validated = partialSchema.parse(allowedUpdates);
      this.state = { ...this.state, ...validated };
    };

    return {
      state: getState(),
      setState
    };
  }

  private logAccess(member: string, key: string, operation: 'read' | 'write') {
    if (!this.accessLog.has(member)) {
      this.accessLog.set(member, []);
    }
    this.accessLog.get(member)!.push({ key, operation, timestamp: Date.now() });
  }

  getState(): z.infer<z.ZodObject<T>> {
    return { ...this.state };
  }

  getAccessReport() {
    return {
      unusedKeys: Object.keys(this.state).filter(key => 
        ![...this.accessLog.values()].flat().some(access => access.key === key)
      ),
      memberAccess: Object.fromEntries(this.accessLog)
    };
  }
}
```

### State Integration Examples

#### Example: Company Intelligence Ensemble

```
# Current - with prop drilling
flow:
  - member: fetch-company-data
    input:
      domain: ${input.domain}
  
  - member: analyze-financials
    input:
      company: ${fetch-company-data.output}  # Pass entire company
  
  - member: fetch-competitors
    input:
      company: ${fetch-company-data.output}  # Duplicate passing
      
  - member: generate-report
    input:
      company: ${fetch-company-data.output}     # Triple passing!
      financials: ${analyze-financials.output}
      competitors: ${fetch-competitors.output}

# Enhanced - with shared state
state:
  schema:
    companyData: object
    financialAnalysis: object
    competitorList: array
    
flow:
  - member: fetch-company-data
    state:
      set: [companyData]
    input:
      domain: ${input.domain}
  
  - member: analyze-financials
    state:
      use: [companyData]
      set: [financialAnalysis]
    # No need to pass company data!
  
  - member: fetch-competitors
    state:
      use: [companyData]
      set: [competitorList]
    # Parallel execution, both access shared state
      
  - member: generate-report
    state:
      use: [companyData, financialAnalysis, competitorList]
    # All data available without prop drilling
```

## **MCP (Model Context Protocol) Integration**

### Overview

MCP servers are first-class citizens in Ensemble Edge, treated as a core member type alongside Think, Data, Function, and API members. This integration enables seamless tool usage by AI models and direct tool invocation within workflows.

### Why MCP as a First-Class Member Type?

#### Strategic Alignment

- **Standardized tool interface** \- MCP is becoming the standard for AI tool integration  
- **Growing ecosystem** \- Anthropic, OpenAI, and others are adopting MCP  
- **Edge-compatible** \- Can run via WebSocket/SSE or directly in Workers  
- **Composable architecture** \- Fits perfectly with Ensemble's member model

#### Technical Benefits

- **Tool discovery** \- Auto-discover available tools from any MCP server  
- **Context preservation** \- Maintain state across tool calls  
- **LLM integration** \- Seamless tool access for Think members  
- **Unified interface** \- One protocol for all external tools

### Implementation Architecture

#### 1\. Member Type Definition

```
# MCP is a peer to other member types
types:
  - Think      # AI reasoning
  - MCP        # Tool access via Model Context Protocol
  - Data       # Storage operations
  - Function   # Custom logic
  - API        # HTTP endpoints
  - Scoring    # Quality checks
```

#### 2\. Three MCP Deployment Patterns

**Pattern A: Remote MCP Server (Most Common)**

```
# members/github-mcp/member.yaml
name: github-mcp
type: MCP
description: GitHub operations via remote MCP server

config:
  server:
    transport: websocket
    url: wss://mcp-gateway.example.com/github
    auth:
      type: bearer
      token: ${env.MCP_TOKEN}
```

**Pattern B: Edge-Native MCP (Cloudflare Workers)**

```
# members/memory-mcp/member.yaml
name: memory-mcp
type: MCP
description: Memory storage running in same Worker

config:
  server:
    transport: internal  # Runs in same Worker
    implementation: ./mcp/memory-server.js
    storage:
      type: kv
      namespace: KV_MEMORY
```

**Pattern C: Durable Object MCP (Stateful)**

```
# members/session-mcp/member.yaml
name: session-mcp
type: MCP
description: Stateful session management

config:
  server:
    transport: durable_object
    class: MCPSessionServer
    persistent: true
```

### MCP Usage Examples

#### Example 1: GitHub Code Review Workflow

```
# ensembles/pr-review.yaml
name: pr-review
description: Automated PR review using GitHub MCP

flow:
  # Initialize GitHub MCP connection
  - member: github-mcp
    type: MCP
    action: connect
    
  # Fetch PR details using MCP tool
  - member: github-mcp
    action: call_tool
    input:
      tool: get_pull_request
      params:
        owner: ${input.repo_owner}
        repo: ${input.repo_name}
        number: ${input.pr_number}
  
  # AI reviews code with access to GitHub tools
  - member: reviewer
    type: Think
    input:
      prompt: |
        Review this PR for:
        - Code quality
        - Security issues
        - Performance concerns
      context: ${github-mcp.output.pr_data}
      tools: ${github-mcp.tools}  # MCP tools available to LLM
    config:
      model: claude-3-opus
      tool_choice: auto
  
  # Post review comment via MCP
  - member: github-mcp
    action: call_tool
    input:
      tool: create_review_comment
      params:
        body: ${reviewer.output.review}
        commit_id: ${github-mcp.output.pr_data.head_sha}
```

#### Example 2: Memory-Augmented Assistant

```
# ensembles/smart-assistant.yaml
name: smart-assistant
description: Assistant with persistent memory

flow:
  # Connect to memory MCP
  - member: memory
    type: MCP
    config:
      server:
        package: "@modelcontextprotocol/server-memory"
        storage: kv
        namespace: user-${input.user_id}
  
  # Retrieve past context
  - member: memory
    action: call_tool
    input:
      tool: retrieve_memories
      params:
        query: ${input.message}
        limit: 5
  
  # Generate response with memory
  - member: assistant
    type: Think
    input:
      message: ${input.message}
      memories: ${memory.output.relevant_memories}
      tools: ${memory.tools}
    config:
      model: gpt-4
  
  # Store new memory
  - member: memory
    action: call_tool
    input:
      tool: store_memory
      params:
        content: ${assistant.output.memory_to_store}
        metadata:
          timestamp: ${Date.now()}
          importance: ${assistant.output.importance_score}
```

#### Example 3: Multi-MCP Orchestration

```
# ensembles/research-assistant.yaml
name: research-assistant
description: Research using multiple MCP servers

members:
  - name: filesystem-mcp
    type: MCP
    config:
      server:
        package: "@modelcontextprotocol/server-filesystem"
        
  - name: postgres-mcp
    type: MCP
    config:
      server:
        package: "@modelcontextprotocol/server-postgres"
        
  - name: slack-mcp
    type: MCP
    config:
      server:
        package: "@modelcontextprotocol/server-slack"

flow:
  # Parallel MCP initialization
  - parallel:
    - member: filesystem-mcp
      action: connect
    - member: postgres-mcp
      action: connect
    - member: slack-mcp
      action: connect
  
  # Research with all tools available
  - member: researcher
    type: Think
    input:
      task: ${input.research_topic}
      tools:
        - ${filesystem-mcp.tools}
        - ${postgres-mcp.tools}
        - ${slack-mcp.tools}
    config:
      model: claude-3-opus
      max_tool_calls: 20
```

### Edge-Optimized MCP Implementation

#### Using Cloudflare KV for MCP State

```javascript
// conductor/mcp/kv-adapter.js
export class KVMCPAdapter {
  constructor(env) {
    this.kv = env.KV_MEMORY;
    this.namespace = 'mcp-state';
  }
  
  async storeContext(sessionId, context) {
    const key = `${this.namespace}:${sessionId}`;
    await this.kv.put(key, JSON.stringify(context), {
      expirationTtl: 3600 // 1 hour
    });
  }
  
  async retrieveContext(sessionId) {
    const key = `${this.namespace}:${sessionId}`;
    const data = await this.kv.get(key);
    return data ? JSON.parse(data) : null;
  }
}
```

#### Using Durable Objects for Stateful MCP

```javascript
// conductor/mcp/durable-mcp.js
export class MCPSessionServer {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.tools = new Map();
  }
  
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/connect') {
      return this.handleConnect(request);
    } else if (url.pathname === '/call') {
      return this.handleToolCall(request);
    }
  }
  
  async handleToolCall(request) {
    const { tool, params } = await request.json();
    
    // Maintain context in Durable Object
    const context = await this.state.storage.get('context') || {};
    
    // Execute tool with context
    const result = await this.executeToolWithContext(
      tool, 
      params, 
      context
    );
    
    // Update context
    await this.state.storage.put('context', result.newContext);
    
    return Response.json(result);
  }
}
```

### MCP Registry Configuration

```
# config/mcp-registry.yaml
registry:
  official:  # Anthropic's official MCP servers
    - name: github
      package: "@modelcontextprotocol/server-github"
      transport: stdio
      
    - name: filesystem  
      package: "@modelcontextprotocol/server-filesystem"
      transport: stdio
      
    - name: postgres
      package: "@modelcontextprotocol/server-postgres"
      transport: websocket
      
  custom:  # Your custom MCP servers
    - name: company-knowledge
      url: wss://mcp.yourcompany.com/knowledge
      transport: websocket
      auth: required
      
    - name: internal-tools
      implementation: ./mcp/internal-tools.js
      transport: internal
```

### Testing MCP Members

```javascript
// members/github-mcp/test.js
export default {
  name: 'github-mcp-tests',
  
  tests: [
    {
      name: 'should connect to GitHub MCP',
      action: 'connect',
      expect: {
        connected: true,
        tools: ['create_issue', 'get_pull_request', 'search_code']
      }
    },
    {
      name: 'should create issue via MCP',
      action: 'call_tool',
      input: {
        tool: 'create_issue',
        params: {
          owner: 'test-org',
          repo: 'test-repo',
          title: 'Test Issue',
          body: 'Test body'
        }
      },
      expect: {
        success: true,
        issue_number: { type: 'number' }
      }
    }
  ]
};
```

### MCP Best Practices

#### 1\. MCP Server Selection

- Use official MCP servers when available  
- Build custom MCP servers for proprietary tools  
- Run edge-native for low latency  
- Use remote MCP for complex integrations

#### 2\. Performance Optimization

- Cache MCP connections in KV  
- Use Durable Objects for stateful sessions  
- Batch tool calls when possible  
- Implement connection pooling

#### 3\. Security

- Authenticate all MCP connections  
- Validate tool parameters  
- Use environment variables for credentials  
- Implement rate limiting per tool

#### 4\. Error Handling

```
# Graceful MCP failure handling
- member: github-mcp
  type: MCP
  action: call_tool
  retry:
    attempts: 3
    backoff: exponential
  fallback:
    member: github-api  # Fallback to direct API
```

### MCP Future Roadmap

#### Phase 1: Basic MCP Support (Now)

✅ MCP as member type ✅ WebSocket/SSE transport ✅ Tool discovery ✅ LLM integration

#### Phase 2: Edge-Native MCP (3 months)

- Worker-based MCP servers  
- KV-backed persistence  
- Durable Object sessions  
- Connection pooling

#### Phase 3: MCP Ecosystem (6 months)

- MCP server marketplace  
- Visual MCP builder in Ensemble Cloud  
- Auto-generate MCP from OpenAPI  
- MCP monitoring dashboard

#### Phase 4: Advanced Features (12 months)

- MCP federation (cross-organization)  
- MCP versioning and compatibility  
- Streaming tool responses  
- MCP-to-MCP communication

## **Webhook Integration**

### Overview

Ensembles and members can be configured as webhook receivers, enabling event-driven workflows from external services. Any ensemble or member can be exposed as a webhook endpoint, with built-in signature verification, event routing, and automatic registration capabilities.

### Core Concepts

#### Webhook-Enabled Members and Ensembles

Any member or ensemble can be configured to receive webhooks by adding a webhook configuration:

```
# ensembles/github-events.yaml
name: github-events
description: Handle GitHub webhook events

webhook:
  enabled: true
  path: /webhooks/github  # Optional custom path
  events:
    - push
    - pull_request
    - issues
  verification:
    type: hmac-sha256
    secret: ${env.GITHUB_WEBHOOK_SECRET}
  
flow:
  - member: parse-github-event
    input:
      headers: ${webhook.headers}
      body: ${webhook.body}
      event: ${webhook.event}
```

### Webhook Configuration

#### 1\. Basic Webhook Setup

```
# members/stripe-handler/member.yaml
name: stripe-handler
type: Function
description: Handle Stripe payment events

webhook:
  enabled: true
  provider: stripe  # Pre-configured provider
  events:
    - payment_intent.succeeded
    - customer.subscription.created
    - invoice.paid

code: |
  export default async function({ webhook }) {
    const { event, data } = webhook;
    
    switch(event) {
      case 'payment_intent.succeeded':
        return handlePaymentSuccess(data);
      case 'customer.subscription.created':
        return handleNewSubscription(data);
    }
  }
```

#### 2\. Custom Webhook Configuration

```
# ensembles/custom-webhook.yaml
name: custom-webhook
description: Handle custom webhook with verification

webhook:
  enabled: true
  path: /webhooks/custom/${input.customer_id}  # Dynamic path
  
  verification:
    type: custom
    handler: verify-webhook  # Member that verifies
    
  headers:  # Required headers
    - x-webhook-signature
    - x-webhook-timestamp
    
  rateLimit:
    requests: 100
    window: 60  # seconds
    
  retry:
    enabled: true
    maxAttempts: 3
    backoff: exponential
```

#### 3\. Webhook Providers Registry

```
# config/webhooks.yaml
providers:
  github:
    verification:
      type: hmac-sha256
      header: x-hub-signature-256
      secret_env: GITHUB_WEBHOOK_SECRET
    events:
      - push
      - pull_request
      - issues
      - workflow_run
      
  stripe:
    verification:
      type: stripe-signature
      header: stripe-signature
      secret_env: STRIPE_WEBHOOK_SECRET
    events:
      - payment_intent.*
      - customer.*
      - invoice.*
      
  slack:
    verification:
      type: hmac-sha256
      header: x-slack-signature
      secret_env: SLACK_SIGNING_SECRET
    challenge: true  # Responds to Slack challenges
    
  shopify:
    verification:
      type: hmac-sha256
      header: x-shopify-hmac-sha256
      secret_env: SHOPIFY_WEBHOOK_SECRET
```

### Webhook Routes

#### Automatic Route Generation

When webhooks are enabled, Conductor automatically creates routes:

```
# Default patterns
/conductor/webhooks/:ensemble_name
/conductor/webhooks/:member_type/:member_name

# Custom patterns
/webhooks/github/events
/webhooks/stripe/payments
/webhooks/slack/commands
```

#### Route Configuration in wrangler.toml

```
# wrangler.toml
[env.production]
routes = [
  "https://api.ownerco.com/conductor/*",
  "https://webhooks.ownerco.com/*",
  "https://api.ownerco.com/webhooks/*"
]
```

### Webhook Security

#### 1\. Signature Verification

```javascript
// conductor/webhooks/verification.js
export class WebhookVerifier {
  async verify(request, config) {
    const { type, secret, header } = config.verification;
    
    switch(type) {
      case 'hmac-sha256':
        return await this.verifyHMAC(request, secret, header);
        
      case 'stripe-signature':
        return await this.verifyStripe(request, secret);
        
      case 'custom':
        return await this.verifyCustom(request, config);
    }
  }
  
  async verifyHMAC(request, secret, headerName) {
    const signature = request.headers.get(headerName);
    const body = await request.text();
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const verified = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToArrayBuffer(signature),
      encoder.encode(body)
    );
    
    return { verified, body };
  }
}
```

#### 2\. IP Allowlisting

```
webhook:
  security:
    allowedIPs:
      - 140.82.112.0/20  # GitHub
      - 143.55.64.0/20   # GitHub
      - 54.187.174.169   # Stripe
      - 54.187.205.235   # Stripe
    cloudflare: true  # Use CF's IP validation
```

#### 3\. Event Filtering

```
webhook:
  events:
    include:
      - payment_intent.succeeded
      - customer.created
    exclude:
      - "*.test"  # Exclude test events
      - "*.sandbox"  # Exclude sandbox events
```

### Webhook Registration

#### Auto-Registration with Services

```
# ensembles/auto-register.yaml
name: github-webhook-handler

webhook:
  enabled: true
  autoRegister: true  # Auto-register on deploy
  
  registration:
    service: github
    config:
      owner: ${env.GITHUB_OWNER}
      repo: ${env.GITHUB_REPO}
      events:
        - push
        - pull_request
      url: https://api.ownerco.com/webhooks/github
      secret: ${env.GITHUB_WEBHOOK_SECRET}
```

#### Registration via CLI

```shell
# Register webhook with service
npx ensemble webhook register github-events --service github

# List registered webhooks
npx ensemble webhook list

# Update webhook configuration
npx ensemble webhook update github-events --add-event issues

# Test webhook locally
npx ensemble webhook test github-events --payload sample.json

# Unregister webhook
npx ensemble webhook unregister github-events
```

### Event Processing

#### 1\. Event Router

```javascript
// conductor/webhooks/router.js
export class WebhookRouter {
  constructor(conductor) {
    this.conductor = conductor;
  }
  
  async route(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Extract ensemble/member from path
    const match = path.match(/\/webhooks\/(.+)/);
    if (!match) return new Response('Not Found', { status: 404 });
    
    const targetName = match[1];
    
    // Load webhook config
    const config = await this.loadWebhookConfig(targetName);
    
    // Verify webhook signature
    const { verified, body } = await this.verify(request, config);
    if (!verified) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Parse event
    const event = this.parseEvent(request, body, config);
    
    // Execute ensemble/member with webhook context
    const result = await this.conductor.execute(targetName, {
      webhook: {
        headers: Object.fromEntries(request.headers),
        body: body,
        event: event,
        raw: request
      }
    });
    
    return Response.json(result);
  }
}
```

#### 2\. Event Queue (Optional)

```
webhook:
  queue:
    enabled: true
    service: queues  # Cloudflare Queues
    config:
      name: webhook-events
      batchSize: 10
      maxRetries: 3
      dlq: webhook-dlq  # Dead letter queue
```

#### 3\. Event Storage

```
webhook:
  storage:
    enabled: true
    destination: r2  # Store in R2
    bucket: ownerco-oiq-webhooks
    format: json
    retention: 30  # days
    schema:
      - timestamp
      - event_type
      - payload
      - headers
      - verification_status
```

### Webhook Usage Examples

#### Example 1: GitHub CI/CD Pipeline

```
# ensembles/github-ci.yaml
name: github-ci
description: CI/CD triggered by GitHub webhooks

webhook:
  enabled: true
  provider: github
  events:
    - push
    - pull_request.opened
    - pull_request.synchronize

flow:
  - condition: ${webhook.event == 'push'}
    member: deploy-production
    input:
      branch: ${webhook.body.ref}
      commit: ${webhook.body.head_commit.id}
      
  - condition: ${webhook.event.startsWith('pull_request')}
    member: run-tests
    input:
      pr_number: ${webhook.body.pull_request.number}
      
  - member: notify-slack
    input:
      channel: '#deployments'
      message: ${previous.output.message}
```

#### Example 2: Stripe Payment Processing

```
# ensembles/stripe-payments.yaml
name: stripe-payments
description: Handle Stripe payment webhooks

webhook:
  enabled: true
  provider: stripe
  events:
    - payment_intent.succeeded
    - payment_intent.failed
    - charge.refunded

flow:
  - member: parse-stripe-event
    input:
      event: ${webhook.event}
      data: ${webhook.body}
      
  - switch: ${webhook.event}
    cases:
      - case: payment_intent.succeeded
        member: process-payment
      - case: payment_intent.failed  
        member: handle-failed-payment
      - case: charge.refunded
        member: process-refund
        
  - member: update-database
    type: Data
    input:
      operation: upsert
      table: payments
      data: ${previous.output}
      
  - member: send-email
    input:
      to: ${previous.output.customer_email}
      template: ${webhook.event}
      data: ${previous.output}
```

#### Example 3: Slack Command Handler

```
# members/slack-command/member.yaml
name: slack-command
type: Function
description: Handle Slack slash commands

webhook:
  enabled: true
  provider: slack
  challenge: true  # Handle Slack challenges
  commands:
    - /ensemble
    - /ai-help
    
code: |
  export default async function({ webhook }) {
    const { command, text, user_id, channel_id } = webhook.body;
    
    // Route based on command
    switch(command) {
      case '/ensemble':
        return handleEnsembleCommand(text, user_id);
      case '/ai-help':
        return handleAIHelp(text, channel_id);
    }
    
    // Return Slack-formatted response
    return {
      response_type: 'in_channel',
      text: 'Command processed',
      attachments: [...]
    };
  }
```

### Webhook Monitoring & Debugging

#### Webhook Analytics

```javascript
// conductor/webhooks/analytics.js
export class WebhookAnalytics {
  constructor(env) {
    this.analytics = env.ANALYTICS;
  }
  
  async track(event) {
    await this.analytics.writeDataPoint({
      dataset: 'webhooks',
      point: {
        blobs: [
          event.provider,
          event.event_type,
          event.ensemble_name
        ],
        doubles: [
          event.processing_time,
          event.payload_size
        ],
        indexes: [event.provider]
      }
    });
  }
}
```

#### Debug Mode

```
webhook:
  debug:
    enabled: true
    logLevel: verbose
    storage:
      destination: kv
      ttl: 3600  # Keep debug logs for 1 hour
    includeHeaders: true
    includeBody: true
```

#### Webhook Testing

```shell
# Test with sample payload
npx ensemble webhook test github-events \
  --event push \
  --payload samples/github-push.json

# Simulate webhook locally
npx ensemble dev --webhook-mode

# Replay webhook from storage
npx ensemble webhook replay <webhook-id>

# Validate webhook configuration
npx ensemble webhook validate
```

### Webhook Best Practices

#### 1\. Security

- Always verify signatures \- Never trust webhooks without verification  
- Use environment variables for secrets  
- Implement rate limiting to prevent abuse  
- Log all webhook events for audit trails

#### 2\. Reliability

- Implement idempotency \- Handle duplicate webhooks gracefully  
- Use queues for processing \- Don't block webhook responses  
- Set appropriate timeouts \- Webhooks often have tight timeouts  
- Return 2xx quickly \- Process async, respond fast

#### 3\. Development

- Use webhook.site for testing during development  
- Mock webhooks in tests with sample payloads  
- Version your webhook handlers for backward compatibility  
- Document expected payloads in member/ensemble docs

#### 4\. Monitoring

- Track webhook metrics \- Success rates, processing times  
- Alert on failures \- Repeated failures may indicate issues  
- Monitor rate limits \- Stay within provider limits  
- Archive webhook data \- Store for debugging and compliance

### Complete Webhook Configuration Example

```
# ensembles/production-webhooks.yaml
name: production-webhooks
description: Production webhook handler with full configuration

webhook:
  enabled: true
  path: /webhooks/production
  
  # Security
  verification:
    type: hmac-sha256
    secret: ${env.WEBHOOK_SECRET}
    header: x-webhook-signature
    
  allowedIPs:
    - 192.168.1.0/24
    
  # Rate limiting
  rateLimit:
    requests: 1000
    window: 60
    byIP: true
    
  # Event configuration
  events:
    include: ["production.*", "critical.*"]
    exclude: ["*.test", "*.debug"]
    
  # Processing
  queue:
    enabled: true
    name: production-webhooks
    
  storage:
    enabled: true
    destination: r2
    bucket: webhook-archive
    
  # Monitoring
  analytics:
    enabled: true
    dataset: production-webhooks
    
  debug:
    enabled: false
    
  # Auto-recovery
  retry:
    enabled: true
    maxAttempts: 3
    backoff: exponential
    dlq: webhook-failures

flow:
  - member: validate-webhook
  - member: process-event
  - member: update-systems
  - member: notify-team
```

## **n8n Integration**

### Overview

n8n workflows can be seamlessly integrated as members or triggered from ensembles, enabling visual workflow design alongside code-based orchestration. This hybrid approach allows teams to use the best tool for each use case.

### n8n as a Member Type

```
# members/n8n-workflow/member.yaml
name: n8n-workflow
type: n8n
description: Execute n8n workflow for data transformation

config:
  endpoint: ${env.N8N_WEBHOOK_URL}
  apiKey: ${env.N8N_API_KEY}
  workflowId: "wf_transform_data"
  waitForCompletion: true
  timeout: 30000

schema:
  input:
    data: object
    options: object
  output:
    result: object
    executionId: string
    status: string
```

### Triggering n8n from Ensembles

```
name: data-processing-pipeline
description: Hybrid orchestration with n8n

flow:
  - member: fetch-data
    type: Data
    input:
      source: database
      query: "SELECT * FROM customers"
  
  - member: n8n-transform
    type: n8n
    config:
      workflowId: "wf_customer_enrichment"
      webhook: https://n8n.example.com/webhook/transform
    input:
      data: ${fetch-data.output}
      settings:
        mode: "production"
        enrichmentLevel: "full"
  
  - member: validate-results
    type: Scoring
    input:
      data: ${n8n-transform.output.result}
      schema: ${schemas.enrichedCustomer}
```

### n8n Webhook Receiver

```
# Ensemble triggered by n8n
name: n8n-triggered-workflow
description: Ensemble called from n8n workflow

webhook:
  enabled: true
  path: /webhooks/n8n/${workflow_id}
  verification:
    type: bearer
    token: ${env.N8N_WEBHOOK_TOKEN}

flow:
  - member: process-n8n-data
    input:
      payload: ${webhook.body}
      workflowId: ${webhook.headers['x-n8n-workflow-id']}
  
  - member: execute-business-logic
    type: Function
    input:
      data: ${process-n8n-data.output}
  
  - member: return-to-n8n
    type: API
    config:
      url: ${webhook.headers['x-n8n-response-url']}
      method: POST
    input:
      result: ${execute-business-logic.output}
```

### n8n Integration Patterns

#### Pattern 1: n8n for Visual ETL

```
# Use n8n for complex data transformations
flow:
  - member: extract-from-sources
    type: n8n
    config:
      workflowId: "etl_multi_source"
    input:
      sources: ["database", "api", "csv"]
  
  - member: ai-analysis
    type: Think
    input:
      data: ${extract-from-sources.output}
```

#### Pattern 2: Conditional n8n Execution

```
flow:
  - member: check-complexity
    type: Function
    input:
      data: ${input.data}
  
  - condition: ${check-complexity.output.isComplex}
    member: n8n-complex-handler
    type: n8n
    config:
      workflowId: "complex_processing"
  
  - condition: !${check-complexity.output.isComplex}
    member: simple-handler
    type: Function
```

#### Pattern 3: n8n Error Handling

```
flow:
  - member: n8n-process
    type: n8n
    config:
      workflowId: "data_processing"
    retry:
      attempts: 3
      backoff: exponential
    fallback:
      member: manual-process
      type: Function
```

### n8n Configuration in Conductor

```javascript
// conductor/integrations/n8n.js
export class N8NIntegration {
  constructor(env) {
    this.apiUrl = env.N8N_API_URL;
    this.apiKey = env.N8N_API_KEY;
  }
  
  async executeWorkflow(workflowId, data, options = {}) {
    const response = await fetch(`${this.apiUrl}/workflow/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data,
        ...options
      })
    });
    
    if (options.waitForCompletion) {
      return await this.waitForResult(response.executionId);
    }
    
    return response;
  }
  
  async waitForResult(executionId, maxWait = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const status = await this.checkStatus(executionId);
      
      if (status.finished) {
        return status.data;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('n8n workflow execution timeout');
  }
}
```

## **Implementation Details**

### Directory Structure

```
ensemble-edge/
├── conductor/              # Core runtime
│   ├── runtime/
│   │   ├── executor.js     # Main execution engine
│   │   ├── state-manager.js # State management
│   │   ├── scoring-executor.js # Scoring logic
│   │   └── cache.js        # Caching layer
│   ├── workers/
│   │   └── index.js        # Cloudflare Worker entry
│   ├── webhooks/
│   │   ├── router.js       # Webhook routing
│   │   ├── verification.js # Signature verification
│   │   └── analytics.js    # Webhook metrics
│   ├── mcp/
│   │   ├── kv-adapter.js   # KV storage for MCP
│   │   ├── durable-mcp.js  # Durable Objects MCP
│   │   └── registry.js     # MCP server registry
│   ├── integrations/
│   │   ├── n8n.js          # n8n integration
│   │   └── unkey.js        # Auth integration
│   └── utilities/
│       ├── auth.js         # Authentication
│       ├── rateLimit.js    # Rate limiting
│       └── logger.js       # Logging
├── members/                # Member implementations
│   ├── think/
│   ├── data/
│   ├── mcp/
│   ├── scoring/
│   ├── webhook/
│   └── n8n/
├── ensembles/              # Workflow definitions
│   ├── company-intelligence.yaml
│   └── content-pipeline.yaml
├── config/                 # Configuration
│   ├── api.yaml
│   ├── webhooks.yaml
│   ├── mcp-registry.yaml
│   └── scoring.yaml
└── tests/                  # Test suites
    ├── members/
    ├── ensembles/
    └── integration/
```

### Core Runtime Implementation

#### Main Executor

```javascript
// conductor/runtime/executor.js
import { StateManager } from './state-manager.js';
import { ScoringExecutor } from './scoring-executor.js';
import { CacheManager } from './cache.js';
import { MCPRegistry } from '../mcp/registry.js';
import { WebhookRouter } from '../webhooks/router.js';

export class ConductorExecutor {
  constructor(env) {
    this.env = env;
    this.cache = new CacheManager(env);
    this.scoringExecutor = new ScoringExecutor(env);
    this.mcpRegistry = new MCPRegistry(env);
    this.webhookRouter = new WebhookRouter(this);
  }

  async executeEnsemble(ensemble, input, context) {
    // Initialize state if configured
    const stateManager = ensemble.state 
      ? new StateManager(ensemble.state)
      : null;

    // Track execution metrics
    const startTime = Date.now();
    const metrics = {
      ensemble: ensemble.name,
      members: [],
      scores: [],
      cacheHits: 0,
      totalDuration: 0
    };

    // Execute flow
    for (const step of ensemble.flow) {
      const memberStart = Date.now();

      // Check cache
      const cacheKey = this.cache.generateKey(step, input);
      const cached = await this.cache.get(cacheKey);
      
      if (cached && !step.cache?.bypass) {
        metrics.cacheHits++;
        continue;
      }

      // Create member context with state
      const memberContext = {
        ...context,
        ...(stateManager && step.state 
          ? stateManager.createMemberContext(step.member, step.state)
          : {})
      };

      // Execute with scoring if configured
      let result;
      if (step.scoring) {
        result = await this.scoringExecutor.executeWithScoring(
          step.member,
          input,
          step.scoring
        );
        metrics.scores.push({
          member: step.member,
          score: result.score,
          attempts: result.attempts
        });
      } else {
        result = await this.executeMember(step.member, input, memberContext);
      }

      // Cache result if configured
      if (step.cache?.ttl) {
        await this.cache.set(cacheKey, result, step.cache.ttl);
      }

      // Update metrics
      metrics.members.push({
        name: step.member,
        duration: Date.now() - memberStart,
        cached: false
      });
    }

    // Calculate final metrics
    metrics.totalDuration = Date.now() - startTime;
    
    // Get state report if available
    const stateReport = stateManager?.getAccessReport();

    return {
      output: ensemble.output,
      metrics,
      stateReport
    };
  }

  async executeMember(memberName, input, context) {
    const member = await this.loadMember(memberName);
    
    switch (member.type) {
      case 'Think':
        return await this.executeThinkMember(member, input, context);
      case 'MCP':
        return await this.executeMCPMember(member, input, context);
      case 'Data':
        return await this.executeDataMember(member, input, context);
      case 'Function':
        return await this.executeFunctionMember(member, input, context);
      case 'API':
        return await this.executeAPIMember(member, input, context);
      case 'Scoring':
        return await this.executeScoringMember(member, input, context);
      case 'n8n':
        return await this.executen8nMember(member, input, context);
      default:
        throw new Error(`Unknown member type: ${member.type}`);
    }
  }
}
```

#### Scoring Executor Implementation

```javascript
// conductor/runtime/scoring-executor.js
export class ScoringExecutor {
  async executeWithScoring(member, input, scoringConfig) {
    let attempts = 0;
    let lastScore = 0;
    let backoffMs = 1000;
    
    while (attempts < scoringConfig.retryLimit) {
      // Execute the member
      const result = await this.executeMember(member, input);
      
      // Run scoring evaluation
      const score = await this.evaluateOutput(
        result,
        scoringConfig.evaluator,
        scoringConfig.criteria
      );
      
      // Check if score meets threshold
      if (score.passed) {
        return {
          output: result,
          score: score.score,
          attempts: attempts + 1,
          status: 'passed'
        };
      }
      
      // Handle failure based on strategy
      switch (scoringConfig.onFailure) {
        case 'retry':
          attempts++;
          lastScore = score.score;
          
          // Apply backoff strategy
          if (attempts < scoringConfig.retryLimit) {
            await this.applyBackoff(backoffMs, scoringConfig.backoffStrategy);
            backoffMs = this.calculateNextBackoff(backoffMs, scoringConfig.backoffStrategy);
            
            // Enhance input with feedback for next attempt
            input = {
              ...input,
              previousScore: score,
              feedback: score.feedback,
              attempt: attempts + 1
            };
          }
          break;
          
        case 'continue':
          // Log warning but continue execution
          console.warn(`Score below threshold: ${score.score}`);
          return {
            output: result,
            score: score.score,
            status: 'below_threshold'
          };
          
        case 'abort':
          throw new ScoringError(
            `Score ${score.score} below minimum ${scoringConfig.thresholds.minimum}`
          );
      }
    }
    
    // Max retries exceeded
    return {
      output: null,
      score: lastScore,
      attempts,
      status: 'max_retries_exceeded'
    };
  }
  
  calculateNextBackoff(current, strategy) {
    switch (strategy) {
      case 'exponential':
        return current * 2;
      case 'linear':
        return current + 1000;
      case 'fixed':
      default:
        return current;
    }
  }

  async evaluateOutput(output, evaluatorName, criteria) {
    // Load and execute the scoring member
    const evaluator = await this.loadMember(evaluatorName);
    
    const evaluation = await evaluator.execute({
      content: output,
      criteria: criteria
    });
    
    return {
      score: evaluation.score,
      breakdown: evaluation.breakdown,
      feedback: evaluation.feedback,
      passed: evaluation.score >= criteria.minimum
    };
  }
}
```

#### Ensemble Scorer for Aggregated Metrics

```javascript
// conductor/runtime/ensemble-scorer.js
export class EnsembleScorer {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }
  
  async calculateEnsembleScore() {
    const state = this.stateManager.getState();
    const { scoreHistory, qualityMetrics } = state;
    
    if (!scoreHistory.length) return null;
    
    // Calculate weighted ensemble score
    const weights = this.getMemberWeights();
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const entry of scoreHistory) {
      const weight = weights[entry.member] || 1;
      weightedSum += entry.score * weight;
      totalWeight += weight;
    }
    
    const ensembleScore = weightedSum / totalWeight;
    
    // Update quality metrics
    const metrics = {
      ensembleScore,
      averageScore: this.calculateAverage(scoreHistory),
      minScore: Math.min(...scoreHistory.map(e => e.score)),
      maxScore: Math.max(...scoreHistory.map(e => e.score)),
      totalEvaluations: scoreHistory.length,
      passRate: this.calculatePassRate(scoreHistory),
      criteriaBreakdown: this.aggregateCriteria(scoreHistory)
    };
    
    this.stateManager.setState({
      finalScore: ensembleScore,
      qualityMetrics: metrics
    });
    
    return metrics;
  }
  
  aggregateCriteria(history) {
    const criteria = {};
    
    for (const entry of history) {
      if (entry.breakdown) {
        for (const [criterion, score] of Object.entries(entry.breakdown)) {
          if (!criteria[criterion]) {
            criteria[criterion] = { scores: [], average: 0 };
          }
          criteria[criterion].scores.push(score);
        }
      }
    }
    
    // Calculate averages
    for (const criterion in criteria) {
      const scores = criteria[criterion].scores;
      criteria[criterion].average = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    
    return criteria;
  }
}
```

### Telemetry and Analytics

#### Telemetry Schema

```javascript
// conductor/telemetry/schema.js
export const TelemetrySchema = {
  memberExecution: {
    event: 'member_execution',
    member: String,
    ensemble: String,
    duration: Number,
    tokens: Number,
    score: Number,
    confidence: Number,
    cache_hit: Boolean,
    timestamp: Date
  },
  
  ensembleExecution: {
    event: 'ensemble_execution',
    ensemble: String,
    total_duration: Number,
    member_count: Number,
    average_score: Number,
    cache_hit_rate: Number,
    state_usage: Object,
    timestamp: Date
  },
  
  webhookReceived: {
    event: 'webhook_received',
    provider: String,
    event_type: String,
    ensemble: String,
    verified: Boolean,
    processing_time: Number,
    timestamp: Date
  },
  
  scoringEvent: {
    event: 'scoring_event',
    member: String,
    score: Number,
    passed: Boolean,
    attempts: Number,
    criteria_breakdown: Object,
    timestamp: Date
  }
};
```

#### Analytics Client

```javascript
// conductor/telemetry/analytics.js
export class TelemetryClient {
  constructor(env) {
    this.analytics = env.ANALYTICS;
    this.dataset = env.ANALYTICS_DATASET || 'ensemble_metrics';
  }
  
  async track(event) {
    const telemetryData = {
      dataset: this.dataset,
      point: {
        blobs: this.extractBlobs(event),
        doubles: this.extractDoubles(event),
        indexes: this.extractIndexes(event)
      }
    };
    
    await this.analytics.writeDataPoint(telemetryData);
    
    // Track in state for ensemble-level metrics
    if (event.score !== undefined) {
      await this.trackScoringMetrics(event);
    }
  }
  
  extractBlobs(event) {
    return [
      event.event,
      event.member || event.ensemble,
      event.type || 'unknown'
    ];
  }
  
  extractDoubles(event) {
    const doubles = [];
    
    if (event.duration) doubles.push(event.duration);
    if (event.score) doubles.push(event.score);
    if (event.tokens) doubles.push(event.tokens);
    if (event.processing_time) doubles.push(event.processing_time);
    
    return doubles;
  }
  
  extractIndexes(event) {
    return [
      event.ensemble || event.member,
      this.getScoreRange(event.score)
    ];
  }
  
  async trackScoringMetrics(event) {
    // Additional scoring-specific tracking
    if (event.score < 0.5) {
      await this.analytics.track('low_quality_alert', {
        ...telemetryData,
        alertType: 'quality_threshold'
      });
    }
  }
  
  getScoreRange(score) {
    if (score >= 0.95) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.6) return 'acceptable';
    return 'poor';
  }
}
```

## **API System**

This ensures the same Conductor runtime can serve:

- Local single-user development  
- Multi-tenant production environments  
- External partner integrations

### 1\. Cloudflare Routing & API Entry Points

Conductor runs as a Cloudflare Worker bound to API routes. Typical environment bindings:

```
# wrangler.toml
[env.preview]
routes = ["https://preview.api.ownerco.com/conductor/*"]

[env.production]
routes = ["https://api.ownerco.com/conductor/*"]
```

This structure enforces separation between preview and production while maintaining identical code paths.

Requests are routed by path pattern:

- `/conductor/ensemble/:name` → run a full ensemble  
- `/conductor/member/:name` → execute an individual member  
- `/conductor/docs` → view generated documentation  
- `/conductor/health` → system heartbeat  
- `/conductor/webhooks/:name` → receive webhook events  
- `/conductor/scores/:ensemble` → get scoring metrics

### 2\. Authentication Modes

Authentication can be configured in the project's ensemble.config.yaml or config/api.yaml file:

```
# config/api.yaml
auth:
  mode: static | external
  static:
    keys:
      - key: "abc123"
        label: "internal-dev"
        ensembles: ["company-intelligence"]
        rateLimit: 100
  external:
    provider: "unkey"
    env: UNKEY_ROOT_KEY
    ensembles: ["*"]
    rateLimit: 1000
```

Modes:

- **static**: Uses built-in validation (ideal for prototypes or single-tenant deployments)  
- **external**: Uses a third-party service (like Unkey) for multi-tenant, rate-limited access  
- Defaults to static if unspecified

### 3\. Utilities Layer (Composable Auth & Helpers)

The Conductor runtime includes a utilities/ folder for modular helpers:

```
conductor/
├── runtime/
├── workers/
└── utilities/
    ├── auth.js          # Handles key verification
    ├── rateLimit.js     # Optional limiter
    ├── logger.js        # Unified logging helper
    └── unkey.js         # External Unkey client wrapper
```

Each utility exports lightweight, async functions that can be overridden by a project.

Example: conductor/utilities/auth.js

```javascript
export async function verifyKey({ request, env }) {
  const key = request.headers.get("x-api-key");
  const valid = env.STATIC_KEYS?.includes(key);
  return valid;
}
```

Developers can drop in their own version under /utilities/ to replace or extend default behavior. This promotes composability without forking the core runtime.

### 4\. Middleware System

Conductor introduces a pluggable middleware.js file for request interception and extension:

```javascript
// conductor/middleware.js
export const middleware = [
  async function authMiddleware(req, ctx, next) {
    const valid = await ctx.utilities.auth.verifyKey(req);
    if (!valid) return new Response("Unauthorized", { status: 401 });
    return next();
  },

  async function loggingMiddleware(req, ctx, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    return next();
  }
];
```

Each middleware function receives the request, a shared context, and a next() function. Conductor applies these automatically in order before running any ensemble or member.

This pattern supports:

- Custom authentication or authorization  
- Per-request tracing  
- Rate limiting  
- Request transformations  
- Custom headers, error handling, or observability hooks

### 5\. Using Unkey as an External Auth Utility

To enable Unkey for scalable key management and rate limiting, add a simple utility:

```javascript
// conductor/utilities/unkey.js
import { Unkey } from "@unkey/api";

export async function verifyKey(req, env) {
  const unkey = new Unkey({ apiKey: env.UNKEY_ROOT_KEY });
  const key = req.headers.get("x-api-key");
  if (!key) return false;

  const { valid, meta } = await unkey.keys.verify(key);
  if (!valid) return false;

  // Optional: attach metadata (scopes, rateLimit, user info)
  req.auth = meta;
  return true;
}
```

Conductor automatically loads this when auth.mode: external is configured. Metadata from Unkey (e.g. allowed ensembles, rate limits, user plans) can be used directly in middleware or analytics.

Example metadata:

```json
{
  "user_id": "abc123",
  "ensembles": ["company-intelligence", "competitor-analysis"],
  "rateLimit": 1000,
  "plan": "pro"
}
```

### 6\. CLI & SDK Integration

Developers can manage and test API keys via the CLI:

```shell
# Create or list keys
npx ensemble keys create --ensembles "company-intelligence"
npx ensemble keys list
npx ensemble keys revoke <key_id>

# Validate locally
npx ensemble keys test --key "abc123"
```

SDK support (e.g. for custom integrations):

```javascript
import { verifyKey } from "@ensemble-edge/sdk";
await verifyKey(request);
```

### 7\. Documentation & Discovery

Docs generated via `npx ensemble docs build` automatically include access metadata:

```
### Authentication
- **Required:** Yes  
- **Provider:** Unkey  
- **Rate Limit:** 1000 requests/day  
- **Scopes:** company-intelligence, competitor-analysis
```

This metadata is pulled directly from config/api.yaml or the Unkey API, ensuring the documentation always reflects live configuration.

### 8\. Benefits

✅ **Configurable** — static or external auth options per environment ✅ **Composable** — plug-and-play utilities and middleware ✅ **Observable** — unified logs in Analytics Engine \+ Unkey metrics ✅ **Secure** — per-user scopes, rate limits, and revocation ✅ **Self-Documenting** — access rules appear automatically in docs ✅ **Edge-Native** — no central auth server; validation happens at the Worker level

### 9\. Summary

Ensemble Edge's API system is fully extensible. Conductor Workers expose clean API routes (/conductor/ensemble/:name, /member/:name, /docs) protected by flexible authentication that can scale from local prototypes to enterprise-grade, rate-limited APIs.

Developers can start with static keys and later plug in Unkey, Cloudflare Access, or a custom auth service — all without changing the orchestration logic.

## **Testing Strategy**

### Integration Testing

Absolutely\! Each member can have:

- **test.js or test.yaml** files for integration tests  
- Test runner via `npx ensemble test`  
- Member-specific tests that validate inputs/outputs  
- Ensemble-level tests for full workflow validation  
- CI/CD integration for automated testing  
- Coverage reporting to track test completeness

The testing framework is built directly into the platform, making it easy to ensure each member works correctly both in isolation and as part of larger ensembles.

### Member Testing Examples

```javascript
// members/github-mcp/test.js
export default {
  name: 'github-mcp-tests',
  
  tests: [
    {
      name: 'should connect to GitHub MCP',
      action: 'connect',
      expect: {
        connected: true,
        tools: ['create_issue', 'get_pull_request', 'search_code']
      }
    },
    {
      name: 'should create issue via MCP',
      action: 'call_tool',
      input: {
        tool: 'create_issue',
        params: {
          owner: 'test-org',
          repo: 'test-repo',
          title: 'Test Issue',
          body: 'Test body'
        }
      },
      expect: {
        success: true,
        issue_number: { type: 'number' }
      }
    }
  ]
};
```

### State Management Testing

```javascript
// tests/state-management.test.js
import { createStatefulConductor } from '../conductor/runtime';

test('members only access declared state', async () => {
  const ensemble = {
    state: {
      schema: { secret: 'string', public: 'string' },
      initial: { secret: 'hidden', public: 'visible' }
    },
    flow: [
      {
        member: 'restricted-member',
        state: { use: ['public'] }  // Can't see 'secret'
      }
    ]
  };
  
  const conductor = createStatefulConductor(ensemble);
  const context = await conductor.getMemberContext('restricted-member');
  
  expect(context.state.public).toBe('visible');
  expect(context.state.secret).toBeUndefined();
});
```

### Testing Commands

```shell
# Run all tests
npx ensemble test

# Test specific member
npx ensemble test members/github-mcp

# Test specific ensemble
npx ensemble test ensembles/content-pipeline

# Run with coverage
npx ensemble test --coverage

# Score baseline measurement
npx ensemble score baseline --ensemble my-ensemble --runs 100

# Test webhook
npx ensemble webhook test github-events --payload sample.json

# Validate configurations
npx ensemble validate
```

## **Best Practices**

### Security Considerations

- Validate all inputs at member boundaries  
- Use environment variables for secrets  
- Implement rate limiting on public endpoints  
- Audit member access patterns  
- Use Cloudflare Access for admin endpoints  
- Always verify webhook signatures  
- Authenticate all MCP connections  
- Validate tool parameters

### Testing Strategy

- Write integration tests for every member  
- Test ensemble workflows end-to-end  
- Use scoring members for output validation  
- Run tests in CI/CD pipelines  
- Monitor test coverage metrics  
- Mock webhooks in tests with sample payloads  
- Version your webhook handlers for backward compatibility

### State Management Best Practices

**DO:**

- Define minimal state schemas  
- Use state for cross-cutting concerns (user context, config, accumulations)  
- Validate state updates with Zod schemas  
- Document state dependencies in member docs

**DON'T:**

- Store large binary data in state (use R2 references)  
- Mutate state directly (always use setState)  
- Access undeclared state keys  
- Use state as a general data bus

### Scoring Best Practices

**DO:**

- ✅ Set realistic thresholds based on baseline testing  
- ✅ Use consistent criteria across similar members  
- ✅ Implement gradual rollout for new scoring rules  
- ✅ Monitor scoring metrics for drift detection  
- ✅ Cache scores for identical inputs  
- ✅ Use sampling for high-volume workflows

**DON'T:**

- ❌ Set thresholds too high initially (start at 0.6, increase gradually)  
- ❌ Score every intermediate step (focus on critical outputs)  
- ❌ Ignore scoring feedback in retry attempts  
- ❌ Use expensive models for simple validations  
- ❌ Block execution on non-critical score failures

### Webhook Best Practices

**Security:**

- Always verify signatures \- Never trust webhooks without verification  
- Use environment variables for secrets  
- Implement rate limiting to prevent abuse  
- Log all webhook events for audit trails

**Reliability:**

- Implement idempotency \- Handle duplicate webhooks gracefully  
- Use queues for processing \- Don't block webhook responses  
- Set appropriate timeouts \- Webhooks often have tight timeouts  
- Return 2xx quickly \- Process async, respond fast

**Development:**

- Use webhook.site for testing during development  
- Mock webhooks in tests with sample payloads  
- Version your webhook handlers for backward compatibility  
- Document expected payloads in member/ensemble docs

**Monitoring:**

- Track webhook metrics \- Success rates, processing times  
- Alert on failures \- Repeated failures may indicate issues  
- Monitor rate limits \- Stay within provider limits  
- Archive webhook data \- Store for debugging and compliance

### Performance Considerations

#### State Size

- Keep state minimal \- don't store large documents  
- KV Integration: For large state, store in KV and keep references in state  
- Caching: State can be cached at the ensemble level  
- Parallel Access: Multiple members can read state simultaneously

#### Scoring Overhead

- Evaluation adds 100-500ms per scoring operation  
- Use sampling for high-volume workflows (score every Nth execution)  
- Cache evaluation results for identical inputs  
- Consider async scoring for non-critical paths

#### Cost Optimization

```
scoring:
  sampling:
    enabled: true
    rate: 0.1  # Score 10% of executions
    alwaysScoreOn: ["error", "first_run", "manual_trigger"]
  
  costControl:
    evaluatorModel: "gpt-3.5-turbo"  # Cheaper model for evaluation
    maxTokens: 500
```

## **Migration Path**

### Phase 1: Add State Management Module

1. Copy state-manager.js to conductor/runtime/  
2. Update package.json to ensure Zod is installed  
3. No breaking changes \- existing ensembles continue working

### Phase 2: Update Conductor Runtime

1. Modify executor to check for state config  
2. Inject state context when available  
3. Maintain backward compatibility for stateless ensembles

### Phase 3: Migrate Ensembles Gradually

1. Identify ensembles with prop drilling  
2. Add state config to YAML  
3. Update members to use state instead of passed values  
4. Test with both old and new patterns

### Adding Scoring to Existing Ensembles

#### Baseline Measurement

```shell
# Run without thresholds to measure current quality
npx ensemble score baseline --ensemble my-ensemble --runs 100
```

#### Set Initial Thresholds

```
scoring:
  enabled: true
  thresholds:
    minimum: <p10_score>  # Start with 10th percentile
    target: <p50_score>   # Median score
```

#### Gradual Rollout

```
scoring:
  rollout:
    percentage: 10  # Start with 10% of executions
    increment: 10   # Increase by 10% weekly
```

## **Debugging & Monitoring**

### Score Tracking Dashboard

```javascript
// Real-time scoring metrics
const dashboard = {
  current: {
    ensembleScore: 0.84,
    trend: "improving",  // improving | declining | stable
    last24h: {
      evaluations: 523,
      passRate: 0.91,
      avgScore: 0.83
    }
  },
  
  alerts: [
    {
      type: "quality_degradation",
      member: "generate-summary",
      message: "Score dropped below 0.7 threshold",
      timestamp: Date.now()
    }
  ],
  
  recommendations: [
    "Consider adjusting temperature for generate-summary",
    "Review failed criteria: 'completeness' scoring low"
  ]
};
```

### Debugging Failed Scores

```
# Enable detailed scoring logs
scoring:
  debug: true
  logLevel: verbose
  capturePrompts: true  # Store evaluation prompts
  
  # Detailed failure analysis
  onFailure:
    captureState: true
    captureInput: true
    captureOutput: true
    notifyWebhook: "https://alerts.example.com/scoring"
```

### Observability & State Debugging

```javascript
const result = await conductor.execute(input, { debug: true });

console.log(result.__stateReport);
// {
//   unusedKeys: ['tempData'],  // State defined but never used
//   heavilyUsedKeys: [
//     { key: 'companyData', usage: 12 }  // Optimize this
//   ],
//   memberAccess: {
//     'fetch-company': [
//       { key: 'companyData', operation: 'write', timestamp: ... }
//     ]
//   }
// }
```

## **Summary**

Ensemble Edge combines Cloudflare's distributed infrastructure with YAML-driven orchestration and a flexible member taxonomy. By adhering to our core tenets \- edge-first, Workers over Workflows, YAML as truth, Git-native everything \- we create a platform that is both powerful and simple.

- **Members** \= Instruments (LLM, API, Function, MCP, Webhook, n8n, etc.)  
- **Ensembles** \= Compositions (YAML workflows)  
- **Conductor** \= Performer (Edge runtime)  
- **Cloud** \= Stage (Collaboration \+ visibility)  
- **Scorers** \= Critics (Quality control with confidence thresholds)  
- **State** \= Memory (Shared context without prop drilling)

Everything is open source and extensible — except the stage we host it on (Ensemble Cloud). The result is a developer-first orchestration platform that scales infinitely at the edge while remaining simple enough to understand in minutes.

## **Answers to Your Questions**

### Scoring & Confidence Thresholds

Yes\! The system includes:

- **Scoring member type** that can grade outputs and set confidence thresholds (0-1 score)  
- Conditional retry logic based on confidence scores  
- Quality metrics tracked in telemetry  
- Configurable thresholds for pass/fail/retry decisions  
- Multi-criteria evaluation with weighted scoring  
- Progressive quality improvement patterns  
- Comparative scoring across multiple models

### Integration Testing

Absolutely\! Each member can have:

- test.js or test.yaml files for integration tests  
- Test runner via `npx ensemble test`  
- Member-specific tests that validate inputs/outputs  
- Ensemble-level tests for full workflow validation  
- CI/CD integration for automated testing  
- Coverage reporting to track test completeness

The testing framework is built directly into the platform, making it easy to ensure each member works correctly both in isolation and as part of larger ensembles.

### State Management

The platform now includes comprehensive state management that:

- Eliminates prop drilling between members  
- Provides type-safe access to shared state  
- Allows selective state access (members only see what they declare)  
- Tracks state access patterns for optimization  
- Integrates with KV and Durable Objects for persistence

### Webhook Support

Full event-driven workflow support with:

- Any member/ensemble can receive webhooks  
- Built-in signature verification for major providers  
- Auto-registration with external services  
- Event routing and filtering  
- Queue integration for reliable processing  
- Complete webhook analytics and monitoring

### MCP Integration

Model Context Protocol is a first-class citizen with:

- Three deployment patterns (remote, edge-native, durable objects)  
- Seamless tool access for AI models  
- Tool discovery and context preservation  
- Support for official and custom MCP servers  
- Full integration with Think members

### n8n Integration

Hybrid orchestration capabilities allowing:

- n8n workflows as members  
- Triggering n8n from ensembles  
- Receiving webhooks from n8n  
- Visual workflow design alongside code  
- Conditional execution based on complexity

The platform delivers on the promise of being a comprehensive, edge-native orchestration system that handles everything from simple API calls to complex AI workflows with quality control, all while maintaining the simplicity of YAML configuration and the power of Cloudflare's edge infrastructure.
