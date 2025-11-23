# Markdown Documentation

**Location**: `docs/` (conventional directory for documentation markdown files)

This directory contains **markdown documentation files** that serve as examples and templates for your project documentation.

**Note**: This is separate from `agents/generate-docs/` which auto-generates API documentation from your code.

---

## ✅ What Works Now (Out of the Box)

API documentation is **fully working** on first install at `/docs`:

```bash
npx conductor init my-project
cd my-project
npm run dev

# Auto-generated API documentation is live:
curl http://localhost:8787/docs
```

This auto-generates OpenAPI docs from your agents and ensembles via the `agents/generate-docs/` agents.

---

## 📚 Markdown Docs Directory

The `docs/` directory contains **markdown documentation as first-class components**:

- **getting-started.md** - Onboarding tutorial template
- **authentication.md** - Auth setup guide template
- **rate-limits.md** - Usage limits template
- **advanced-workflows.md** - Complex usage patterns template

### First-Class Component Support ✅

The `docs/` directory now works **exactly like `prompts/`** with:
- ✅ **Handlebars rendering** - Use {{variables}} for dynamic content
- ✅ **Auto-loading** - Files automatically discovered at build time
- ✅ **Component references** - Reference docs from generation agents
- ✅ **In-memory caching** - Fast access during runtime
- ✅ **YAML frontmatter** - Add metadata to your markdown files

**Usage in your code**:
```typescript
// Auto-discovered at build time via Vite plugin
import { DocsLoader } from './lib/docs-loader'

const loader = new DocsLoader()
await loader.init(docsMap)

// Get and render with variables
const content = await loader.get('getting-started', {
  projectName: 'My API',
  version: '1.0.0'
})
```

---

## Directory Structure

```
project/
├── prompts/           # File-based components (Handlebars rendering, auto-loading)
├── configs/           # File-based components (YAML/JSON, auto-loading)
├── queries/           # File-based components (SQL, auto-loading)
│
├── docs/              # Conventional location for markdown docs ← You are here!
│   ├── README.md      # (Static examples for now, component loading coming)
│   ├── getting-started.md
│   ├── authentication.md
│   ├── rate-limits.md
│   └── advanced-workflows.md
│
├── agents/
│   └── generate-docs/ # Auto-generates API docs from code
│       ├── docs-simple.yaml    # Serves at /docs
│       └── ...
│
└── templates/         # Component templates (email, html, pdf)
    ├── email/         # Email templates (Handlebars)
    ├── html/          # HTML templates (Handlebars)
    └── pdf/           # PDF templates (Handlebars)
```

**Key Distinction**:
- `docs/` = Conventional location for markdown documentation files (static examples)
- `agents/generate-docs/` = Agents that auto-generate API docs from your code
- `prompts/` = First-class components with Handlebars, auto-loading (active now)
- `templates/` = Content generation templates with Handlebars (email, HTML, PDF)

---

## 🎯 Current Status

**Now**:
- Auto-generated API docs work out of the box at `/docs` (via agents/generate-docs/)
- Markdown files in `docs/` directory are static examples to customize
- No automatic loading or Handlebars rendering (yet)

**Future**:
- File-based component loading for `docs/` (like prompts/)
- Handlebars rendering support
- Automatic integration with doc generation agents
- Hot reloading for markdown changes

---

## Customization

These are **example templates** - customize them for your project:

1. **Replace placeholders** - Update `{{PROJECT_NAME}}`, URLs, etc.
2. **Add your content** - Include your specific auth flows, examples, limits
3. **Match your brand** - Use your terminology and style
4. **Keep updated** - Maintain docs as your API evolves
5. **Serve via agents** - Reference these files from your doc generation agents

---

## What's Included

### getting-started.md
Quick start tutorial for new users. Customize with:
- Your onboarding flow
- First API call examples
- Common use cases

### authentication.md
Authentication setup guide. Customize with:
- Your auth methods (API keys, OAuth, JWT)
- Security best practices
- Token management

### rate-limits.md
API usage limits. Customize with:
- Your actual rate limits
- Throttling behavior
- How to handle rate limit errors

### advanced-workflows.md
Complex usage patterns. Customize with:
- Multi-step workflows
- Best practices
- Advanced features

---

## Best Practices

### ✅ Do

- **Customize for your project** - Replace placeholder text
- **Test all examples** - Ensure code samples work
- **Keep docs updated** - Match your API changes
- **Use real values** - Realistic examples help users
- **Version your docs** - Document breaking changes

### ❌ Don't

- **Don't leave unrendered placeholders** - Use Handlebars variables properly ({{projectName}})
- **Don't use fake data** - Use real (but safe) examples
- **Don't duplicate auto-generated docs** - Let `/docs` handle API reference (via agents/generate-docs/)
- **Don't forget to escape** - Use \\{{text\\}} if you need literal curly braces

---

## Comparison: docs/ vs prompts/ vs templates/

| Directory | Purpose | Current Features | Loading | Handlebars |
|-----------|---------|------------------|---------|------------|
| `prompts/` | Prompt templates | File-based components | Auto ✅ | Yes ✅ |
| `configs/` | Configuration | File-based components | Auto ✅ | No |
| `queries/` | Database queries | File-based components | Auto ✅ | No |
| `docs/` | Documentation | **First-class components** | Auto ✅ | Yes ✅ |
| `templates/email/` | Email templates | Content generation | Manual | Yes ✅ |
| `templates/html/` | HTML templates | Content generation | Manual | Yes ✅ |
| `templates/pdf/` | PDF templates | Content generation | Manual | Yes ✅ |

**docs/ is now a first-class component directory**, working exactly like `prompts/` with auto-loading and Handlebars rendering.

---

## Handlebars Examples

### Basic Variable Substitution

**Markdown file** (`docs/getting-started.md`):
```markdown
# Welcome to {{projectName}}

Version: {{version}}

Get started with {{projectName}} in just a few minutes.
```

**Usage**:
```typescript
const content = await docsLoader.get('getting-started', {
  projectName: 'My API',
  version: '1.0.0'
})
```

**Output**:
```markdown
# Welcome to My API

Version: 1.0.0

Get started with My API in just a few minutes.
```

### Using Helpers

```markdown
{{#if isPremium}}
## Premium Features

Access to advanced features...
{{else}}
## Free Tier

Basic features available...
{{/if}}

Last updated: {{date updatedAt}}
```

---

## Questions?

- **Now**: Auto-generated API docs work at `/docs` (via agents/generate-docs/)
- **Now**: File-based component loading with Handlebars for markdown docs ✅
- **Pattern**: Works exactly like prompts/ (first-class components with auto-loading)

The `docs/` directory is now a **first-class component directory** with full Handlebars support!
