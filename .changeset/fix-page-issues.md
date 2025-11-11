---
'@ensemble-edge/conductor': patch
---

Fix critical Page rendering issues and add template engine support

**Issue 1: Duplicate Content-Type Header (CRITICAL)**
- PageRouter was setting content-type header AND spreading pageOutput.headers which also contained Content-Type
- This created malformed header: 'content-type': 'text/html; charset=utf-8, text/html; charset=utf-8'
- Caused HTMLRewriter to fail with "Parser error: Unknown character encoding"
- Fixed by using pageOutput.headers directly without duplication

**Issue 2: Handlebars Templates Not Rendering**
- PageMember was returning raw template strings without rendering
- Handlebars variables appeared as literal {{variable}} text in HTML
- Fixed by integrating template rendering engines
- Added support for default input props from page YAML configuration

**New Feature: Template Engine Selection**
- Pages can now specify their template engine: 'handlebars', 'liquid', 'simple', or 'mjml'
- Default is 'simple' (consistent with Email, SMS, and HTML members)
- All engines support same {{variable}} syntax for basic interpolation
- Simple engine is lightweight with no dependencies
- Handlebars includes extensive helpers (eq, ne, lt, gt, upper, lower, etc.) for advanced use cases
- Liquid provides Shopify-style templating
- MJML for responsive email HTML

Example:
```yaml
name: my-page
type: Page
templateEngine: simple  # or 'handlebars', 'liquid', 'mjml'
component: |
  <h1>{{title}}</h1>
input:
  title: Hello World
```
