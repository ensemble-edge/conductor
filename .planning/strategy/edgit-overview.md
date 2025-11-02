# Ensemble Edge: Product Overview

## The Vision

Ensemble Edge revolutionizes how AI teams build, version, and deploy complex systems by solving two fundamental problems:

1. **Component Versioning** - How do you independently version 50-200+ AI components (prompts, agents, queries) when they all live in the same repository?
2. **Edge Orchestration** - How do you coordinate these versioned components into sophisticated workflows that execute at global scale with sub-50ms latency?

**Solution:** Edgit + Conductor = Component-level version control meets edge-native orchestration.

---

## Edgit: Git-Native Component Versioning

### The Problem

Modern AI systems contain hundreds of independently evolving components:
- 20+ prompt templates
- 15+ AI agents
- 50+ SQL queries
- 30+ configuration files

Traditional monorepos force all components to share a single version number. When you deploy v2.0.0, everything becomes v2.0.0, even if:
- The v1.0.0 prompt was perfect and the new one breaks production
- That ancient v0.1.0 SQL query actually runs faster
- Components should evolve at different rates

**Result:** Lost access to optimal component versions trapped in Git history.

### How Edgit Works

Edgit transforms Git into a "multiverse" of component versions by leveraging Git's native tagging system:

```bash
# Every component gets independent versioning
edgit tag create extraction-prompt v1.0.0
edgit tag create company-agent v2.1.0
edgit tag create validation-sql v0.5.0

# Creates Git tags:
components/extraction-prompt/v1.0.0
components/company-agent/v2.1.0
components/validation-sql/v0.5.0
```

**Key Innovation:** All version data lives in Git tags (not JSON files), eliminating merge conflicts and preserving immutable history.

### Component Types

Edgit auto-detects components by file patterns:

| Type | Pattern | Example |
|------|---------|---------|
| **Prompts** | `prompts/**`, `instructions/**` | `prompts/extraction.md` → `extraction-prompt` |
| **Agents** | `agents/**`, `scripts/**/*.{js,ts,py}` | `agents/extractor.js` → `company-agent` |
| **SQL** | `queries/**`, `**/*.sql` | `queries/company.sql` → `company-sql` |
| **Configs** | `configs/**`, `**/*.{yaml,json}` | `configs/model.json` → `model-config` |

### Deployment Management

Edgit provides **mutable deployment tags** that can point to any version:

```bash
# Deploy v1.0.0 to production
edgit deploy set extraction-prompt v1.0.0 --to prod
# Creates: components/extraction-prompt/prod → v1.0.0

# Test v2.0.0 in staging
edgit deploy set extraction-prompt v2.0.0 --to staging

# Instant rollback (just move the tag)
edgit deploy set extraction-prompt v1.0.0 --to prod

# Promote staging to production
edgit deploy promote extraction-prompt --from staging --to prod
```

### The "Multiverse" in Action

```javascript
// Traditional: All components locked to one version
deployment = {
  version: "v2.0.0",
  allComponents: "v2.0.0"  // No flexibility
}

// With Edgit: Mix optimal versions from any timeline
deployment = {
  prompt: "v0.1.0",        // Ancient but perfect
  agent: "v3.0.0",         // Latest and greatest
  validator: "v1.0.0",     // Stable version
  sql: "v2.5.0",           // Optimal performance
  config: "v1.0.0"         // Locked, don't touch
}
```

### Key Features

- **Component Independence** - Each component versions independently
- **Zero Merge Conflicts** - Version data lives in Git tags, not tracked files
- **Immutable History** - Every version ever created is preserved forever
- **Atomic Deployments** - Move deployment tags instantly (< 50ms)
- **AI-Powered Commits** - Automatic semantic versioning with OpenAI
- **Smart Detection** - Auto-discovers components with collision prevention
- **Zero Infrastructure** - Works with just Git and Edgit CLI

### Typical Workflow

```bash
# 1. Make changes to a component
echo "improved logic" >> prompts/extraction.md

# 2. AI-powered commit
edgit commit
# → "feat(extraction-prompt): improve extraction accuracy"

# 3. Create immutable version tag
edgit tag create extraction-prompt v2.4.0

# 4. Deploy to staging
edgit deploy set extraction-prompt v2.4.0 --to staging

# 5. Test, then promote to production
edgit deploy promote extraction-prompt --from staging --to prod

# 6. If issues: instant rollback
edgit deploy set extraction-prompt v2.3.0 --to prod
```

---

## Conductor: Edge-Native Orchestration

### The Problem

Coordinating multiple AI agents and components into sophisticated workflows is complex:
- Managing execution flow across distributed systems
- Sharing state between workflow steps without "prop drilling"
- Ensuring output quality with confidence scoring
- Handling webhooks and event-driven automation
- Deploying globally with low latency

**Traditional solutions:** Centralized orchestrators with high latency and complex state management.

### How Conductor Works

Conductor is a **Cloudflare Workers-based orchestration engine** that executes AI workflows at the edge (200+ global locations) using a musical metaphor:

- **Members** = Musicians (each plays one role)
- **Ensembles** = Sheet Music (YAML workflow definitions)
- **Conductor** = The Orchestrator (runtime engine)
- **Models** = Instruments
- **Scorers** = Music Critics (evaluate quality)

### Architecture

Conductor runs on Cloudflare Workers and orchestrates different member types:

| Member Type | Purpose | Example |
|-------------|---------|---------|
| **Think** | AI reasoning with LLMs | GPT-4, Claude analysis |
| **Data** | Database operations | Read/write to KV, D1, R2 |
| **MCP** | Model Context Protocol tools | File system, database access |
| **Function** | Custom JavaScript/TypeScript | Data transformation |
| **API** | HTTP endpoint calls | External service integration |
| **Scoring** | Quality validation | Confidence threshold checks |
| **Webhook** | Event-driven triggers | GitHub, Stripe events |
| **Loop/Parallel** | Control flow | Iteration, fan-out tasks |

### YAML-Driven Workflows

Ensembles are defined declaratively in YAML:

```yaml
name: company-intelligence
description: Analyze a company comprehensively

state:
  schema:
    companyData: object
    financialAnalysis: object
    competitorList: array

flow:
  # Step 1: Fetch company data
  - member: fetch-company-data
    state:
      set: [companyData]
    input:
      domain: ${input.domain}
    cache:
      ttl: 3600  # Cache for 1 hour

  # Steps 2 & 3: Run in parallel
  - parallel:
    - member: analyze-financials
      state:
        use: [companyData]
        set: [financialAnalysis]

    - member: fetch-competitors
      state:
        use: [companyData]
        set: [competitorList]

  # Step 4: Generate report with quality check
  - member: generate-report
    state:
      use: [companyData, financialAnalysis, competitorList]
    scoring:
      evaluator: grade-report
      thresholds:
        minimum: 0.7      # Fail if below
        target: 0.9       # Ideal quality
      onFailure: retry
      retryLimit: 3
```

### State Management

**Problem:** Data "prop drilling" - passing data through intermediate steps that don't need it.

**Solution:** Central state with selective access:

```yaml
state:
  schema:
    companyData: object
    financialAnalysis: object

flow:
  - member: fetch-company
    state:
      set: [companyData]  # Only this writes

  - member: intermediate-step
    # Doesn't need company data, doesn't see it

  - member: final-report
    state:
      use: [companyData, financialAnalysis]
    # Direct access without prop drilling!
```

**Benefits:**
- No prop drilling through intermediate steps
- Type-safe with Zod validation
- Privacy/isolation (members only see declared state)
- Access pattern tracking for optimization

### Quality Control with Scoring

Conductor includes built-in quality validation:

```yaml
- member: generate-summary
  scoring:
    evaluator: grade-summary
    thresholds:
      minimum: 0.7      # Below = failure
      target: 0.9       # Ideal quality
      excellent: 0.95   # Exceptional
    onFailure: retry
    retryLimit: 3
    backoff: exponential
```

**Features:**
- Confidence scoring (0-1 scale)
- Multi-criteria evaluation (accuracy, completeness, clarity)
- Automatic retry with backoff strategies
- Progressive improvement loops
- Comparative scoring across models

### Key Features

- **Edge-First Architecture** - Runs on Cloudflare's 200+ global locations
- **Sub-50ms Latency** - Execute workflows at the edge near users
- **Multi-Layer Caching** - Member-level caching with TTL
- **State Management** - Solves prop drilling elegantly
- **Scoring & Quality Control** - Built-in confidence thresholds
- **Webhook Integration** - Event-driven workflows
- **MCP Support** - First-class Model Context Protocol
- **Observable by Default** - All metrics/events structured
- **YAML-Driven** - Declarative, version-controlled workflows
- **Git-Native** - All configurations live in Git

### Deployment

Conductor deploys to Cloudflare Workers:

```bash
# Deploy via Wrangler CLI
npm install
npx wrangler deploy

# Or via GitHub Actions (automatic)
git push
# → CI builds and deploys to Cloudflare edge
```

**API Endpoints:**
```
POST /conductor/ensemble/:name           # Execute ensemble
POST /conductor/member/:name             # Execute member
POST /conductor/webhooks/:name           # Receive webhook
GET  /conductor/scores/:ensemble         # Get quality metrics
GET  /conductor/health                   # Health check
```

---

## How Edgit + Conductor Work Together

### Two-Phase Architecture

#### Phase 1: Local Multiverse (Git + Edgit)

Without any infrastructure, teams get component-level versioning:

```bash
# Developer workflow
edgit commit                    # AI-powered semantic commits
edgit tag create my-prompt v1.3 # Version components
edgit deploy set my-prompt v1.3 --to staging
git push                        # Share with team
```

**Benefits:**
- Component independence from repo versioning
- Easy rollback to any historical version
- Test optimal version combinations locally
- Zero infrastructure cost

#### Phase 2: Edge Deployment (Git + Edgit + Conductor + Cloudflare)

GitHub Actions automatically:
1. Builds Conductor Workers with all component versions
2. Deploys versioned components to Cloudflare KV
3. Enables instant global version switching
4. Supports A/B testing across version combinations

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }  # Full Git history

      - name: Install Edgit
        run: npm install -g @ensemble-edge/edgit

      - name: Build multiverse
        run: edgit build --target cloudflare
        # Bundles all component versions

      - name: Deploy to edge
        run: edgit deploy --to cloudflare
        # Deploys to Cloudflare KV + Workers
```

### Versioned Components in Conductor Ensembles

Conductor accesses versioned components from Cloudflare KV:

```yaml
# ensembles/optimal-pipeline.yaml
name: optimal-pipeline
description: Mix optimal versions from different timelines

flow:
  # Can use ANY version combination
  - component: extractor@v3.0.0        # Latest agent
  - component: extraction-prompt@v0.1.0 # Original perfect prompt
  - component: validator@v1.0.0         # Stable validator
  - component: company-query@v2.5.0     # Optimal SQL
```

**At Runtime:**
```javascript
// Conductor fetches from KV storage
const prompt = await KV.get('components/extraction-prompt/v0.1.0')
const agent = await KV.get('components/extractor/v3.0.0')
const validator = await KV.get('components/validator/v1.0.0')

// Executes with optimal combination
await conductor.execute({ prompt, agent, validator })
```

### Dynamic Version Selection

```yaml
# Production configuration
deployment:
  prod:
    extraction-prompt: v0.1.0    # Ancient but perfect
    company-agent: v3.0.0        # Latest stable
    validator: v1.0.0            # Proven version
    company-query: v2.5.0        # Optimized SQL
    model-config: v1.0.0         # Locked

  staging:
    extraction-prompt: v2.0.0    # Testing new version
    company-agent: v3.1.0-beta   # Canary testing
    validator: v1.0.0            # Keep stable
    company-query: v2.5.0        # Keep optimal
    model-config: v1.0.0         # Never change

  canary:
    extraction-prompt: v2.1.0    # Experimental
    # 10% traffic to test new version
```

### Integration Benefits

1. **Component Independence at Scale**
   - 20+ prompts version independently
   - 15+ agents evolve at different speeds
   - 50+ SQL queries with full history
   - Mix optimally across all timelines

2. **Instant Rollback**
   ```bash
   # Something breaks in production
   edgit deploy set extraction-prompt v0.1.0 --to prod
   git push --tags --force
   # Rollback completes in < 50ms globally
   ```

3. **A/B Testing at Edge**
   ```yaml
   # Different versions in different regions
   us-east: extraction-prompt@v2.0.0
   eu-west: extraction-prompt@v1.0.0
   asia: extraction-prompt@v2.1.0-beta
   ```

4. **Zero-Downtime Deployment**
   - Change KV pointers atomically
   - No service restarts required
   - Instant propagation to 200+ locations

5. **Quality Control**
   ```yaml
   - component: extractor@v3.0.0
     scoring:
       thresholds:
         minimum: 0.8
       onFailure: rollback
       fallback: extractor@v2.0.0  # Automatic fallback
   ```

---

## The Ensemble Vision

### "Everything Everywhere All at Once"

Traditional monorepos lock all components to a single version. Ensemble unleashes the multiverse:

```javascript
// Traditional deployment
const system = {
  version: "v2.0.0",
  components: "v2.0.0"  // All forced to same version
}

// Ensemble deployment
const system = {
  extractor: "v3.0.0",      // Latest features
  prompt: "v0.1.0",         // Ancient but perfect
  validator: "v1.0.0",      // Proven stable
  query: "v2.5.0",          // Optimal performance
  config: "v-hotdog"        // That weird version that works best
}

// Possible combinations: 10^100+
// Test and deploy ANY combination globally
```

### The Metaphor

- **Git history** = Hidden multiverse (every version exists but trapped)
- **Edgit** = Portal opener (makes multiverse visible and navigable)
- **Conductor** = Orchestrator (coordinates across multiverse at edge scale)
- **Ensemble Cloud** = Observatory (manage and observe everything)

### Core Philosophy

1. **Component Independence** - Each component evolves at its own pace
2. **Version Combinations** - Test and deploy any combination
3. **Edge-Native Execution** - Run workflows at Cloudflare's edge
4. **Git as Truth** - All configuration and versioning in Git
5. **Observable by Default** - Structured metrics and telemetry
6. **Zero Infrastructure** - Works with Git → scales to global edge

---

## Getting Started

### Install Edgit

```bash
npm install -g @ensemble-edge/edgit
cd your-repo
edgit init
```

### Version Your First Component

```bash
# Edgit auto-detects components
edgit components
# → extraction-prompt (prompts/extraction.md)
# → company-agent (agents/extractor.js)

# Create versions
edgit tag create extraction-prompt v1.0.0
edgit tag create company-agent v1.0.0

# Deploy to staging
edgit deploy set extraction-prompt v1.0.0 --to staging
```

### Create Your First Ensemble

```yaml
# ensembles/hello.yaml
name: hello-world
description: My first ensemble

flow:
  - member: greet
    input:
      message: "Hello from Conductor!"
```

### Deploy to Cloudflare

```bash
cd conductor/
npm install
npx wrangler deploy
```

### Execute Your Ensemble

```bash
curl -X POST https://your-worker.workers.dev/conductor/ensemble/hello-world \
  -H "Content-Type: application/json" \
  -d '{"input": {}}'
```

---

## Use Cases

### AI Agent Orchestration
Coordinate multiple AI agents for complex tasks with state management and quality control.

### Content Generation Pipeline
Multi-stage content creation with scoring, validation, and automatic retry.

### Company Intelligence
Research companies using multiple data sources, parallel execution, and result merging.

### Event-Driven Automation
Webhook-triggered workflows for GitHub, Stripe, Shopify, and custom integrations.

### Data ETL Pipelines
Extract, transform, and load data with versioned SQL queries and validation.

### Research Assistants
Multi-tool AI workflows with memory, state persistence, and iterative refinement.

---

## Technology Stack

### Edgit
- **Runtime**: Node.js (TypeScript)
- **Version Control**: Git native tags
- **AI Integration**: OpenAI for commit messages
- **Package**: npm (`@ensemble-edge/edgit`)
- **License**: MIT

### Conductor
- **Runtime**: Cloudflare Workers (TypeScript/JavaScript)
- **Configuration**: YAML (Git-versioned)
- **Validation**: Zod (type-safe schemas)
- **Testing**: Vitest
- **Storage**: Cloudflare KV, R2, D1, Durable Objects
- **Analytics**: Cloudflare Analytics Engine
- **Auth**: Unkey, Cloudflare Access

---

## Current Status

**Edgit**: Version 0.1.8 (actively developed)
- Component versioning ✅
- Deployment management ✅
- AI-powered commits ✅
- Smart detection ✅

**Conductor**: Version 0.0.1 (early stage)
- Architecture designed ✅
- Core runtime in progress 🚧
- State management implementing 🚧
- Scoring system planned 📋
- MCP integration planned 📋

---

## Why This Matters

Traditional AI systems force all components to evolve together, losing access to optimal versions trapped in Git history. Ensemble Edge solves this by:

1. **Making Git history navigable** with component-level versioning (Edgit)
2. **Orchestrating across the multiverse** at global edge scale (Conductor)
3. **Enabling teams to mix optimal versions** from any timeline
4. **Deploying instantly** with atomic version switching
5. **Maintaining quality** with built-in scoring and validation

**Result:** Teams can build, version, test, and deploy AI systems with unprecedented flexibility, speed, and confidence.

---

*Ensemble Edge: Where component versioning meets edge orchestration.*
