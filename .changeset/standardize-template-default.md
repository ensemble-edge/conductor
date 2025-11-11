---
'@ensemble-edge/conductor': patch
---

Standardize template engine default to 'simple' across all member types

**Breaking Change (Minor):** PageMember now defaults to 'simple' template engine instead of 'handlebars'

**Rationale:**
- All member types (Email, SMS, HTML, Page) now consistently default to 'simple' engine
- All template engines support the same `{{variable}}` syntax for basic interpolation
- Simple engine is lightweight with no external dependencies
- Users can explicitly set `templateEngine: 'handlebars'` in page YAML for advanced features

**Template Variable Syntax:**
All engines use identical syntax for basic features:
- Variables: `{{name}}`
- Nested paths: `{{user.name}}`
- Conditionals: `{{#if condition}}...{{/if}}`
- Loops: `{{#each items}}...{{/each}}`
- Partials: `{{> partial}}`

**Engine Differences:**
- **simple**: Lightweight, no dependencies, basic features
- **handlebars**: Advanced helpers (eq, ne, lt, gt, upper, lower, capitalize, etc.)
- **liquid**: Shopify-style templating with filters
- **mjml**: Responsive email HTML generation

**Migration:**
If you need Handlebars-specific features, add to your page YAML:
```yaml
name: my-page
type: Page
templateEngine: handlebars
component: |
  <h1>{{upper title}}</h1>
```
