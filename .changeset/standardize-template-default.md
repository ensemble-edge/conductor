---
'@ensemble-edge/conductor': patch
---

Switch default template engine to Liquid for edge-first architecture

**Breaking Change (Minor):** PageMember now defaults to 'liquid' template engine instead of 'simple'

**Why Liquid?**
Liquid is the only template engine that works reliably in Cloudflare Workers edge runtime:
- **Edge-Compatible**: Compiles to AST, no `new Function()` or `eval()` (blocked by Workers CSP)
- **Real-Time Rendering**: Perfect for edge-first, real-time applications
- **Industry Standard**: Used by Shopify, Jekyll, Salesforce - proven at massive scale
- **Rich Features**: Powerful filters, loops, conditionals without CSP violations

**Handlebars Limitation:**
Handlebars uses runtime compilation (`new Function()`) which violates Cloudflare Workers Content Security Policy. It fails with: "Code generation from strings disallowed for this context"

**Template Variable Syntax:**
Liquid uses intuitive syntax:
- Variables: `{{name}}`
- Nested paths: `{{user.name}}`
- Conditionals: `{% if condition %}...{% else %}...{% endif %}`
- Loops: `{% for item in items %}...{% endfor %}`
- Filters: `{{name | upcase}}`, `{{price | money}}`

**Supported Engines:**
- **liquid** (default) - Edge-compatible, real-time, industry standard
- **simple** - Ultra-lightweight, zero dependencies for basic templating
- **handlebars** - Available but NOT recommended (CSP issues in Workers)
- **mjml** - Email-specific responsive layouts

**Migration:**
If upgrading from Handlebars syntax, update your templates:

```yaml
# Before (Handlebars)
component: |
  {% for feature in features %}
  <div>{{this.title}}</div>
  {{/each}}

# After (Liquid)
component: |
  {% for feature in features %}
  <div>{{feature.title}}</div>
  {% endfor %}
```

Or explicitly set engine if keeping old syntax (not recommended):
```yaml
name: my-page
type: Page
templateEngine: simple  # or handlebars (not recommended for Workers)
```

**Edge-First Philosophy:**
Conductor embraces edge-first architecture. Liquid's AST-based compilation ensures templates render in real-time at the edge without CSP violations. This is essential for:
- Sub-50ms response times globally
- Zero cold starts
- Secure execution without eval/Function
- True serverless at the edge
