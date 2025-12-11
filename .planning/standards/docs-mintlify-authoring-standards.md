# Documentation Update Standards

## Overview

This document defines the standards for maintaining and updating documentation across all Ensemble products. All documentation lives in the `ensemble-edge/docs` repository and is built with **Mintlify**, a modern documentation platform.

**Documentation Site**: [docs.ensemble.ai](https://docs.ensemble.ai) (coming soon)

## Technology Stack

- **Platform**: Mintlify ([mintlify.com](https://mintlify.com))
- **Format**: MDX (Markdown + JSX components)
- **Configuration**: `docs.json` for navigation and settings
- **Deployment**: Cloudflare Pages
- **Preview**: `mintlify dev` (via Mintlify CLI)

## Repository Structure

```
ensemble-edge/docs/
├── docs.json                  # Mintlify configuration & navigation
├── index.mdx                  # Landing page
├── getting-started/           # Quick start guides
│   ├── index.mdx
│   ├── edgit.mdx
│   └── conductor.mdx
├── edgit/                     # Edgit documentation
│   ├── overview.mdx
│   ├── installation.mdx
│   ├── configuration.mdx
│   ├── api-reference/
│   ├── guides/
│   └── examples/
├── conductor/                 # Conductor documentation
│   ├── overview.mdx
│   ├── architecture.mdx
│   ├── agents/
│   ├── workflows/
│   └── deployment/
├── shared/                    # Cross-product patterns
├── api/                       # API documentation
└── ai-tools/                  # AI tooling integration
```

## Documentation Standards

### 1. File Naming

- Use lowercase with hyphens: `api-reference.mdx`
- Always use `.mdx` extension (required by Mintlify)
- Use `index.mdx` for category landing pages
- Be descriptive: `error-handling.mdx`, not `errors.mdx`

### 2. Document Structure

Every MDX file must have YAML frontmatter and follow this structure:

```mdx
---
title: "Feature Name"
description: "Brief one-line description for SEO"
---

> **Product**: Edgit | Conductor | Ensemble
> **Version**: v1.0.0
> **Last Updated**: 2025-11-01

## Overview
[Brief description]

## Prerequisites
- Required knowledge
- Required tools

## Main Content

## Examples

## Related Documentation
<CardGroup cols={2}>
  <Card title="Topic 1" href="/path" icon="icon-name">
    Description
  </Card>
</CardGroup>
```

### 3. Code Examples

Use Mintlify code blocks with filename attribute:

```mdx
\`\`\`typescript filename="example.ts"
import { Edgit } from '@ensemble/edgit';

const edgit = new Edgit();
\`\`\`
```

For multiple languages, use CodeGroup:

```mdx
<CodeGroup>
  \`\`\`bash npm
  npm install @ensemble/edgit
  \`\`\`
  \`\`\`bash yarn
  yarn add @ensemble/edgit
  \`\`\`
</CodeGroup>
```

### 4. Mintlify Components

**Callouts**:
```mdx
<Info>General information (blue)</Info>
<Warning>Important warnings (yellow)</Warning>
<Tip>Helpful tips (green)</Tip>
<Note>Additional context (gray)</Note>
```

**Cards**:
```mdx
<CardGroup cols={2}>
  <Card title="Title" icon="rocket" href="/path">
    Description
  </Card>
</CardGroup>
```

**Accordions**:
```mdx
<AccordionGroup>
  <Accordion title="Question">
    Answer
  </Accordion>
</AccordionGroup>
```

**Steps**:
```mdx
<Steps>
  <Step title="First">
    Content
  </Step>
  <Step title="Second">
    Content
  </Step>
</Steps>
```

**Tabs**:
```mdx
<Tabs>
  <Tab title="Option 1">
    Content
  </Tab>
  <Tab title="Option 2">
    Content
  </Tab>
</Tabs>
```

**API Parameters**:
```mdx
<ParamField path="apiKey" type="string" required>
  Your API key
</ParamField>

<ResponseField name="status" type="string">
  Response status
</ResponseField>
```

### 5. Navigation Configuration

Update `docs.json` for all new pages:

```json
{
  "navigation": {
    "tabs": [
      {
        "tab": "Tab Name",
        "groups": [
          {
            "group": "Group Name",
            "pages": [
              "path/to/page"
            ]
          }
        ]
      }
    ]
  }
}
```

## Update Workflow

```bash
# 1. Clone repository
git clone git@github.com:ensemble-edge/docs.git
cd docs

# 2. Install Mintlify CLI
npm install -g mintlify

# 3. Create feature branch
git checkout -b docs/product-feature

# 4. Make changes (use .mdx extension!)

# 5. Preview locally
mintlify dev
# Opens http://localhost:3000

# 6. Validate links
mintlify broken-links

# 7. Commit and push
git commit -m "docs(product): description"
git push origin docs/product-feature
```

## Deployment

Documentation is automatically deployed via Cloudflare Pages:

1. Push to `main` branch triggers deployment
2. Cloudflare Pages builds with Mintlify
3. Deploys to docs.ensemble.ai
4. Preview URLs for pull requests

## Review Checklist

Before merging:

- [ ] YAML frontmatter with title and description
- [ ] All links work (tested with `mintlify broken-links`)
- [ ] Code examples are complete and runnable
- [ ] Mintlify components used appropriately
- [ ] Added to `docs.json` navigation if new page
- [ ] Previewed with `mintlify dev`
- [ ] Follows tone and style guidelines

## Writing Guidelines

- **Professional but approachable**: Write as a knowledgeable colleague
- **Action-oriented**: Use imperative mood for instructions
- **Concise**: Get to the point quickly
- **Scannable**: Use headers, lists, and emphasis

**Good vs Bad**:
```
✅ GOOD: "Configure the API endpoint by setting ENSEMBLE_API_URL."
❌ BAD: "You might want to think about possibly configuring..."

✅ GOOD: "This error occurs when rate limit is exceeded. Wait 60 seconds."
❌ BAD: "Sometimes things don't work because of reasons..."
```

## Mintlify CLI Commands

```bash
# Start local preview
mintlify dev

# Check for broken links
mintlify broken-links

# Install Mintlify in project
mintlify install

# Update Mintlify
npm update mintlify
```

## Getting Help

- **GitHub Issues**: [ensemble-edge/edgit/issues](https://github.com/ensemble-edge/edgit/issues) (label: `documentation`)
- **Mintlify Docs**: [mintlify.com/docs](https://mintlify.com/docs)
- **GitHub Discussions**: [ensemble-edge/edgit/discussions](https://github.com/ensemble-edge/edgit/discussions)

---

## Common Mintlify Errors to Avoid

This section documents MDX parsing errors we've encountered. Update this list as new issues are discovered.

### 1. Angle Brackets in Text (`<` and `>`)

**Error:**
```
Unexpected character `5` (U+0035) before name, expected a character that can start a name
```

**Cause:** Using `<` or `>` in text (not JSX) is interpreted as the start of a JSX tag.

```mdx
❌ BAD — Causes parse error:
If the value is <5, return early.
Use the --timeout flag for requests >30s.

✅ GOOD — Escape or use alternatives:
If the value is less than 5, return early.
If the value is &lt;5, return early.
Use the `--timeout` flag for requests greater than 30s.
```

**Fix:** Use words ("less than", "greater than") or HTML entities (`&lt;`, `&gt;`).

---

### 2. Curly Braces in Code Blocks

**Error:**
```
Could not parse expression with acorn
```

**Cause:** MDX interprets `{` and `}` as JSX expressions, even in code blocks sometimes.

```mdx
❌ BAD — Can cause issues in certain contexts:
The object looks like {foo: "bar"}

✅ GOOD — Use code formatting:
The object looks like `{foo: "bar"}`
```

---

### 3. HTML Comments

**Error:**
```
Unexpected token
```

**Cause:** HTML comments (`<!-- -->`) are not valid in MDX.

```mdx
❌ BAD — HTML comments break MDX:
<!-- This is a comment -->

✅ GOOD — Use JSX comments:
{/* This is a comment */}
```

---

### 4. Unescaped Special Characters in JSX

**Error:**
```
Unexpected token, expected "jsxTagEnd"
```

**Cause:** Special characters inside JSX components need escaping.

```mdx
❌ BAD:
<Note>Use the & operator for bitwise AND</Note>

✅ GOOD:
<Note>Use the `&` operator for bitwise AND</Note>
<Note>Use the &amp; operator for bitwise AND</Note>
```

---

### 5. Markdown Inside JSX Components

**Error:** Content not rendering correctly or parse errors.

**Cause:** Markdown syntax doesn't always work inside JSX components.

```mdx
❌ BAD — Markdown may not render:
<Note>
  Use **bold** and `code` here.
</Note>

✅ GOOD — Keep it simple or use HTML:
<Note>
  Use <strong>bold</strong> and <code>code</code> here.
</Note>

✅ ALSO GOOD — Simple text works fine:
<Note>
  This is a simple note without formatting.
</Note>
```

---

### 6. Unclosed JSX Tags

**Error:**
```
Expected corresponding JSX closing tag
```

**Cause:** Self-closing tags missing the `/` or unclosed tags.

```mdx
❌ BAD:
<br>
<img src="image.png">

✅ GOOD:
<br />
<img src="image.png" />
```

---

### 7. Backticks in Frontmatter

**Error:**
```
YAMLException: bad indentation
```

**Cause:** Using backticks or special characters in frontmatter values.

```mdx
❌ BAD:
---
title: The `think` Operation
description: Use <think> for AI
---

✅ GOOD:
---
title: "The think Operation"
description: "Use think for AI"
---
```

---

### 8. Table Alignment Issues

**Error:** Tables not rendering or breaking the page.

**Cause:** Inconsistent column counts or missing separators.

```mdx
❌ BAD — Missing separator or inconsistent columns:
| Name | Type |
| foo | string | extra |

✅ GOOD:
| Name | Type | Description |
|------|------|-------------|
| foo | string | A foo value |
```

---

### Quick Reference: Characters to Watch

| Character | Problem | Solution |
|-----------|---------|----------|
| `<` | Interpreted as JSX tag | Use `&lt;` or "less than" |
| `>` | Interpreted as JSX tag | Use `&gt;` or "greater than" |
| `{` | Interpreted as expression | Wrap in backticks or escape |
| `}` | Interpreted as expression | Wrap in backticks or escape |
| `&` | Can cause issues in JSX | Use `&amp;` or backticks |
| `<!--` | Invalid in MDX | Use `{/* */}` |

---

### Debugging Tips

1. **Run `mintlify dev`** locally to catch errors before pushing
2. **Check line numbers** in error messages — they point to the problem
3. **Isolate the issue** by removing sections until it works
4. **Look for special characters** in the line mentioned in the error

---

## AI Context Blocks

Every MDX file should include a hidden AI context block at the **very top** of the file (before frontmatter). This grounds AI when updating or regenerating documentation.

### Format

```mdx
{/*
  @ai-context

  STANDARDS:
  - .planning/standards/docs-authoring-standards.md

  PAGE CONTEXT:
  - Purpose: [What this page teaches]
  - Audience: [Who reads this page]
  - Tone: [Specific tone for this page, if different from default]

  KEY POINTS:
  - [Must-cover topic 1]
  - [Must-cover topic 2]

  RELATED:
  - [Link to related page 1]
  - [Link to related page 2]

  DO NOT:
  - [Thing to avoid on this page]

  LAST REVIEWED: YYYY-MM-DD
*/}

---
title: "Page Title"
description: "Brief description"
---
```

### Required Fields

| Field | Description |
|-------|-------------|
| `STANDARDS` | List of standard files to reference (always include this file) |
| `Purpose` | One-line description of what this page teaches |
| `Audience` | Who reads this page (e.g., "New users", "Experienced developers") |

### Optional Fields

| Field | Description |
|-------|-------------|
| `Tone` | Specific tone if different from default (e.g., "Tutorial - step-by-step") |
| `KEY POINTS` | Bullet list of must-cover topics for completeness |
| `RELATED` | Related pages to cross-link |
| `DO NOT` | Things to avoid on this specific page |
| `LAST REVIEWED` | Date of last human review |

### Example: Operations Page

```mdx
{/*
  @ai-context

  STANDARDS:
  - .planning/standards/docs-authoring-standards.md

  PAGE CONTEXT:
  - Purpose: Document the think operation for calling LLMs
  - Audience: Developers building AI agents with Conductor
  - Tone: Technical but accessible, practical examples

  KEY POINTS:
  - All providers: openai, anthropic, cloudflare, groq
  - Structured outputs with schema
  - Temperature, maxTokens, systemPrompt settings
  - Provider-specific model recommendations

  RELATED:
  - /conductor/operations/code
  - /conductor/building/workers-ai-ml
  - /conductor/reference/ai-context

  DO NOT:
  - Recommend deprecated models
  - Show hardcoded API keys
  - Overcomplicate basic examples

  LAST REVIEWED: 2025-01-15
*/}

---
title: "think Operation"
description: "Call AI language models for reasoning and generation"
---
```

### Example: Getting Started Page

```mdx
{/*
  @ai-context

  STANDARDS:
  - .planning/standards/docs-authoring-standards.md

  PAGE CONTEXT:
  - Purpose: Onboard new users with their first working agent
  - Audience: First-time Conductor users, may be new to YAML
  - Tone: Encouraging, step-by-step, celebratory on success

  KEY POINTS:
  - Must be completable in under 10 minutes
  - Use the simplest possible agent
  - Explain each YAML field as introduced
  - Show how to test locally

  DO NOT:
  - Introduce advanced concepts
  - Assume prior Conductor knowledge
  - Skip validation steps

  LAST REVIEWED: 2025-01-10
*/}

---
title: "Your First Agent"
description: "Build and deploy your first Conductor agent in minutes"
---
```

### Why AI Context Matters

1. **Consistent AI Updates** — Every AI edit follows the same standards
2. **Page-Specific Guidance** — AI knows what to emphasize and avoid
3. **Easier Maintenance** — Context stays with the page, not in someone's head
4. **Quality Control** — Standards serve as a checklist for review

---

**Remember**: Great documentation is as important as great code.
