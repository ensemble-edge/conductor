---
"@ensemble-edge/conductor": patch
---

Remove handlebars and mjml template engines from Workers agents (CSP incompatible)

**BREAKING**: Removed 'handlebars' and 'mjml' from all Workers agent template engine options. These engines use eval() which fails in Cloudflare Workers due to CSP restrictions.

**Changes**:
- Removed 'handlebars' and 'mjml' from TemplateEngine type (now only 'simple' | 'liquid')
- Updated all agents (ThinkAgent, PageAgent, HtmlAgent) to only support Workers-compatible engines
- HandlebarsTemplateEngine and MJMLTemplateEngine classes kept for server-side use only (DocsManager, EmailAgent)
- All 903 tests passing

**Migration**: If using `templateEngine: 'handlebars'` or `templateEngine: 'mjml'`, switch to `'simple'` (default) or `'liquid'`. SimpleTemplateEngine supports {{variable}}, {{#if}}, {{#each}} syntax.
