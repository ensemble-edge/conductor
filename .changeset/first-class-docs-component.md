---
"@ensemble-edge/conductor": minor
---

Add first-class docs component support with Handlebars rendering

- **DocsManager**: New class for managing markdown documentation with Handlebars rendering, YAML frontmatter parsing, and in-memory caching
- **DocsLoader**: Template utility for easy docs access with auto-discovery integration
- **Vite Plugin**: Auto-discovers markdown files at build time via vite-plugin-docs-discovery
- **Component Protocol**: Added `docs://` protocol support in ComponentLoader for versioned component references
- **Template Integration**: DocsLoader initialization with lazy loading, DocsRouter for HTTP endpoints
- **Full Handlebars Support**: Variables, conditionals, loops, helpers, and partials
- **Testing**: 21 comprehensive tests covering all DocsManager functionality
- **Agent Organization**: Renamed agents/docs → agents/generate-docs for clarity

The docs/ directory now works exactly like prompts/ with versioning, component references, and dynamic rendering capabilities.
