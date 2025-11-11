# HTML Member

Generate dynamic HTML pages with template rendering, components, layouts, and cookie management.

## Features

- **Edge-Compatible Template Engines**: Liquid (default), Simple, MJML - all work in Cloudflare Workers
- **Component System**: Reusable components loaded from KV with versioning
- **Layout Support**: Wrap pages with common layouts (header, footer, etc.)
- **Cookie Management**: Read, set, delete, and sign cookies
- **CSS Inlining**: Email-compatible CSS inlining
- **HTML Minification**: Optimize output size
- **Edge Caching**: Automatic component caching at Cloudflare edge

## Basic Usage

### Simple Template

```yaml
members:
  - name: render-page
    type: html
    template:
      inline: |
        <h1>{{title}}</h1>
        <p>Welcome, {{userName}}!</p>
    data:
      title: "My Page"
      userName: "John"
```

### Using KV Templates

```yaml
members:
  - name: render-email
    type: html
    template:
      kv: "email-templates/welcome-v1"
    data:
      userName: "Jane"
      confirmLink: "https://example.com/confirm/abc123"
```

## Component System

### Using Components

Components are reusable HTML templates stored in KV and referenced via URI syntax.

```yaml
members:
  - name: render-dashboard
    type: html
    template:
      inline: |
        <h1>Dashboard</h1>
        {{> template://components/card
          title="Analytics"
          description="View your analytics"
          link="/analytics"
        }}
    data:
      # ... data for card component
```

### URI Syntax

**Format**: `{protocol}://{path}[@{version}]`

**Protocols**:
- `template://` - HTML/Handlebars templates
- `component://` - Compiled JSX components
- `form://` - Form definitions
- `page://` - Full page components

**Version Handling**:
- `template://components/header` → Uses `@latest`
- `template://components/header@v1.2.0` → Specific version
- `template://components/header@prod` → Tagged version

### Registering Partials (In-Memory)

For simple components that don't need versioning:

```typescript
const engine = new SimpleTemplateEngine();
engine.registerPartial('alert', `
  <div class="alert alert-{{type}}">
    {{message}}
  </div>
`);

// Use in templates:
// {{> alert type="success" message="Saved!"}}
```

## Layout System

Layouts wrap your page content with common elements like headers and footers.

### Using Layouts

```yaml
members:
  - name: render-page
    type: html
    template:
      inline: |
        <h1>{{pageTitle}}</h1>
        <p>{{pageContent}}</p>
    layout: template://layouts/main
    data:
      # Layout variables
      title: "My Site - About"
      year: 2025
      companyName: "Acme Corp"
      # Page content variables
      pageTitle: "About Us"
      pageContent: "We are a great company"
```

### Layout Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  {{> template://components/header}}

  <main>
    {{content}}  <!-- Your page content inserted here -->
  </main>

  {{> template://components/footer}}
</body>
</html>
```

The `{{content}}` variable is automatically populated with your rendered page template.

## Template Engines

### Liquid Engine (Default) ⭐ Recommended

Edge-compatible, industry-standard template engine from Shopify/Jekyll. Works perfectly in Cloudflare Workers.

**Variables**: `{{variableName}}`
```html
<h1>{{title}}</h1>
<p>{{user.name}}</p>
```

**Conditionals**: `{% if condition %}...{% else %}...{% endif %}`
```html
{% if isLoggedIn %}
  <p>Welcome back!</p>
{% else %}
  <p>Please log in</p>
{% endif %}
```

**Loops**: `{% for item in array %}...{% endfor %}`
```html
<ul>
{% for item in items %}
  <li>{{item.name}}: {{item.price}}</li>
{% endfor %}
</ul>
```

**Filters**: `{{variable | filter}}`
```html
<h1>{{title | upcase}}</h1>
<p>Price: {{price | money}}</p>
<p>{{content | strip_html | truncate: 100}}</p>
```

**Usage**:
```yaml
template:
  engine: liquid
  inline: |
    <h1>{{ title }}</h1>
    {% for product in products %}
      <div>{{ product.name }}: {{ product.price | money }}</div>
    {% endfor %}
```

### Simple Engine

Ultra-lightweight template engine with zero dependencies. Good for basic templating.

**Variables**: `{{variableName}}`
```html
<h1>{{title}}</h1>
<p>{{user.name}}</p>
```

**Conditionals**: `{{#if condition}}...{{else}}...{{/if}}`
```html
{{#if isLoggedIn}}
  <p>Welcome back!</p>
{{else}}
  <p>Please log in</p>
{{/if}}
```

**Loops**: `{{#each array}}...{{/each}}`
```html
<ul>
{{#each items}}
  <li>{{name}}: {{price}}</li>
{{/each}}
</ul>
```

**Note**: In Simple engine loops, object properties are spread into context. Use `{{property}}` not `{{this.property}}`.

### Handlebars Engine ⚠️ Not Recommended

**Warning**: Handlebars uses `new Function()` which is blocked by Cloudflare Workers Content Security Policy. It will fail with "Code generation from strings disallowed for this context".

Use Liquid instead for similar functionality that works in Workers

### MJML Engine

Email-optimized templates that compile to responsive HTML.

```yaml
template:
  engine: mjml
  inline: |
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>Hello {{userName}}!</mj-text>
            <mj-button href="{{confirmLink}}">Confirm Email</mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
renderOptions:
  inlineCss: true
```

## Cookie Management

### Reading Cookies

```yaml
members:
  - name: read-cookies
    type: html
    template:
      inline: |
        <p>Session ID: {{cookies.sessionId}}</p>
        <p>User: {{cookies.userName}}</p>
```

Input cookies from request:
```javascript
{
  input: {
    cookies: {
      sessionId: "abc123",
      userName: "john"
    }
  }
}
```

### Setting Cookies

```yaml
members:
  - name: set-cookies
    type: html
    template:
      inline: "<p>Cookies set!</p>"
```

Input to set cookies:
```javascript
{
  input: {
    setCookies: [
      {
        name: "sessionId",
        value: "abc123",
        options: {
          maxAge: 3600,
          httpOnly: true,
          secure: true,
          sameSite: "lax"
        }
      }
    ]
  }
}
```

### Deleting Cookies

```javascript
{
  input: {
    deleteCookies: ["sessionId", "oldToken"]
  }
}
```

### Signed Cookies

Enable cookie signing for tamper protection:

```yaml
members:
  - name: secure-cookies
    type: html
    cookieSecret: "your-secret-key-here"
    template:
      inline: "<p>Secure cookies enabled</p>"
```

## Render Options

### CSS Inlining

Required for email compatibility:

```yaml
renderOptions:
  inlineCss: true
```

Converts:
```html
<style>
  .alert { color: red; }
</style>
<div class="alert">Warning!</div>
```

To:
```html
<div class="alert" style="color: red;">Warning!</div>
```

### HTML Minification

```yaml
renderOptions:
  minify: true
```

Removes whitespace and comments to reduce file size.

### Pretty Printing (Development)

```yaml
renderOptions:
  pretty: true
```

Formats HTML with proper indentation for readability.

## Template Loading

### Inline Templates

```yaml
template:
  inline: "<h1>{{title}}</h1>"
```

### KV Templates

```yaml
template:
  kv: "templates/welcome-email"
```

### R2 Templates

```yaml
template:
  r2: "templates/pdf-invoice.html"
```

### File Templates (Local Development)

```yaml
template:
  file: "./templates/welcome.html"
```

## Configuration

### Member Configuration

```typescript
interface HtmlMemberConfig {
  template: TemplateSource;
  renderOptions?: HtmlRenderOptions;
  cookieSecret?: string;
  defaultCookieOptions?: CookieOptions;
}
```

### Input Interface

```typescript
interface HtmlMemberInput {
  data?: Record<string, unknown>;
  cookies?: Record<string, string>;
  setCookies?: Cookie[];
  deleteCookies?: string[];
  template?: TemplateSource;
  layout?: string;
  renderOptions?: HtmlRenderOptions;
}
```

### Output Interface

```typescript
interface HtmlMemberOutput {
  html: string;
  cookies?: string[];
  readCookies?: Record<string, string>;
  engine: TemplateEngine;
  metadata?: {
    renderTime: number;
    templateSize: number;
    outputSize: number;
    cssInlined?: boolean;
    minified?: boolean;
  };
}
```

## Built-in Helpers

The Simple engine includes these helpers:

### Date Formatting
```html
{{formatDate createdAt}} <!-- January 9, 2025 -->
```

### String Manipulation
```html
{{uppercase name}}    <!-- JOHN -->
{{lowercase name}}    <!-- john -->
{{capitalize name}}   <!-- John -->
```

### Number Formatting
```html
{{currency price}}           <!-- $1,234.56 -->
{{currency price "EUR"}}     <!-- €1,234.56 -->
```

### Conditional Helpers
```html
{{eq status "active"}}       <!-- true/false -->
{{ne status "deleted"}}      <!-- true/false -->
{{lt count 10}}              <!-- true/false -->
{{gt count 5}}               <!-- true/false -->
{{and isActive isPremium}}   <!-- true/false -->
{{or isAdmin isModerator}}   <!-- true/false -->
```

## Component Deployment

### Using Edgit CLI (Recommended)

```bash
# Add component to project
edgit components add header ./templates/components/header.html template

# Create version tag
edgit tag create header v1.0.0

# Deploy to production
edgit deploy set header v1.0.0 --to production

# Deploy latest version
edgit deploy set header latest --to production
```

### Manual KV Storage

```bash
# Store component in KV
wrangler kv key put "templates/components/header@v1.0.0" \
  --path="./templates/components/header.html" \
  --namespace-id="YOUR_KV_NAMESPACE_ID"

# Create latest pointer
wrangler kv key put "templates/components/header@latest" \
  --path="./templates/components/header.html" \
  --namespace-id="YOUR_KV_NAMESPACE_ID"
```

## Component Cache Configuration

Components support optional cache configuration, similar to member-level caching:

### Default Caching

By default, all components are cached for 1 hour (3600 seconds):

```typescript
// Cached for 1 hour by default
const content = await componentLoader.load('template://components/header@v1.0.0');
```

### Custom TTL

Override the cache duration per component:

```typescript
// Cache for 24 hours
const content = await componentLoader.load('template://components/header@v1.0.0', {
  cache: { ttl: 86400 }
});

// Cache for 5 minutes
const content = await componentLoader.load('template://components/news@latest', {
  cache: { ttl: 300 }
});
```

### Cache Bypass

Skip cache for specific loads (useful for testing or forcing fresh data):

```typescript
// Always load fresh from KV
const content = await componentLoader.load('template://components/header@v1.0.0', {
  cache: { bypass: true }
});
```

### Combined Options

```typescript
// Custom TTL without bypass
await componentLoader.load('template://components/card@v1.0.0', {
  cache: { ttl: 7200, bypass: false }
});

// Bypass cache (TTL ignored)
await componentLoader.load('template://components/card@v1.0.0', {
  cache: { bypass: true }
});
```

### Usage in HTML Member

The HTML member automatically handles component caching based on Conductor's standard cache system. Cache configuration is typically set at the ComponentLoader level:

```typescript
const componentLoader = createComponentLoader({
  kv: env.COMPONENTS,
  cache: conductorCache,
  logger: conductorLogger
});
```

Components referenced in templates use default caching behavior:

```yaml
members:
  - name: render-page
    type: html
    template:
      inline: |
        {{> template://components/header}}  # Cached for 1 hour
        <main>{{content}}</main>
        {{> template://components/footer}}  # Cached for 1 hour
```

For programmatic control over component caching, load components manually and pass to template data.

## Performance

### Edge Caching

Components are automatically cached at the edge using Conductor's standard cache:
- **Default Cache Duration**: 1 hour (3600 seconds)
- **Configurable TTL**: Per-load via cache options
- **Cache Key**: `conductor:cache:components:${uri}` (includes version)
- **Cache Storage**: Cloudflare KV via RepositoryCache
- **Invalidation**: Per-version (deploy new version to update)

**Cache Performance**:
- First load: ~5-10ms (KV fetch)
- Cached load: ~0.1ms (edge cache hit)
- Bypass cache: ~5-10ms (forced KV fetch)

### Best Practices

1. **Version Pin in Production**: Use specific versions (`@v1.0.0`) not `@latest`
2. **Appropriate TTLs**: Longer for stable content, shorter for dynamic content
3. **Bypass Cache Sparingly**: Only use bypass for testing or forced updates
4. **Prefetch Components**: Load common components in worker startup
5. **Minimize Nesting**: Deep component nesting adds latency
6. **Use CDN for Assets**: Reference images/fonts from CDN, not inline
7. **Enable Minification**: Always minify in production

## Examples

### Complete Landing Page

```yaml
members:
  - name: render-landing
    type: html
    template:
      inline: |
        <div class="hero">
          <h1>{{heroTitle}}</h1>
          <p>{{heroSubtitle}}</p>
        </div>

        <div class="features">
          {{#each features}}
            {{> template://components/card
              title=this.title
              description=this.description
              link=this.link
            }}
          {{/each}}
        </div>
    layout: template://layouts/main
    renderOptions:
      minify: true
    data:
      title: "Welcome to Our Product"
      heroTitle: "Build Faster"
      heroSubtitle: "Ship products in days, not months"
      features:
        - title: "Fast"
          description: "Lightning quick performance"
          link: "/features/performance"
        - title: "Secure"
          description: "Enterprise-grade security"
          link: "/features/security"
```

### Email with MJML

```yaml
members:
  - name: send-welcome-email
    type: html
    template:
      engine: mjml
      kv: "emails/welcome@v1.0.0"
    renderOptions:
      inlineCss: true
    data:
      userName: "{{user.name}}"
      confirmLink: "https://app.example.com/confirm/{{token}}"
```

### Multi-Step Form with State

```yaml
members:
  - name: render-form-step
    type: html
    cookieSecret: "${env.COOKIE_SECRET}"
    template:
      inline: |
        {{> template://forms/registration/step-{{currentStep}}}}
    data:
      currentStep: 2
      formData: "{{cookies.formState}}"
```

## See Also

- [Component Catalog](../../../catalog/components/templates/README.md)
- [Template Examples](./examples/)
- [Cookie Security Guide](./docs/cookie-security.md)
- [Email Best Practices](./docs/email-best-practices.md)
