# Migration Gaps: V2 → Conductor

Analysis of missing capabilities needed to migrate previous-generation agents (V2 ownerco-api-edge) to Conductor. Based on the url-2-markdown 3-tier fallback system and BaseAgent pattern.

**Philosophy:** Conductor should ship with powerful built-in members (agents) and utilities, not force users to rebuild common patterns. Think "batteries included" - scraping, validation, normalization should work out of the box.

---

## Category 1: Built-In Members (Ship with Conductor)

These are common, reusable members that should be included in Conductor's core distribution in `src/members/built-in/`. Users shouldn't have to rebuild browser rendering or scraping logic - they just use `scrape`.

### 1. Scrape Member (Built-In)
**Name:** `scrape`
**Type:** Built-in member that ships with Conductor
**Status:** ❌ Missing
**Priority:** 🔴 Critical - Required for V2 migration

**What it is:**
A batteries-included scraping member with intelligent 3-tier fallback, bot protection detection, and automatic markdown conversion. Users just call `scrape` - they don't build browser rendering logic.

**Usage (what users write):**
```yaml
# Simple scraping - just works
flow:
  - member: scrape
    input:
      url: https://example.com
    output: content

# Advanced configuration (optional)
flow:
  - member: scrape
    input:
      url: https://example.com
    config:
      strategy: aggressive  # 'fast', 'balanced', 'aggressive'
      returnFormat: markdown  # or 'html', 'text'
      timeout: 15000
    output: content
```

**What Conductor provides (built-in):**
```typescript
// src/members/built-in/scrape-member.ts
export class ScrapeMember extends BaseMember {
  // 🥇 Tier 1: CF Browser Rendering (domcontentloaded) - Fast, ~350ms
  // 🥈 Tier 2: CF Browser Rendering (networkidle2) - JS wait, ~2s
  // 🥉 Tier 3: Raw HTML fetch + parsing - Fallback, ~1.5s

  // Features:
  // - Automatic bot protection detection
  // - WordPress/CMS-optimized blocking patterns
  // - Cloudflare Browser Rendering API integration
  // - Resource blocking (images, fonts, analytics)
  // - Intelligent success validation (800+ chars, no bot keywords)
  // - Per-tier caching
  // - Tier progression tracking
}
```

**Configuration options:**
- `strategy`: 'fast' (tier 1 only), 'balanced' (tiers 1-2), 'aggressive' (all 3 tiers)
- `returnFormat`: 'markdown', 'html', 'text'
- `timeout`: Per-tier timeout (default 15000ms)
- `userAgent`: Custom user agent (defaults to env.BROWSER_USER_AGENT)

**Why built-in:**
- Scraping is fundamental for AI agents (RAG, content analysis)
- Complex to implement correctly (3-tier fallback, bot protection, CF API)
- Users shouldn't reinvent browser rendering integration
- Cloudflare Workers benefit from optimized CF Browser Rendering API usage

**Implementation needs:**
- Cloudflare Browser Rendering API client
- 3-tier fallback logic with transparent degradation
- Bot protection detection (800 char threshold, keyword detection)
- Resource/request pattern blocking
- HTML → Markdown conversion (tier 3)
- Per-tier caching with progression tracking

---

### 2. Validate Member (Built-In)
**Name:** `validate`
**Type:** Built-in Scoring member
**Status:** ❌ Missing
**Priority:** 🔴 Critical - Used by `scrape` member

**What it is:**
Rule-based validation for content, responses, or data. Used internally by `scrape` member for bot protection detection, but also useful standalone for quality gates.

**Usage:**
```yaml
# Used internally by scrape member (automatic)

# Standalone validation use case
flow:
  - member: validate
    input:
      content: ${steps.fetch.result}
    config:
      rules:
        minLength: 800
        noBotProtection: true
        hasWebsiteElements: true
      threshold: 0.7
    output: isValid

  # Conditional execution based on validation
  - member: process-content
    when: ${steps.validate.isValid}
```

**Why built-in:**
- Common pattern for quality control and gates
- Bot protection detection is non-trivial (keyword lists, heuristics)
- Reusable across many workflows (not just scraping)

---

### 3. Fetch Member (Built-In)
**Name:** `fetch`
**Type:** Built-in Data member
**Status:** 🟡 Partially exists (DataMember can fetch, but not optimized)
**Priority:** 🟡 Medium - Nice to have

**What it is:**
HTTP client for API calls with retry logic, timeout, and response transformation. Simpler than `scrape` - just fetches data without browser rendering.

**Usage:**
```yaml
flow:
  - member: fetch
    input:
      url: https://api.example.com/data
    config:
      method: GET
      headers:
        Authorization: Bearer ${env.API_KEY}
      timeout: 5000
      retry: 3
      cache: true
    output: data
```

**Why built-in:**
- API calls are fundamental (external data, webhooks)
- Retry/timeout logic should be standardized
- Users shouldn't reinvent HTTP client patterns

---

## Category 2: Built-In Utilities (Framework-Level)

These are utilities and helpers built into BaseMember and the Conductor framework. Not separate members, but capabilities all members can use via `this.normalize()`, `this.resolveUrl()`, etc.

### 1. Normalization Functions
**Location:** `src/utils/normalization.ts` + BaseMember helper methods
**Status:** ❌ Missing
**Priority:** 🔴 Critical - Essential for caching

**What it is:**
Input normalization for consistent cache keys. Ensures variations of the same input (e.g., "tesla.com", "www.tesla.com", "https://tesla.com/") all hit the same cache entry.

**What V2 had:**
```javascript
// BaseAgent provided normalization
normalizeURL('https://www.example.com/path') → 'https://example.com/path'
normalizeDomain('https://www.example.com/path') → 'example.com'
normalizeCompany('Tesla, Inc.') → 'tesla inc'
```

**What Conductor needs:**
```typescript
// src/utils/normalization.ts - Normalization registry
export const Normalizers = {
  url: (url: string) => string,        // Preserve path, remove www
  domain: (domain: string) => string,  // Domain only, no protocol/path
  company: (company: string) => string, // Lowercase, trim, no punctuation
  email: (email: string) => string,    // Lowercase, trim
  custom: (fn: Function) => any        // User-defined normalizers
};

// BaseMember helper
class BaseMember {
  protected normalize(input: any, type: 'url' | 'domain' | 'company'): any {
    return Normalizers[type](input);
  }
}

// Members use it
class CustomMember extends BaseMember {
  async run(context) {
    const domain = this.normalize(context.input.domain, 'domain');
    // domain is now normalized for caching
  }
}
```

**Member configuration:**
```yaml
# members/scraper/member.yaml
name: scraper
type: Function
config:
  normalization:
    url: domain  # Normalize URL to domain-level for caching
    company: company  # Normalize company names
```

**Why built-in:**
- Essential for high cache hit rates (cost savings)
- Complex to implement correctly (URL parsing edge cases)
- Should be consistent across all members
- V2 proved this pattern works (90-day cache with high hit rates)

---

### 2. URL Resolution
**Location:** `src/utils/url-resolver.ts` + BaseMember helper
**Status:** ❌ Missing
**Priority:** 🟡 Medium - Nice to have

**What it is:**
Bidirectional www resolution with pre-flight checks. Tries `domain.com` and `www.domain.com`, follows redirects, returns final URL.

**What V2 had:**
```javascript
// Try both variants, follow redirects
await resolveUrl('tesla.com')
// Returns: { url: 'https://tesla.com', redirected: false, attempts: [...] }

await resolveUrl('example.com')
// Returns: { url: 'https://www.example.com', redirected: true, attempts: [...] }
```

**What Conductor needs:**
```typescript
// src/utils/url-resolver.ts
export class URLResolver {
  async resolve(domain: string): Promise<{
    url: string;
    redirected: boolean;
    finalDomain: string;
    attempts: Array<{ url: string; status: number }>;
  }>;
}

// BaseMember helper
class BaseMember {
  protected async resolveUrl(domain: string) {
    return new URLResolver().resolve(domain);
  }
}
```

**Why built-in:**
- Common pattern for scraping (try both www variants)
- Handles redirects automatically
- Reduces 404 errors from incorrect domain variants

---

### 3. Response Metadata
**Location:** BaseMember
**Status:** 🟡 Partially exists (MemberResponse has some metadata)
**Priority:** 🟡 Medium - DX improvement

**What it is:**
Standardized metadata generation for all member responses. Includes execution time, cache status, version, tier info (for scrape), etc.

**What V2 had:**
```javascript
// Every response included standardized metadata
{
  success: true,
  data: result,
  timestamp: '2024-01-15T10:30:00Z',
  requestId: 'req_abc123',
  cached: false,
  executionTime: 1250,
  agent_metadata: {
    agent: 'url-2-markdown',
    version: '2.2.0',
    tier_used: 2,
    tier_progression: [...]
  }
}
```

**What Conductor needs:**
```typescript
// BaseMember automatically includes metadata
class BaseMember {
  protected createMetadata(additionalInfo?: Record<string, any>) {
    return {
      member: this.config.name,
      type: this.config.type,
      version: this.config.version || '1.0.0',
      timestamp: new Date().toISOString(),
      executionId: context.executionId,
      ...additionalInfo
    };
  }
}

// MemberResponse includes it
interface MemberResponse {
  result: any;
  metadata: {
    executionTime: number;
    cached: boolean;
    member: string;
    // ... etc
  };
}
```

---

### 4. Verbose vs Minimal Response Modes
**Location:** Executor + BaseMember
**Status:** ❌ Missing
**Priority:** 🟡 Medium - DX improvement

**What it is:**
80/20 rule for responses. Default (80% of cases): just the result. Verbose mode (20%): full metadata, trace, costs.

**What V2 had:**
```javascript
// Default: minimal
const content = await fetch('/scrape', {body: {url: 'example.com'}});
// Returns: { markdown: "..." }

// Verbose: full metadata
const result = await fetch('/scrape', {body: {url: 'example.com', verbose: true}});
// Returns: {
//   markdown: "...",
//   url: "...",
//   extracted_at: "...",
//   processing_time_ms: 1250,
//   tier_used: 2,
//   tier_progression: [...],
//   cache_info: {...}
// }
```

**What Conductor needs:**
```yaml
# Ensemble-level verbose control
name: scrape-website
output_mode: minimal  # or 'verbose' (default: minimal)

# Minimal output (default)
output:
  content: ${steps.scrape.result.markdown}

# Verbose output (when verbose=true in request)
verbose_output:
  content: ${steps.scrape.result.markdown}
  metadata:
    url: ${steps.scrape.result.url}
    execution_time: ${execution.time}
    tier_used: ${steps.scrape.tier}
    cache_info: ${execution.cache_info}
```

---

## Category 3: Framework Features

These are architectural features that need to be built into Conductor's core - not members or utilities, but capabilities of the orchestration layer itself.

### 1. Prompt Versioning System
**Location:** Think member + new PromptManager
**Status:** ❌ Missing
**Priority:** 🔴 Critical - Core feature
**Note:** We will NOT use PromptLayer - building our own system

**What it is:**
External prompt management with versioning, A/B testing, and iteration without code changes. Similar to PromptLayer concept, but our own implementation.

**What V2 had (PromptLayer):**
```javascript
// Prompts stored externally, referenced by name
const aiParams = await this.getAIParams('classifier-domain-2-category', {
  domain: domain,
  markdown: markdown
}, env);

// PromptLayer managed:
// - Prompt versioning (A/B testing)
// - Model selection (switch without deploy)
// - Template variables
// - Cost tracking per prompt
```

**What Conductor needs (our own system):**
```yaml
# members/classifier/member.yaml
name: classify-domain
type: Think
config:
  provider: anthropic
  model: claude-3-sonnet
  promptId: classifier-domain-v2  # References prompt in prompts/
  variables:
    domain: ${input.domain}
    markdown: ${context.markdown}
```

```typescript
// prompts/classifier-domain-v2.yaml
id: classifier-domain-v2
version: 2.1.0
description: Classify domain as investor or company
template: |
  Analyze this domain: {{domain}}

  Content:
  {{markdown}}

  Classify as: investor or company
model: claude-3-sonnet
temperature: 0.3
max_tokens: 500
```

**Implementation needs:**
- Prompt storage (YAML files in prompts/ directory)
- Prompt versioning (semantic versioning in filename or frontmatter)
- Template variable substitution (Handlebars or similar)
- Prompt loading and caching
- Version pinning support (use v2.1.0 explicitly)
- A/B testing support (route 10% to v2.2.0, 90% to v2.1.0)
- Git-based prompt management (version control prompts separately from code)

**Why we're building our own:**
- Full control over versioning and deployment
- No external dependencies (PromptLayer costs, API limits)
- Git-native workflow (prompts version controlled with code)
- Edge-optimized (prompts cached in KV or bundled)
- Privacy (prompts stay in our infrastructure)

---

### 2. Confidence-Based Caching
**Location:** Cache system + member config
**Status:** ❌ Missing
**Priority:** 🟡 Medium - Quality improvement

**What it is:**
Conditional caching based on result quality. Only cache high-confidence results (≥0.81), forcing re-analysis for low-confidence outputs.

**What V2 had:**
```javascript
const CONFIG = {
  CACHE_MIN_CONFIDENCE: 0.81,
  CACHE_MAX_AGE: 90 * 24 * 60 * 60  // 90 days
};

// Only cache if confidence is high enough
if (result.confidence >= CONFIG.CACHE_MIN_CONFIDENCE) {
  await cache.set(key, result, {ttl: CONFIG.CACHE_MAX_AGE});
}
```

**What Conductor needs:**
```yaml
# members/classifier/member.yaml
name: classify
type: Think
cache:
  enabled: true
  ttl: 7776000  # 90 days
  conditions:
    - field: confidence
      operator: gte
      value: 0.81
```

```typescript
// In Executor/Cache integration
if (shouldCacheResult(result, memberConfig.cache.conditions)) {
  await cache.set(key, result, {ttl: memberConfig.cache.ttl});
}
```

**Why important:**
- Quality control (don't perpetuate low-confidence answers)
- Self-correcting (low-confidence results get re-analyzed)
- Cost optimization (cache stable, confident results long-term)

---

### 3. Per-Tier Caching (for Scrape)
**Location:** ScrapeMember + Cache system
**Status:** ❌ Missing
**Priority:** 🔴 Critical - For scrape member

**What it is:**
Each fallback tier gets separate cache entry. Tier 1 success doesn't prevent Tier 2 from being tried later (if Tier 1 fails for different input).

**What V2 had:**
```javascript
// Cache keys include tier/strategy info
createCustomCacheKey(url, cfOptions) {
  const optionsHash = this.hashCFOptions(cfOptions); // Includes waitUntil
  return `${CONFIG.CACHE_VERSION}:${urlB64}:${optionsHash}`;
}

// Tier 1 (domcontentloaded) and Tier 2 (networkidle2) have different keys
```

**What Conductor needs:**
```typescript
// ScrapeMember generates different cache keys per tier
class ScrapeMember {
  private getCacheKey(url: string, tier: number) {
    return `scrape:v1:${hash(url)}:tier${tier}`;
  }

  // Tier 1 cache key: scrape:v1:hash123:tier1
  // Tier 2 cache key: scrape:v1:hash123:tier2
  // Tier 3 cache key: scrape:v1:hash123:tier3
}
```

---

### 4. Request Tracing & Execution IDs
**Location:** Executor + ExecutionContext
**Status:** 🟡 Partially exists (context has some IDs)
**Priority:** 🟡 Medium - Observability

**What it is:**
Unique IDs for every workflow execution and member execution. Enables debugging across distributed systems, logging, and observability.

**What V2 had:**
```javascript
// Every response included request tracing
{
  success: true,
  data: result,
  requestId: 'req_abc123',  // Unique per request
  cached: false,
  executionTime: 1250
}
```

**What Conductor needs:**
```typescript
// ExecutionContext includes tracing
interface ExecutionContext {
  workflowId: string;       // Unique per ensemble execution
  executionId: string;      // Unique per member execution
  parentWorkflowId?: string; // For nested ensembles
  traceId: string;          // OpenTelemetry trace ID
  timestamp: string;
}

// All MemberResponse objects include IDs
interface MemberResponse {
  result: any;
  metadata: {
    workflowId: string;
    executionId: string;
    memberName: string;
    cached: boolean;
    executionTime: number;
  };
}
```

---

## Category 4: Not Gaps - User-Built Members

These are NOT gaps in Conductor. These are custom members that users will build in their own projects using Conductor's SDK. Conductor provides the foundation (Think, Function, Data types), users build domain-specific logic.

### Not a Gap: Domain Classifiers
**Examples:** `domain-2-type`, `domain-2-category`, `domain-2-industry`

These are custom Think members that users build. Conductor provides:
- Think member type (AI provider integration)
- Prompt versioning system
- Caching with normalization

Users write their own:
```yaml
# members/domain-classifier/member.yaml (in user's project)
name: domain-classifier
type: Think
config:
  promptId: classify-domain
  provider: anthropic
  model: claude-3-sonnet
```

### Not a Gap: Business Logic Transformers
**Examples:** `company-2-domain`, `domain-2-company`, `domain-2-sitemap`

These are custom Function or Data members that users build using Conductor's SDK.

### Not a Gap: Custom Generators
**Examples:** `domain-2-profile`, `domain-2-product-summary`

These are ensembles (workflows) that users define, not built-in members. The orchestration is what Conductor provides, not the specific business logic.

---

## Implementation Roadmap

### Phase 1: Critical Blockers (Q1 - Weeks 1-4)
**Goal:** Enable V2 agent migration

1. ✅ **Scrape Member** (Week 1-2)
   - ScrapeMember class with 3-tier fallback
   - Cloudflare Browser Rendering API integration
   - Bot protection detection
   - Per-tier caching
   - Resource/pattern blocking

2. ✅ **Validate Member** (Week 1)
   - Rule-based validation
   - Bot protection keyword detection
   - Success criteria evaluation

3. ✅ **Normalization Utilities** (Week 2)
   - URL, domain, company normalizers
   - BaseMember helper methods
   - Integration with cache key generation

4. ✅ **Prompt Versioning System** (Week 3-4)
   - Prompt storage (YAML files)
   - Template variable substitution
   - Version pinning
   - PromptManager class
   - Think member integration

### Phase 2: Essential Utilities (Q1 - Weeks 5-6)
**Goal:** Full V2 feature parity

5. ✅ **URL Resolution** (Week 5)
   - URLResolver with www fallback
   - Redirect following
   - BaseMember helper

6. ✅ **Response Metadata** (Week 5)
   - Standardized metadata generation
   - Execution IDs and tracing
   - Verbose vs minimal modes

7. ✅ **Fetch Member** (Week 6)
   - HTTP client with retry
   - Timeout handling
   - Response transformation

### Phase 3: Advanced Features (Q2 - Weeks 7-10)
**Goal:** Production optimization

8. ✅ **Confidence-Based Caching** (Week 7)
   - Conditional cache storage
   - Quality gates

9. ✅ **Per-Tier Caching** (Week 8)
   - Tier-specific cache keys
   - Cache invalidation strategies

10. ✅ **Cost Tracking** (Week 9-10)
    - Per-step cost calculation
    - Aggregate cost reporting
    - Token usage tracking

### Phase 4: Polish (Q2 - Weeks 11-12)
**Goal:** Developer experience

11. ✅ **Educational Errors** (Week 11)
    - Helpful error messages
    - Debugging hints

12. ✅ **Documentation** (Week 12)
    - Built-in member docs
    - Migration guides
    - Example projects

---

## Migration Strategy: V2 → Conductor

**For each V2 agent, follow this process:**

### Step 1: Identify Agent Type
- **Resolver** (domain-2-company) → Function member
- **Transformer** (url-2-markdown) → Use built-in `scrape` member
- **Classifier** (domain-2-type) → Think member with custom prompt
- **Generator** (domain-2-profile) → Ensemble (workflow)

### Step 2: Convert to Conductor Member
```yaml
# Before (V2): JavaScript class
# After: member.yaml
name: domain-classifier
type: Think
config:
  promptId: classify-domain
  provider: anthropic
```

### Step 3: Extract Orchestration → Ensemble
```yaml
# Before (V2): Nested agent calls in code
# After: Ensemble flow
name: domain-profile
flow:
  - member: scrape  # Built-in
  - member: classify  # Custom
  - member: generate  # Custom
```

### Step 4: Update Caching
```yaml
# Use normalization
config:
  normalization:
    domain: domain  # Built-in normalizer
```

### Step 5: Test with Verbose Mode
```bash
conductor run domain-profile --input domain=tesla.com --verbose
# Verify metadata, tier progression, cache hits
```

---

## Summary

**Critical Built-In Members (ship with Conductor):**
1. ✅ **scrape** - 3-tier web scraping with bot protection
2. ✅ **validate** - Rule-based content validation
3. ✅ **fetch** - HTTP client with retry

**Critical Built-In Utilities (framework-level):**
4. ✅ **Normalization** - URL, domain, company normalizers
5. ✅ **URL Resolution** - www fallback, redirect following
6. ✅ **Response Metadata** - Standardized metadata generation

**Critical Framework Features:**
7. ✅ **Prompt Versioning** - Our own system (not PromptLayer)
8. ✅ **Confidence-Based Caching** - Quality-gated caching
9. ✅ **Per-Tier Caching** - Separate cache per fallback tier
10. ✅ **Request Tracing** - Execution IDs for debugging

**NOT Gaps (user builds these):**
- Domain classifiers (custom Think members)
- Business logic transformers (custom Function members)
- Custom generators (ensembles/workflows)

---

## Code Patterns to Preserve from V2

✅ **Semantic Configuration**
```typescript
const CONFIG = {
  CACHE_VERSION: 'v2',
  CACHE_MAX_AGE: 90 * 24 * 60 * 60,
  BOT_PROTECTION_THRESHOLD: 800
};
```

✅ **Tier Progression Tracking**
```typescript
tierDetails.push({
  tier: 1,
  method: 'cf_domcontentloaded',
  success: false,
  error: 'insufficient content (245 chars)'
});
```

✅ **Unified Success Criteria**
```typescript
isSuccessfulResult(content) {
  return content.length >= 800 && !this.detectBotProtection(content);
}
```

✅ **Transparent Fallback**
```typescript
// Try tier 1 → tier 2 → tier 3
// Return best available result
// Caller doesn't need to know which tier succeeded
```

✅ **Resource Blocking for Performance**
```typescript
rejectResourceTypes: ['image', 'font', 'stylesheet'],
rejectRequestPattern: [
  '/googletagmanager\\.com/',
  '/google-analytics\\.com/'
]
```

---

**Built to guide V2 → Conductor migration with batteries-included philosophy**
