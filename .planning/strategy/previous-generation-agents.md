# Previous Efforts: OwnerCo AI Agent Architecture (V2)

## Executive Summary

The ownerco-api-edge project implemented a sophisticated AI agent architecture that evolved through practical use to reveal both powerful patterns and fundamental limitations. This "V2" approach used **compound agents**—where agents directly instantiate and call other agents—to build complex intelligence-gathering workflows. While this achieved impressive functionality and established excellent design patterns, it blurred the lines between agent logic and orchestration, creating challenges that point toward the need for a dedicated orchestration layer (Conductor/V3).

---

## Architecture Overview

### Core Framework: BaseAgent Pattern

All agents inherit from a centralized `BaseAgent` class that provides:

- **Standardized execution wrapper** (`execute()` method) that wraps all responses in `{success, data, timestamp, requestId, cached, executionTime}` format
- **PromptLayer integration** for AI model calls with template management (centralized prompt versioning)
- **Built-in caching infrastructure** with semantic normalization and configurable TTLs
- **Strict single-input validation** with educational error messages
- **Metadata collection** and error handling
- **Response formatting** (minimal vs verbose modes)

### Agent Taxonomy

Agents are organized by their primary function:

#### **Public API Agents** (Exposed via REST endpoints)

1. **Resolvers** - Convert one entity to another (strict single-input)
   - `domain-2-company` - Extract legal company names from website content
   - `company-2-domain` - Find primary domains for company names

2. **Generators** - Create structured output (require `text` + optional style params)
   - `humanize` - Transform AI text into natural, human-like content
   - `compliance` - Check and fix regulatory compliance issues
   - `domain-2-profile` - Comprehensive markdown profiles (orchestrator)
   - `domain-2-product-summary` - Product descriptions

3. **Transformers** - Convert data formats
   - `url-2-markdown` - Website content extraction (with bot protection fallback)
   - `html-2-markdown` - HTML conversion (fallback for bot-protected sites)
   - `domain-2-sitemap` - Sitemap structure extraction

#### **Internal Orchestration Agents** (Not in public API)

4. **Classifiers** - Analyze and categorize (used by generators internally)
   - `domain-2-type` - Investor vs Company classification
   - `domain-2-category` - Business category classification
   - `domain-2-industry` - Specific industry identification

**Key Insight**: The existence of "internal-only" agents reveals the orchestration problem—Classifiers only exist to support compound agent workflows, not as standalone services.

---

## Design Patterns That Worked Exceptionally Well

### ✅ **1. Strict Single-Input Validation**

**The Pattern**: Resolvers accept EXACTLY ONE semantic input parameter.

```javascript
// CACHE_INPUT_PARAMS standardization
const CONFIG = {
  CACHE_INPUT_PARAMS: {
    domain: 'normalizeDomain',    // Object format with normalization function
    company: 'normalizeCompany'
  }
};

// BaseAgent validates at runtime
validateSingleCacheInput(params, CONFIG.CACHE_INPUT_PARAMS);
// Throws educational error if multiple inputs provided
```

**Why This Worked**:
- ✅ **Semantic clarity**: `domain-2-company` means exactly what it says
- ✅ **Cache consistency**: One input = one cache key
- ✅ **Developer confidence**: No ambiguity about what parameter to use
- ✅ **Educational errors**: "Multiple input parameters detected. Use exactly ONE: domain OR url"

**Example in Practice**:
```bash
# Clear semantic meaning - one transformation
curl /v1/resolvers/company-2-domain -d '{"company": "Tesla"}'
# Returns: "tesla.com"

# Prevents confusion
curl /v1/resolvers/company-2-domain -d '{"company": "Tesla", "url": "stripe.com"}'
# Returns 400: Educational error message
```

**Preserve for Conductor**: Agents should have single, clear input contracts. Orchestration handles multi-input scenarios.

---

### ✅ **2. Minimal vs Verbose Response Pattern**

**The Pattern**: 80/20 rule applied to responses.

```javascript
// Default (80% of use cases): Just give me the result
const domain = await fetch('/v1/resolvers/company-2-domain', {
  body: JSON.stringify({company: "Tesla"})
});
// Returns: "tesla.com" (raw string)

// Verbose (20% of use cases): I need debugging info
const result = await fetch('/v1/resolvers/company-2-domain', {
  body: JSON.stringify({company: "Tesla", verbose: true})
});
// Returns: {
//   resolved_value: "tesla.com",
//   confidence: 1.0,
//   agent_metadata: {...},
//   cache_info: {...},
//   cost_usd: 0.001
// }
```

**Why This Worked**:
- ✅ **Production-ready defaults**: Minimal responses perfect for chaining
- ✅ **Developer experience**: "Just give me the result" for 80% of cases
- ✅ **Debugging when needed**: Full metadata available on demand
- ✅ **Cost visibility**: `verbose: true` exposes AI costs and performance

**Preserve for Conductor**: Workflows should have default "just execute" mode and optional verbose/debug mode with full trace.

---

### ✅ **3. Response Standardization via BaseAgent.execute()**

**The Evolution**:
```javascript
// V1: Every agent returned different formats ❌
// V2: BaseAgent.execute() wrapper standardized everything ✅

async execute(params, env, ctx) {
  const startTime = Date.now();
  const result = await this.executeAgent(params, env, ctx);

  return Response.json({
    success: true,
    data: result?.result || result,
    timestamp: new Date().toISOString(),
    requestId: ctx?.requestId,
    cached: isCached,
    executionTime: Date.now() - startTime
  });
}
```

**Why This Worked**:
- ✅ **Consistent interface**: All agents return identical format
- ✅ **Request tracing**: `requestId` for debugging distributed flows
- ✅ **Cache transparency**: `cached: true/false` visible to consumers
- ✅ **Performance monitoring**: `executionTime` for optimization

**Preserve for Conductor**: Orchestrator should wrap workflow executions with similar standardization (workflowId, cached steps, total execution time).

---

### ✅ **4. Semantic Normalization for Caching**

**The Pattern**: Automatic input cleaning for consistent cache keys.

```javascript
// Normalization functions ensure cache hits
normalizeDomain('https://www.example.com/path') → 'example.com'
normalizeDomain('http://example.com') → 'example.com'
normalizeDomain('example.com') → 'example.com'
// All resolve to same cache entry ✅

normalizeCompany('Tesla, Inc.') → 'tesla inc'
normalizeCompany('  TESLA INC  ') → 'tesla inc'
// Consistent caching despite input variations ✅

// CACHE_INPUT_PARAMS evolution
// V1 (array): ['domain', 'company'] ❌
// V2 (object with functions): { domain: 'normalizeDomain', company: 'normalizeCompany' } ✅
```

**Why This Worked**:
- ✅ **Higher cache hit rates**: Variations of same input hit cache
- ✅ **Cost reduction**: Fewer AI calls for semantically identical inputs
- ✅ **Predictable behavior**: Same logical input = same output

**Preserve for Conductor**: Workflow inputs should support normalization strategies for optimal caching.

---

### ✅ **5. Bot Protection Fallback System**

**The Pattern**: Automatic detection and transparent fallback.

```javascript
// url-2-markdown transformer (primary method)
async executeAgent(params, env, ctx) {
  // Try CloudFlare Browser Rendering first
  const markdown = await this.fetchWithBrowserRendering(url);

  // Detect bot protection (< 800 chars is suspicious)
  if (markdown.length < 800) {
    console.log('Bot protection detected, using html-2-markdown fallback');
    const fallbackAgent = new HtmlToMarkdownTransformerAgent();
    return await fallbackAgent.execute({html: rawHtml}, env);
  }

  return markdown;
}
```

**Why This Worked**:
- ✅ **Transparent to callers**: All agents benefit without code changes
- ✅ **Graceful degradation**: Fallback provides comprehensive content
- ✅ **Automatic detection**: Configurable threshold (800 chars)
- ✅ **Layered architecture**: Transformers can delegate to other transformers

**Preserve for Conductor**: Workflows should support conditional execution and fallback strategies declaratively.

---

### ✅ **6. Cache Warming Strategy**

**The Pattern**: Sequential execution with intentional cache warming.

```javascript
// domain-2-profile generator (orchestrator agent)
async processDomainToProfile(domain, params, env, ctx) {
  // Step 1: Get markdown content (CACHE WARMING)
  const markdownAgent = new UrlToMarkdownTransformerAgent();
  const markdownResult = await this.callAgentAndExtractData(markdownAgent, {domain}, ...);

  // Step 2-5: All these agents benefit from cached markdown (CACHE HITS)
  const typeResult = await this.callAgentAndExtractData(new DomainToTypeClassifierAgent(), {domain}, ...);
  const categoryResult = await this.callAgentAndExtractData(new DomainToCategoryClassifierAgent(), {domain}, ...);
  const industryResult = await this.callAgentAndExtractData(new DomainToIndustryClassifierAgent(), {domain}, ...);
  const sitemapResult = await this.callAgentAndExtractData(new DomainToSitemapTransformerAgent(), {domain}, ...);

  // All classifiers internally call url-2-markdown → cache hits ✅
  // Pay for content extraction once, benefit across all agents ✅
}
```

**Why This Worked**:
- ✅ **Performance gains**: First run ~12s → Cached runs ~6s
- ✅ **Cost efficiency**: Pay for expensive operations once
- ✅ **Predictable behavior**: Same domain = consistent cache state

**Preserve for Conductor**: Orchestrator should understand agent dependencies and optimize execution order for cache efficiency.

---

### ✅ **7. PromptLayer Centralization**

**The Pattern**: All AI prompts managed in PromptLayer, not code.

```javascript
// Agents reference templates by name
const aiParams = await this.getAIParams('classifier-domain-2-category', {
  domain: domain,
  markdown: markdown,
  context: params.context
}, env);

// PromptLayer manages:
// - Prompt versioning (A/B testing without code changes)
// - Model selection (switch models without deploys)
// - Template variables (structured prompt composition)
// - Cost tracking (per-template analytics)
```

**Why This Worked**:
- ✅ **Prompt iteration without deploys**: Update templates in PromptLayer UI
- ✅ **A/B testing**: Version prompts independently from code
- ✅ **Cost attribution**: Track spending by agent/template
- ✅ **Separation of concerns**: Engineers write code, prompt engineers write prompts

**Preserve for Conductor**: Orchestrator should support external prompt management and version workflows independently from prompts.

---

### ✅ **8. Confidence-Based Caching**

**The Pattern**: Only cache high-confidence results.

```javascript
const CONFIG = {
  CACHE_MIN_CONFIDENCE: 0.81,  // Only cache results with confidence >= 81%
  CACHE_MAX_AGE: 90 * 24 * 60 * 60  // 90 days for stable results
};

// Low-confidence results aren't cached → forces re-analysis
// High-confidence results cached long-term → consistent answers
```

**Why This Worked**:
- ✅ **Quality control**: Don't perpetuate low-confidence answers
- ✅ **Self-correcting**: Low-confidence results get re-analyzed
- ✅ **Cost optimization**: Cache stable, confident results long-term

**Preserve for Conductor**: Workflows should support conditional caching based on result quality.

---

## The Compound Agent Pattern: What We Built

### How It Worked

Agents directly instantiated and called other agents within their execution logic:

```javascript
// Example: domain-2-category classifier
export default class DomainToCategoryClassifierAgent extends BaseAgent {
  async executeAgent(params, env, ctx) {
    const result = await this.executeWithCaching({
      agentPrefix: 'dom2cat',
      config: CONFIG,
      params: {domain: params.domain},
      executeFunction: async () => {
        return await this.processDomainToCategory(params.domain, params, env);
      }
    });
    return result;
  }

  async processDomainToCategory(domain, params, env) {
    // Step 1: Instantiate and call child agent directly
    const markdownAgent = new UrlToMarkdownTransformerAgent();
    const markdownResponse = await markdownAgent.execute({domain, verbose: true}, env);

    // Step 2: Unwrap Response object (every agent has to do this)
    const responseData = await markdownResponse.json();
    const markdown = responseData.data.markdown;

    // Step 3: Use extracted data for AI analysis
    const aiParams = await this.getAIParams('classifier-domain-2-category', {
      domain, markdown, context: params.context
    }, env);

    return await this.generateAI(aiParams, {...}, env);
  }
}
```

### Multi-Agent Orchestration: domain-2-profile

The `domain-2-profile` generator demonstrates the full compound agent pattern:

```javascript
export default class DomainToProfileGeneratorAgent extends BaseAgent {
  async processDomainToProfile(domain, params, env, ctx) {
    const agentResults = {};

    // Sequential agent orchestration (hardcoded workflow)
    const markdownAgent = new UrlToMarkdownTransformerAgent();
    agentResults.markdown = await this.callAgentAndExtractData(markdownAgent, {domain, verbose: true}, ...);

    const typeAgent = new DomainToTypeClassifierAgent();
    agentResults.type = await this.callAgentAndExtractData(typeAgent, {domain, verbose: true}, ...);

    const categoryAgent = new DomainToCategoryClassifierAgent();
    agentResults.category = await this.callAgentAndExtractData(categoryAgent, {domain, verbose: true}, ...);

    const industryAgent = new DomainToIndustryClassifierAgent();
    agentResults.industry = await this.callAgentAndExtractData(industryAgent, {domain, verbose: true}, ...);

    const sitemapAgent = new DomainToSitemapTransformerAgent();
    agentResults.sitemap = await this.callAgentAndExtractData(sitemapAgent, {domain, verbose: true}, ...);

    // Determine PromptLayer template based on entity type
    const templateName = agentResults.type.primary_type === 'investor'
      ? 'generator-domain-2-investor-profile'
      : 'generator-domain-2-company-profile';

    // Generate final profile with collected intelligence
    const aiParams = await this.getAIParams(templateName, {
      category: agentResults.category.category_name,
      industry: agentResults.industry.industry_name,
      markdown: agentResults.markdown.markdown,
      sitemap: JSON.stringify(agentResults.sitemap.sitemap, null, 2),
      context: params.context || ''
    }, env);

    return await this.generateAI(aiParams, {...}, env);
  }
}
```

### Key Characteristics

- **Direct instantiation**: `new AgentClass()` within agent code
- **Synchronous/sequential execution**: Agents wait for child agent responses
- **Response unwrapping**: Each agent handles extracting data from Response objects
- **Cache warming**: First agent (url-2-markdown) warms cache for subsequent agents
- **Hierarchical structure**: Generator → Classifiers → Transformers
- **Helper method**: `callAgentAndExtractData()` centralizes unwrapping logic

---

## Key Problems & Challenges

### 🔴 **1. Agent vs Orchestrator Blur**

**The Problem**: Generator agents became mini-orchestrators, but lacked orchestration tools.

```javascript
// domain-2-profile contains hardcoded 5-agent workflow
// This is 80% orchestration logic, 20% agent logic
async processDomainToProfile(domain, params, env, ctx) {
  const markdownResult = await callAgent1();  // Orchestration
  const typeResult = await callAgent2();      // Orchestration
  const categoryResult = await callAgent3();  // Orchestration
  const industryResult = await callAgent4();  // Orchestration
  const sitemapResult = await callAgent5();   // Orchestration

  // Only this part is actual "generator agent" logic:
  return await this.generateAI(templateName, {...}, env);
}
```

**Impact**:
- Every new workflow required a new "generator" agent with baked-in orchestration
- Orchestration logic scattered across multiple agent files
- Difficult to visualize entire workflow
- No way to modify agent sequence without code changes

**What We Wanted**:
```yaml
# domain-2-profile.workflow.yaml
name: domain-2-profile
steps:
  - agent: url-2-markdown
    output: markdown
  - agent: domain-2-type
    output: type
  - agent: domain-2-category
    output: category
  - agent: domain-2-industry
    output: industry
  - agent: domain-2-sitemap
    output: sitemap
  - agent: profile-generator
    inputs:
      markdown: ${steps.markdown.result}
      type: ${steps.type.result}
      category: ${steps.category.result}
      industry: ${steps.industry.result}
      sitemap: ${steps.sitemap.result}
```

---

### 🔴 **2. State Management Complexity**

**The Problem**: No shared context or state between agent calls.

```javascript
// Each agent call is completely isolated
const markdownResult = await this.callAgentAndExtractData(markdownAgent, {domain}, ...);
const typeResult = await this.callAgentAndExtractData(typeAgent, {domain}, ...);

// typeAgent has NO access to markdownResult unless explicitly passed in params
// But typeAgent internally calls url-2-markdown again (benefits from cache, but still redundant)
```

**Impact**:
- Manual parameter passing between agents
- Duplicate data extraction logic
- No global workflow state accessible to all agents
- Hard to implement conditional logic based on previous results
- Can't easily say "if type=investor, run investor-specific agents"

**What We Wanted**:
```yaml
# Workflow state available to all steps
context:
  domain: ${input.domain}
  markdown: ${steps.url-2-markdown.result}
  type: ${steps.domain-2-type.result}

# Conditional execution based on state
- agent: investor-specific-classifier
  when: ${context.type} == 'investor'
```

---

### 🔴 **3. Debugging & Observability Challenges**

**The Problem**: Nested agent calls create opaque execution traces.

```javascript
// Request: domain-2-profile for "example.com"
// Actual execution tree (invisible to developer):
domain-2-profile
├── url-2-markdown (350ms, $0.001)
├── domain-2-type (2100ms, $0.003)
│   └── url-2-markdown (cached, 12ms)  // Nested call
├── domain-2-category (1800ms, $0.003)
│   └── url-2-markdown (cached, 8ms)   // Nested call
├── domain-2-industry (2000ms, $0.003)
│   └── url-2-markdown (cached, 9ms)   // Nested call
└── domain-2-sitemap (1500ms, $0.002)
    └── url-2-markdown (cached, 7ms)   // Nested call
// Total: ~7.8s, $0.012 (but hard to see this breakdown)
```

**Impact**:
- Can't easily see which agent called which
- Hard to trace failures through call stack
- Cache hits scattered across agents with no unified view
- No single place to see "workflow status"
- Cost attribution difficult (which agent contributed to total cost?)

**What We Wanted**:
```bash
# Workflow execution trace
workflow: domain-2-profile
workflowId: wf_abc123
status: completed
duration: 7800ms
cost: $0.012

steps:
  1. url-2-markdown     [completed] 350ms  $0.001  (cache_miss)
  2. domain-2-type      [completed] 2100ms $0.003  (cache_miss)
  3. domain-2-category  [completed] 1800ms $0.003  (cache_miss)
  4. domain-2-industry  [completed] 2000ms $0.003  (cache_miss)
  5. domain-2-sitemap   [completed] 1500ms $0.002  (cache_miss)

cache_efficiency: 4/5 steps hit markdown cache (80%)
```

---

### 🔴 **4. Testing Compound Agents**

**The Problem**: Testing generators requires mocking multiple child agents.

```javascript
// To test domain-2-profile, you need to mock:
// - UrlToMarkdownTransformerAgent
// - DomainToTypeClassifierAgent
// - DomainToCategoryClassifierAgent
// - DomainToIndustryClassifierAgent
// - DomainToSitemapTransformerAgent
// - PromptLayer API calls
// - Cloudflare KV cache

// Each agent has its own dependencies → brittle test setup
```

**Impact**:
- Reduced test coverage (too hard to test)
- Integration tests are slow (real LLM calls)
- Mocking becomes brittle when agent signatures change
- Can't test orchestration logic independently from agent logic

**What We Wanted**:
```javascript
// Test workflow orchestration independently
test('domain-2-profile orchestrates 5 agents correctly', () => {
  const workflow = loadWorkflow('domain-2-profile.yaml');
  expect(workflow.steps).toHaveLength(5);
  expect(workflow.steps[0].agent).toBe('url-2-markdown');
  // ... test workflow structure without executing agents
});

// Test agents in isolation
test('domain-2-type classifies correctly', async () => {
  const agent = new DomainToTypeClassifier();
  const result = await agent.execute({
    domain: 'example.com',
    markdown: mockMarkdown  // Inject markdown directly
  });
  expect(result.primary_type).toBe('company');
});
```

---

### 🔴 **5. Deployment & Versioning**

**The Problem**: Changing a child agent affects all parent agents.

```javascript
// Update url-2-markdown (add new bot protection logic)
// → Affects 8+ agents that call it:
//   - domain-2-type
//   - domain-2-category
//   - domain-2-industry
//   - domain-2-company
//   - domain-2-profile
//   - domain-2-product-summary
//   - domain-2-sitemap
//   - (any future agent that needs markdown)

// Cache invalidation cascades unpredictably:
// - Change CACHE_VERSION in url-2-markdown
// - → All downstream agents get cache misses
// - → No way to gradually roll out changes
```

**Impact**:
- Fear of breaking changes (one agent breaks many workflows)
- Slower iteration velocity (test all dependent agents)
- Cache invalidation cascades (change one agent, invalidate everything)
- Rollback requires coordinating multiple agent versions
- No canary deployments (can't test new agent version on 5% of traffic)

**What We Wanted**:
```yaml
# Version workflows independently from agents
domain-2-profile.v1.yaml:
  steps:
    - agent: url-2-markdown@v2.1.0  # Pin specific agent version
    - agent: domain-2-type@v1.5.0

domain-2-profile.v2.yaml:
  steps:
    - agent: url-2-markdown@v3.0.0  # Test new agent in new workflow version
    - agent: domain-2-type@v1.5.0   # Keep old type classifier

# Deploy both versions, route 95% to v1, 5% to v2 (canary)
```

---

### 🔴 **6. Hardcoded Orchestration Logic**

**The Problem**: Workflow logic embedded in JavaScript code.

```javascript
// To change this sequence, you MUST modify code and redeploy
const markdownResult = await callAgent1();
const typeResult = await callAgent2();
const categoryResult = await callAgent3();

// Want to add a new step? Edit JavaScript:
const industryResult = await callAgent4();  // Added manually
```

**Impact**:
- Non-technical stakeholders can't modify workflows
- Every change requires engineering (edit code, test, deploy)
- Can't experiment with workflow variations (A/B test different sequences)
- Workflow logic scattered across agent files (no single source of truth)

**What We Wanted**:
```yaml
# Product manager can modify this without engineering
workflow: domain-2-profile
steps:
  - agent: url-2-markdown
  - agent: domain-2-type
  - agent: domain-2-category
  - agent: domain-2-industry      # Easy to add
  - agent: new-experimental-agent # Easy to experiment

# Version control in Git, deploy without code changes
```

---

### 🔴 **7. Error Handling & Retry Logic**

**The Problem**: Each agent implements its own error handling.

```javascript
// No consistent retry strategy across agents
async processDomainToCategory(domain, params, env) {
  try {
    const markdownResult = await markdownAgent.execute({domain}, env);
    // What if this fails? Return error, retry, use fallback?
  } catch (error) {
    // Each agent handles errors differently
    return { category: null, confidence: 0.0, error: error.message };
  }
}

// Partial failures hard to handle:
// - What if agent 3 of 5 fails in domain-2-profile?
// - Do we return partial results? Fail entirely? Retry just that step?
```

**Impact**:
- Workflows fail completely instead of degrading gracefully
- No circuit breaker patterns (if external API is down, keep calling it)
- Can't easily implement "fallback to cheaper model" strategies
- Retry logic duplicated across agents
- No partial success handling (get results from 4/5 agents)

**What We Wanted**:
```yaml
# Declarative error handling in workflow
workflow: domain-2-profile
error_strategy: partial_success  # Allow partial results

steps:
  - agent: url-2-markdown
    retry: 3                      # Retry 3 times on failure
    timeout: 10s
    fallback: html-2-markdown     # Use fallback agent on failure

  - agent: domain-2-category
    retry: 2
    required: false               # Optional step, don't fail workflow

  - agent: domain-2-type
    required: true                # Workflow fails if this fails
```

---

### 🔴 **8. Performance Optimization Limited**

**The Problem**: Sequential execution is baked in, can't parallelize.

```javascript
// These COULD run in parallel (all use same markdown input), but don't:
const typeResult = await callAgent(typeAgent, {domain});        // 2100ms
const categoryResult = await callAgent(categoryAgent, {domain}); // 1800ms
const industryResult = await callAgent(industryAgent, {domain}); // 2000ms
// Total: 5900ms sequential

// Could be ~2100ms if parallel (longest agent), but requires refactoring:
const [typeResult, categoryResult, industryResult] = await Promise.all([
  callAgent(typeAgent, {domain}),
  callAgent(categoryAgent, {domain}),
  callAgent(industryAgent, {domain})
]);
// Total: 2100ms parallel ✅
```

**Impact**:
- Workflows slower than necessary (sequential by default)
- Manually identifying parallelizable steps requires code analysis
- Refactoring for performance requires code changes
- Can't optimize workflows without engineering

**What We Wanted**:
```yaml
# Orchestrator detects parallelizable steps automatically
workflow: domain-2-profile
steps:
  - agent: url-2-markdown
    output: markdown

  # These 3 steps only depend on markdown → run in parallel
  - parallel:
      - agent: domain-2-type
        inputs: {markdown: ${markdown}}
      - agent: domain-2-category
        inputs: {markdown: ${markdown}}
      - agent: domain-2-industry
        inputs: {markdown: ${markdown}}
```

---

## What Led to V3 (Conductor)

### The "Aha" Moments

1. **"We're building workflows in code"**
   - Realized that `domain-2-profile` is 80% orchestration, 20% agent logic
   - Every generator agent is really a hardcoded workflow

2. **"Every new workflow is a new agent"**
   - Want product summaries? Build `domain-2-product-summary`
   - Want investor profiles? Build `domain-2-investor-profile`
   - The pattern is always: call agents → combine results → generate output

3. **"We can't see the forest for the trees"**
   - No way to visualize or understand complex workflows without reading code
   - Debugging requires tracing through nested agent calls manually

4. **"Cache warming is manual"**
   - The `url-2-markdown` → classifiers pattern emerged organically
   - But we have to code it manually in every generator agent

5. **"Parallel execution requires refactoring"**
   - Wanted to speed up profile generation by running classifiers in parallel
   - Would require significant code changes (Promise.all, error handling)

6. **"We built internal-only agents"**
   - Classifiers aren't in the public API—they only exist for orchestration
   - This proves we need orchestration separate from agents

7. **"PromptLayer shows us the way"**
   - We externalized prompts to PromptLayer (huge win)
   - Why not externalize orchestration too?

### The V3 Vision (Conductor)

Based on these pain points, Conductor should provide:

#### **Core Principles**
- ✅ **Declarative workflows** (YAML-driven) for non-technical modification
- ✅ **Explicit orchestration layer** separate from agent logic
- ✅ **Workflow state management** with shared context accessible to all steps
- ✅ **Parallel execution** where dependencies allow
- ✅ **Enhanced observability** with workflow-level tracing and cost tracking
- ✅ **Flexible error handling** (retry, fallback, partial success)
- ✅ **Version control for workflows** independent of agent versions
- ✅ **Visual workflow representation** for understanding complex flows
- ✅ **Standardized agent interface** for easier testing

#### **Preserve the Good Patterns**
- ✅ **Strict single-input validation** for agents
- ✅ **Minimal vs verbose response** pattern
- ✅ **Semantic normalization** for caching
- ✅ **Confidence-based caching** for quality control
- ✅ **PromptLayer integration** for prompt management
- ✅ **Response standardization** via orchestrator wrapper
- ✅ **Bot protection fallback** patterns (conditional execution)

#### **Fix the Problems**
- 🔧 **Separate agents from orchestration**: Agents do one thing, workflows compose them
- 🔧 **Declarative workflow definition**: YAML files, not JavaScript classes
- 🔧 **Workflow state management**: Shared context object passed through steps
- 🔧 **Automatic parallelization**: Detect independent steps, run concurrently
- 🔧 **Workflow-level observability**: Single trace for entire workflow execution
- 🔧 **Independent versioning**: Version workflows separately from agent code
- 🔧 **Testable orchestration**: Test workflow structure without executing agents

---

## Technical Implementation Details

### File Structure (V2)
```
src/
├── agents/
│   ├── classifiers/           # Internal-only agents (orchestration helpers)
│   │   ├── domain-2-type.js
│   │   ├── domain-2-category.js
│   │   └── domain-2-industry.js
│   ├── generators/            # Public API + orchestration logic (problematic)
│   │   ├── domain-2-profile.js          # 80% orchestration, 20% generation
│   │   ├── domain-2-product-summary.js  # 80% orchestration, 20% generation
│   │   ├── humanize.js                  # Pure generator ✅
│   │   └── compliance.js                # Pure generator ✅
│   ├── resolvers/             # Public API (single-input, pure agents ✅)
│   │   ├── domain-2-company.js
│   │   └── company-2-domain.js
│   └── transformers/          # Public API (pure transformers ✅)
│       ├── url-2-markdown.js
│       ├── domain-2-sitemap.js
│       └── html-2-markdown.js
└── lib/
    ├── base-agent.js          # Centralized response standardization ✅
    └── promptlayer.js         # Prompt management ✅
```

### Key Abstractions (V2)

1. **`executeWithCaching()`** - Handles cache key generation, lookup, and storage
2. **`callChildAgent()`** - Manages agent-to-agent calls with parameter cascading
3. **`getAIParams()`** - Fetches PromptLayer templates and prepares AI calls
4. **`normalizeDomain()`** / **`normalizeCompany()`** - Ensures consistent cache keys
5. **`validateSingleCacheInput()`** - Enforces strict single-input validation

### Integration Patterns (V2)

- **PromptLayer**: Template management for AI prompts (external system ✅)
- **Cloudflare KV**: Agent result caching (90-day TTLs, confidence-based)
- **External APIs**: Jina AI (markdown conversion), company databases
- **Bot Protection Fallback**: url-2-markdown → html-2-markdown (conditional execution)

---

## Proposed Conductor Architecture

### File Structure (V3)
```
conductor/
├── workflows/                 # Declarative workflow definitions
│   ├── domain-2-profile.yaml
│   ├── domain-2-product-summary.yaml
│   └── investor-due-diligence.yaml
├── agents/                    # Pure agents (no orchestration)
│   ├── classifiers/
│   ├── generators/
│   ├── resolvers/
│   └── transformers/
├── orchestrator/              # Workflow execution engine
│   ├── executor.js            # Runs workflows
│   ├── state-manager.js       # Shared workflow context
│   ├── step-resolver.js       # Dependency resolution
│   └── cache-optimizer.js     # Cache warming strategies
└── lib/
    ├── base-agent.js          # Keep this! ✅
    └── promptlayer.js         # Keep this! ✅
```

### Example Workflow (V3)
```yaml
# workflows/domain-2-profile.yaml
name: domain-2-profile
version: 1.0.0
description: Generate comprehensive markdown profiles for domains

inputs:
  domain:
    type: string
    required: true
    normalize: normalizeDomain

outputs:
  profile_markdown: ${steps.generate-profile.result.text}
  entity_type: ${steps.domain-2-type.result.primary_type}

cache:
  strategy: domain_level
  ttl: 7776000  # 90 days
  min_confidence: 0.81

steps:
  # Step 1: Extract content (cache warming)
  - id: extract-content
    agent: url-2-markdown
    inputs:
      domain: ${inputs.domain}
    timeout: 10s
    retry: 3
    fallback: html-2-markdown

  # Steps 2-5: Classify in parallel (all depend on markdown)
  - id: classify
    parallel:
      - id: domain-2-type
        agent: domain-2-type
        inputs:
          domain: ${inputs.domain}
          markdown: ${steps.extract-content.result.markdown}
        required: true

      - id: domain-2-category
        agent: domain-2-category
        inputs:
          domain: ${inputs.domain}
          markdown: ${steps.extract-content.result.markdown}
        required: false  # Optional

      - id: domain-2-industry
        agent: domain-2-industry
        inputs:
          domain: ${inputs.domain}
          markdown: ${steps.extract-content.result.markdown}
        required: false  # Optional

      - id: domain-2-sitemap
        agent: domain-2-sitemap
        inputs:
          domain: ${inputs.domain}
          markdown: ${steps.extract-content.result.markdown}
        required: false  # Optional

  # Step 6: Generate profile based on entity type
  - id: generate-profile
    agent: profile-generator
    inputs:
      markdown: ${steps.extract-content.result.markdown}
      type: ${steps.classify.domain-2-type.result.primary_type}
      category: ${steps.classify.domain-2-category.result.category_name}
      industry: ${steps.classify.domain-2-industry.result.industry_name}
      sitemap: ${steps.classify.domain-2-sitemap.result.sitemap}
    template: |
      ${steps.classify.domain-2-type.result.primary_type == 'investor'
        ? 'generator-domain-2-investor-profile'
        : 'generator-domain-2-company-profile'}
    timeout: 30s
    required: true

error_handling:
  strategy: partial_success  # Return results even if optional steps fail
  on_failure:
    - log_error
    - return_partial_results
```

### Orchestrator Execution (V3)
```javascript
// conductor/orchestrator/executor.js
export class WorkflowExecutor {
  async execute(workflowPath, inputs, options = {}) {
    const workflow = await this.loadWorkflow(workflowPath);
    const context = new WorkflowContext(workflow, inputs);

    // Validate inputs
    this.validateInputs(workflow.inputs, inputs);

    // Build execution DAG (detect parallelizable steps)
    const dag = this.buildExecutionDAG(workflow.steps);

    // Execute steps (parallel where possible)
    for (const level of dag.levels) {
      const stepPromises = level.steps.map(step =>
        this.executeStep(step, context, options)
      );
      await Promise.allSettled(stepPromises);
    }

    // Return standardized response (like BaseAgent.execute())
    return {
      success: true,
      data: this.resolveOutputs(workflow.outputs, context),
      workflowId: context.workflowId,
      timestamp: new Date().toISOString(),
      cached: context.allStepsCached(),
      executionTime: context.getTotalTime(),
      steps: context.getStepSummary(),  // Observability ✅
      cost: context.getTotalCost(),     // Cost tracking ✅
      verbose: options.verbose || false
    };
  }

  async executeStep(step, context, options) {
    const agent = this.loadAgent(step.agent);
    const inputs = this.resolveInputs(step.inputs, context);

    try {
      const result = await this.executeWithRetry(
        () => agent.execute(inputs, this.env, context),
        step.retry || 0
      );

      context.setStepResult(step.id, result);

    } catch (error) {
      if (step.fallback) {
        const fallbackAgent = this.loadAgent(step.fallback);
        const result = await fallbackAgent.execute(inputs, this.env, context);
        context.setStepResult(step.id, result);
      } else if (step.required) {
        throw error;  // Fail workflow
      } else {
        context.setStepResult(step.id, null);  // Partial success
      }
    }
  }
}
```

---

## Lessons Learned: What to Preserve, What to Change

### 🎓 **Preserve: Design Patterns That Worked**

| Pattern | Why It Worked | How Conductor Uses It |
|---------|---------------|----------------------|
| **Strict single-input validation** | Semantic clarity, predictable caching | Agents keep this, workflows compose multi-input scenarios |
| **Minimal vs verbose responses** | 80/20 rule, production-friendly defaults | Workflows support `verbose` flag for full trace |
| **Response standardization** | Consistent interface, request tracing | Workflow responses standardized like BaseAgent |
| **Semantic normalization** | Higher cache hit rates, cost savings | Workflows support input normalization strategies |
| **Confidence-based caching** | Quality control, self-correcting | Workflows support conditional caching rules |
| **PromptLayer centralization** | Prompt iteration without deploys | Workflows reference external prompts |
| **Bot protection fallback** | Graceful degradation, transparent | Workflows support conditional execution + fallbacks |
| **Cache warming strategy** | Performance gains, cost efficiency | Orchestrator optimizes step execution order |

### 🔧 **Change: What Didn't Scale**

| Problem | V2 Approach | V3 (Conductor) Approach |
|---------|-------------|-------------------------|
| **Agent vs orchestrator blur** | Generators contain orchestration logic | Separate: agents do one thing, workflows compose them |
| **State management** | Manual parameter passing | Shared workflow context accessible to all steps |
| **Debugging/observability** | Nested calls, opaque traces | Workflow-level traces with step breakdown |
| **Testing** | Mock all child agents | Test workflows independently from agents |
| **Deployment/versioning** | Coupled (change one agent, affect many) | Independent (version workflows separately) |
| **Hardcoded orchestration** | JavaScript classes | Declarative YAML files |
| **Error handling** | Inconsistent, per-agent | Declarative retry/fallback/partial success |
| **Performance** | Sequential by default | Automatic parallelization via DAG |

### 🎯 **Core Insight**

**V2 succeeded at building great agents, but orchestration was an afterthought embedded in agent code.**

**V3 should make orchestration first-class**: Workflows are declarative, versionable, testable artifacts separate from agent implementations.

---

## Recommendations for Conductor (V3)

### 1. **Keep the Agent Types & Interfaces**
- ✅ Classifiers, Generators, Resolvers, Transformers are good mental models
- ✅ BaseAgent standardization was excellent
- ✅ Strict single-input validation for agents
- ✅ Minimal/verbose response pattern

### 2. **Extract Orchestration to YAML Workflows**
- ✅ Workflows are YAML files, not JavaScript classes
- ✅ Version control workflows in Git
- ✅ Deploy workflows without code changes
- ✅ Non-technical stakeholders can modify workflows

### 3. **Implement Workflow State Management**
- ✅ Shared context object passed through workflow steps
- ✅ Steps can reference previous step outputs: `${steps.extract-content.result.markdown}`
- ✅ Conditional execution: `when: ${steps.type.result} == 'investor'`

### 4. **Enable Automatic Parallelization**
- ✅ Build execution DAG from workflow definition
- ✅ Detect independent steps (no dependencies) → run in parallel
- ✅ Sequential when dependencies exist (step B needs step A output)

### 5. **Enhance Observability**
- ✅ Workflow-level traces with step breakdown
- ✅ Cost tracking per step and total
- ✅ Cache hit/miss visibility per step
- ✅ Execution time breakdown
- ✅ Request tracing: `workflowId` like `requestId`

### 6. **Simplify Agent Interface**
- ✅ Agents receive input, return output—no nesting
- ✅ Agents don't call other agents (orchestrator does that)
- ✅ Agents can be tested in isolation with mock inputs

### 7. **Version Workflows Independently**
- ✅ Git-track YAML files
- ✅ Pin agent versions: `agent: url-2-markdown@v2.1.0`
- ✅ Canary deployments: route 5% to workflow v2, 95% to v1

### 8. **Implement Graceful Degradation**
- ✅ Declarative error handling: retry, fallback, partial success
- ✅ Optional vs required steps
- ✅ Circuit breaker patterns
- ✅ Fallback to cheaper models

### 9. **Maintain Excellent Caching**
- ✅ Domain normalization and cache warming patterns
- ✅ Confidence-based caching
- ✅ Orchestrator optimizes cache hit rates by step ordering

### 10. **Keep PromptLayer Integration**
- ✅ Workflows reference PromptLayer templates
- ✅ Version prompts independently from workflows
- ✅ A/B test prompts without workflow changes

---

## Conclusion

The V2 agent architecture successfully demonstrated the value of AI-powered intelligence gathering and established **excellent design patterns** (strict validation, minimal/verbose responses, semantic normalization, PromptLayer integration). However, it revealed fundamental limitations in using direct agent-to-agent calls for orchestration. The compound agent pattern worked for simple workflows but didn't scale to complex, multi-step processes requiring flexibility, observability, and performance optimization.

**Key Takeaway**: V2 built great agents but embedded orchestration logic within them. Generators like `domain-2-profile` are 80% orchestration, 20% agent logic—proving that orchestration deserves to be first-class.

**Conductor (V3) should be the orchestration layer V2 needed but never had**:
- Preserve the excellent agent abstractions and design patterns
- Separate the "what" (agents) from the "how" (workflows)
- Make workflows declarative, versionable, and observable
- Enable parallelization, graceful degradation, and independent versioning

The path forward: **Keep the agents, externalize the orchestration**.

---

**Built with ❤️ by the OwnerCo Engineering Team**
