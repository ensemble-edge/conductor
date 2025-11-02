# Nomenclature Strategy: Components vs Members

## TL;DR Decision

**Edgit uses "components"** - Versioned artifacts in Git
**Conductor uses "members"** - Runtime executors in workflows

These terms should **coexist** and remain distinct.

---

## The Question

Should we unify terminology and call Conductor's atomic units "components" to match Edgit, or keep them as "members"?

## The Answer: Keep "Members"

After careful consideration, **members** should remain the term for Conductor's atomic units. Here's why:

---

## 1. The Musical Metaphor is Our Differentiator

The musical metaphor is Conductor's *competitive narrative advantage*:

- **Members** = Musicians (each plays one instrument/role)
- **Ensembles** = Sheet music (YAML workflows)
- **Conductor** = The orchestrator (runtime engine)
- **Models** = Instruments (GPT-4, Claude, etc.)
- **Scorers** = Music critics (evaluate performance)

### What We Lose with "Components"

If we rename to "components":
- ❌ "Components are orchestrated by Conductor" (generic, forgettable)
- ❌ "Your component ensemble executes components" (confusing)
- ❌ Loses the entire performance/orchestra story
- ❌ Becomes "just another orchestration tool"

### What We Keep with "Members"

- ✅ "Members perform together in an ensemble"
- ✅ "The Conductor orchestrates members"
- ✅ "Each member plays their role perfectly"
- ✅ Memorable, unique positioning
- ✅ Story-driven adoption

**The metaphor makes complex orchestration immediately graspable. That's marketing gold.**

---

## 2. Semantically Different Concepts (Correctly Named)

This isn't just naming preference—these are **fundamentally different things**:

| Aspect | Edgit Components | Conductor Members |
|--------|-----------------|-------------------|
| **Nature** | Static artifacts | Runtime executors |
| **Location** | Git repository | Worker memory |
| **State** | Versioned, immutable | Instantiated, executing |
| **Lifecycle** | Created, tagged, deployed | Loaded, executed, cached |
| **Analogy** | Docker images | Docker containers |
| | Kubernetes ConfigMaps | Kubernetes Pods |
| | Source code | Running processes |

### The Distinction Helps Understanding

When users work with both:

> **Clear:** "Conductor members are instantiated from versioned Edgit components"

vs.

> **Confusing:** "Conductor components load from Edgit components" (which component?)

The name difference *teaches* users the transformation: **artifact → runtime**.

---

## 3. "Component" is Overloaded (Member is Specific)

### "Component" Means Everything
- React components
- Software components
- System components
- UI components
- Web components
- Component libraries
- Hardware components

**Result:** Generic, ambiguous, requires constant qualification.

### "Member" Means One Thing
In the orchestration context, "member" is:
- ✅ Specific to workflow orchestration
- ✅ Implies being part of a collective (ensemble)
- ✅ Unambiguous in our domain
- ✅ Self-documenting in code

**Example Code Clarity:**
```javascript
// Clear what this is
const member = new ThinkMember(config);
await ensemble.executeMember('analyzer');

// vs. ambiguous
const component = new ThinkComponent(config);
await ensemble.executeComponent('analyzer'); // Execute a React component?
```

---

## 4. Independent Adoption is Stronger with Distinct Names

### Separate Value Propositions

**Edgit (standalone):**
> "Version your AI components with surgical precision. Every prompt, agent, and query gets independent versioning in Git."

**Conductor (standalone):**
> "Orchestrate your AI members like a symphony. YAML-driven workflows that execute at the edge."

### Together (when appropriate):
> "Use Edgit to version your prompts and agents, then deploy them as Conductor members for edge orchestration."

### If Both Use "Components":
- ❌ Harder to explain the difference
- ❌ Weaker individual positioning
- ❌ Conductor loses memorable identity
- ❌ "Another tool that orchestrates components" (yawn)

---

## 5. The Learning Curve Argument Doesn't Hold

### The Concern
"Users need to learn two terms instead of one."

### The Reality
Users need to learn the **concepts** regardless of naming:
1. Versioned artifacts vs. runtime executors (core distinction)
2. How Git versioning works (Edgit)
3. How workflow orchestration works (Conductor)
4. How they integrate together

**Changing "members" to "components" doesn't reduce this cognitive load.** You still need to explain:
- "These components are files, these components run"
- "Component definitions vs. component executions"
- "Static components vs. active components"

### Better: Embrace the Distinction

The different names *help* understanding:
```yaml
# Clear relationship
edgit:
  components:
    - extraction-prompt@v1.0.0      # Git artifact
    - company-agent@v2.1.0          # Git artifact

conductor:
  ensemble: company-intelligence
  members:
    - type: Think                   # Runtime executor
      component: extraction-prompt@v1.0.0
    - type: Function                # Runtime executor
      component: company-agent@v2.1.0
```

Users immediately see: **components are versioned, members are executed**.

---

## 6. Industry Patterns Support This Distinction

Other successful platforms use distinct names for artifacts vs. runtime:

### Docker
- **Images** (versioned artifacts in registry)
- **Containers** (runtime instances)
- Nobody confuses them despite both being "Docker things"

### Kubernetes
- **ConfigMaps/Secrets** (configuration artifacts)
- **Pods** (runtime executors)
- **Deployments** (orchestration definitions)

### Terraform
- **Modules** (reusable configurations)
- **Resources** (runtime infrastructure)

### AWS Lambda
- **Function code** (versioned artifact in S3)
- **Function invocation** (runtime execution)

**Lesson:** Successful platforms distinguish artifact from runtime. Users learn it quickly because it's semantically correct.

---

## Documentation Strategy

### Teaching the Relationship

**Getting Started Guide:**
```markdown
## Understanding Ensemble Edge Concepts

### Edgit: Version Control for AI
- **Components**: Files you version in Git (prompts, agents, SQL queries)
- **Tags**: Immutable version markers (v1.0.0, v2.1.3)
- **Deployments**: Mutable pointers (prod, staging, canary)

### Conductor: Edge Orchestration
- **Members**: Runtime units that execute workflows (Think, Data, Function, API)
- **Ensembles**: YAML workflows that orchestrate members
- **State**: Shared context passed between members

### How They Work Together
Think of Edgit as your version-controlled sheet music library, and Conductor
members as the musicians performing those compositions. You version the
music (components), then assemble musicians (members) to perform it
(ensembles).
```

### API Documentation

Use clear prefixes to avoid confusion:

```javascript
// Edgit API - working with components
edgit.components.list()
edgit.components.tag('extraction-prompt', 'v1.0.0')
edgit.deploy.set('extraction-prompt', 'v1.0.0', 'prod')

// Conductor API - working with members
conductor.members.register('analyzer', ThinkMember)
conductor.ensembles.execute('company-intelligence')
```

### Visual Documentation

```
┌─────────────────────────────────────────────────────────────┐
│                     ENSEMBLE EDGE STACK                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  EDGIT (Version Control)                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Components (Git Artifacts)                          │   │
│  │  • extraction-prompt@v1.0.0                          │   │
│  │  • company-agent@v2.1.0                              │   │
│  │  • validation-sql@v0.5.0                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  CONDUCTOR (Edge Orchestration)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Members (Runtime Executors)                         │   │
│  │  • Think Member (uses extraction-prompt@v1.0.0)      │   │
│  │  • Function Member (runs company-agent@v2.1.0)       │   │
│  │  • Data Member (executes validation-sql@v0.5.0)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Ensembles (Workflows)                               │   │
│  │  Orchestrate members into business logic             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge Cases and Clarifications

### When Users Ask: "What's the difference?"

**Quick Answer:**
> Components are what you version, members are what you execute.

**Detailed Answer:**
> Edgit components are versioned files in Git—prompts, agent code, SQL queries.
> Conductor members are runtime executors that load those versioned components
> and execute them in workflows. It's like the difference between sheet music
> (components) and musicians (members) performing that music.

### When Implementing Both

If a user is building a complete system with both Edgit and Conductor:

```yaml
# edgit.yaml (versioning config)
components:
  - name: extraction-prompt
    type: prompt
    path: prompts/extraction.md

  - name: company-analyzer
    type: agent
    path: agents/analyzer.js

# conductor/members/analyzer/member.yaml (runtime config)
name: analyzer
type: Think
description: Analyze company data

config:
  # Reference to versioned component
  prompt_component: extraction-prompt@v1.0.0
  model: gpt-4

# conductor/ensembles/company-intel.yaml (orchestration)
name: company-intelligence
flow:
  - member: analyzer              # Member executes
    input:
      domain: ${input.domain}
```

**Clear hierarchy:** Components → Members → Ensembles

---

## Alternative Considered: "Member Components"

### The Compromise
Use **"member components"** in introductory documentation:

> "Conductor uses member components (Think, Data, Function, API) to execute workflows."

Then shorten to "members" after introduction.

### Verdict
**Not necessary.** The term "member" stands on its own and the metaphor is strong enough. Adding "component" weakens the metaphor and doesn't meaningfully improve clarity.

---

## Marketing & Positioning

### Edgit Positioning
> **"Git-native version control for AI components"**
>
> Finally, version your prompts, agents, and queries independently.
> Every component evolves at its own pace. Deploy any combination
> from any point in history.

### Conductor Positioning
> **"Edge-native orchestration for AI members"**
>
> Compose AI workflows like a symphony. Members perform together
> in YAML-defined ensembles, executing at the edge with
> sub-50ms latency.

### Together
> **"Ensemble Edge: Version and orchestrate AI at the edge"**
>
> Version your AI components with Edgit. Orchestrate them as
> Conductor members. Deploy globally with Cloudflare.

**The distinct terminology strengthens both products.**

---

## Technical Implementation Notes

### Code Consistency

**Edgit codebase uses:**
- `Component` class
- `components/` directories
- `component.yaml` files
- API endpoints: `/components/...`

**Conductor codebase uses:**
- `Member` class (base-member.js)
- `members/` directories
- `member.yaml` files
- API endpoints: `/conductor/member/:name`

### Cross-Project References

When Conductor loads from Edgit:

```javascript
// Clear distinction in code
class ThinkMember extends BaseMember {
  constructor(config) {
    super(config);
    // Load versioned component from Edgit
    this.promptComponent = config.prompt_component; // e.g., "extraction-prompt@v1.0.0"
  }

  async execute(input, context) {
    // Fetch component content from Edgit
    const prompt = await edgit.components.fetch(this.promptComponent);

    // Execute as member
    return await this.callAI(prompt, input);
  }
}
```

**Variable naming convention:**
- `component` - when referencing Edgit artifacts
- `member` - when referencing Conductor executors

---

## User Feedback Strategy

### Monitoring Confusion

Track in user feedback:
1. How often users confuse components vs. members
2. Where in onboarding they get stuck
3. What mental models they bring from other tools

### Iteration Plan

If users struggle after 6 months:
1. Review documentation clarity
2. Add more visual aids
3. Improve error messages
4. Enhance IDE autocomplete hints

**But don't change the core terminology.** Fix the teaching, not the names.

---

## Conclusion

### The Decision: KEEP MEMBERS

**Rationale:**
1. ✅ Musical metaphor is our differentiator
2. ✅ Semantically correct (artifact ≠ runtime)
3. ✅ "Member" is specific, "component" is overloaded
4. ✅ Stronger independent positioning
5. ✅ Learning curve doesn't actually improve with unification
6. ✅ Industry patterns support this distinction

### Managing the Learning Curve

Address with:
- Clear documentation explaining the relationship
- Visual diagrams showing the hierarchy
- Consistent API naming conventions
- Good error messages
- Helpful IDE tooling

### The Payoff

Users who understand the distinction become power users who:
- Version components with precision (Edgit)
- Orchestrate members with confidence (Conductor)
- Appreciate the semantic correctness
- Tell better stories about our platform

**The naming should be different because the concepts are different. Own it.**

---

## Quick Reference

### Glossary

**Edgit Terms:**
- **Component**: Versioned artifact in Git (prompt, agent, query, config)
- **Tag**: Immutable version marker (v1.0.0)
- **Deployment**: Mutable environment pointer (prod, staging)

**Conductor Terms:**
- **Member**: Runtime executor (Think, Data, Function, API)
- **Ensemble**: YAML workflow definition
- **State**: Shared context across member executions
- **Conductor**: The orchestration engine

**Relationship:**
- Members load Components
- Ensembles orchestrate Members
- Conductor executes Ensembles

### When to Use Each Term

**In Documentation:**
- "Version your components with Edgit"
- "Orchestrate your members with Conductor"
- "Members execute components within ensembles"

**In Code:**
- `edgit.components.tag(...)`
- `conductor.members.execute(...)`
- `ensemble.addMember(...)`

**In Marketing:**
- "AI components meet edge orchestration"
- "From versioned components to executing members"
- "Ensemble Edge: Components, Members, Ensembles"

---

**Document Status:** Approved Strategy
**Last Updated:** 2025-01-02
**Next Review:** After 1000 active users (feedback-driven)
