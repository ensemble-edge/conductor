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

**Remember**: Great documentation is as important as great code.
