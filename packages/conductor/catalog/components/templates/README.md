# Component Templates Catalog

Example reusable HTML components and layouts for the Conductor HTML agent.

## Overview

This catalog provides production-ready HTML components and layouts that can be:
- Stored in Cloudflare KV
- Referenced via URI syntax (`template://components/header`)
- Versioned and deployed independently
- Cached at the edge for fast loading

## Directory Structure

```
templates/
├── layouts/          # Full page layouts
│   └── main.html    # Standard page layout with header/footer
└── components/       # Reusable components
    ├── header.html      # Site header with navigation
    ├── footer.html      # Site footer with links
    ├── card.html        # Content card component
    └── navigation.html  # Navigation menu component
```

## Layouts

### Main Layout (`layouts/main.html`)

Full page layout with header, footer, and content area.

**Usage:**
```javascript
{
  type: 'html',
  template: { inline: '<h1>{{heading}}</h1><p>{{body}}</p>' },
  layout: 'template://layouts/main',
  data: {
    title: 'My Page',
    description: 'Page description for SEO',
    heading: 'Welcome',
    body: 'Page content here',
    year: 2025,
    companyName: 'My Company'
  }
}
```

**Variables:**
- `title` - Page title (required)
- `description` - Meta description (optional)
- `content` - Rendered page content (automatically provided)
- Additional variables passed through to header/footer components

## Components

### Header (`components/header.html`)

Site header with title and navigation links.

**Variables:**
- `title` - Site/page title
- `navigation` - Array of navigation items: `[{ name, url }]`

**Example:**
```javascript
data: {
  title: 'My Site',
  navigation: [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
    { name: 'Contact', url: '/contact' }
  ]
}
```

### Footer (`components/footer.html`)

Site footer with copyright and optional links.

**Variables:**
- `year` - Copyright year
- `companyName` - Company/site name
- `footerLinks` - Array of footer links: `[{ name, url }]`

**Example:**
```javascript
data: {
  year: 2025,
  companyName: 'Acme Corp',
  footerLinks: [
    { name: 'Privacy', url: '/privacy' },
    { name: 'Terms', url: '/terms' },
    { name: 'Contact', url: '/contact' }
  ]
}
```

### Card (`components/card.html`)

Content card with optional image, title, description, and link.

**Usage:**
```handlebars
{{> template://components/card
  title="Feature Title"
  description="Feature description"
  link="/learn-more"
  linkText="Learn More"
}}
```

**Variables:**
- `title` - Card title (optional)
- `image` - Image URL (optional)
- `imageAlt` - Image alt text (optional)
- `description` - Card description (optional)
- `link` - Button/link URL (optional)
- `linkText` - Link text (default: "Learn More")

### Navigation (`components/navigation.html`)

Horizontal navigation menu.

**Usage:**
```handlebars
{{> template://components/navigation
  items=navItems
}}
```

**Variables:**
- `items` - Array of nav items: `[{ name, url, icon? }]`

## Deployment

### 1. Store Components in KV

Using the edgit CLI (coming soon):

```bash
# Add component
edgit components add header templates/components/header.html template

# Add layout
edgit components add main-layout templates/layouts/main.html template

# Create version tag
edgit tag create header v1.0.0
edgit tag create main-layout v1.0.0

# Set production environment tags
edgit tag set header prod v1.0.0
edgit tag set main-layout prod v1.0.0
edgit push --tags --force
```

### 2. Manual KV Storage (Alternative)

Using wrangler:

```bash
# Store component
wrangler kv key put "templates/components/header@latest" \
  --path="./templates/components/header.html" \
  --namespace-id="YOUR_KV_NAMESPACE_ID"

# Store layout
wrangler kv key put "templates/layouts/main@latest" \
  --path="./templates/layouts/main.html" \
  --namespace-id="YOUR_KV_NAMESPACE_ID"
```

## Usage in Ensembles

### Basic Page with Layout

```yaml
agents:
  - name: render-page
    type: html
    template:
      inline: |
        <h1>{{heading}}</h1>
        <p>{{content}}</p>
    layout: template://layouts/main
    data:
      title: "My Page"
      heading: "Welcome"
      content: "Page content here"
```

### Using Components

```yaml
agents:
  - name: render-dashboard
    type: html
    template:
      inline: |
        <h1>Dashboard</h1>
        {{#each features}}
          {{> template://components/card}}
        {{/each}}
    layout: template://layouts/main
    data:
      title: "Dashboard"
      features:
        - title: "Analytics"
          description: "View your analytics"
          link: "/analytics"
          linkText: "View"
        - title: "Reports"
          description: "Generate reports"
          link: "/reports"
          linkText: "Generate"
```

### Version Pinning

```yaml
# Use specific versions for stability
agents:
  - name: render-page
    type: html
    template:
      inline: |
        {{> template://components/header@v1.2.0}}
        <main>{{content}}</main>
        {{> template://components/footer@v1.2.0}}
    data:
      title: "My Page"
```

## Versioning Strategy

### Semantic Versioning

- **Latest** (`@latest`) - Always points to newest version
- **Semantic** (`@v1.2.3`) - Specific version for stability
- **Tags** (`@prod`, `@preview`) - Environment-specific versions

### Best Practices

1. **Development**: Use `@latest` for rapid iteration
2. **Staging**: Use `@preview` tag for testing
3. **Production**: Pin to specific versions (`@v1.0.0`)
4. **Critical Components**: Always version pin in production

## Customization

### Override Component Styles

```javascript
{
  type: 'html',
  template: {
    inline: `
      <style>
        .card { background: #f0f0f0; }
      </style>
      {{> template://components/card}}
    `
  },
  data: { /* ... */ }
}
```

### Create Custom Components

1. Create HTML template file
2. Use Conductor template syntax (Simple, Handlebars, etc.)
3. Store in KV with descriptive key
4. Reference via URI

```html
<!-- custom-alert.html -->
<div class="alert alert-{{type}}">
  <strong>{{title}}</strong>
  <p>{{message}}</p>
</div>
```

```javascript
// Store in KV as: templates/components/custom-alert@v1.0.0

// Use in templates:
{{> template://components/custom-alert
  type="success"
  title="Success!"
  message="Operation completed"
}}
```

## Edge Caching

All components are automatically cached at the edge using Conductor's standard cache system:
- **Default TTL**: 1 hour (3600 seconds)
- **First load**: Fetched from KV (~5-10ms)
- **Subsequent loads**: Served from edge cache (~0.1ms)
- **Cache invalidation**: Automatic per-version

### Custom Cache Configuration

Components support optional cache configuration:

```typescript
// Custom TTL (24 hours)
await componentLoader.load('template://components/header@v1.0.0', {
  cache: { ttl: 86400 }
});

// Bypass cache for fresh data
await componentLoader.load('template://components/news@latest', {
  cache: { bypass: true }
});
```

**Cache Options:**
- `ttl`: Cache duration in seconds (default: 3600)
- `bypass`: Skip cache and load fresh from KV (default: false)

**Use Cases:**
- **Long TTL (86400s)**: Static components that rarely change (headers, footers)
- **Short TTL (300s)**: Dynamic components (news, live data)
- **Bypass**: Testing, forced updates, or real-time requirements

## Examples

See `/examples` directory for complete working examples:
- Simple landing page
- Dashboard with multiple components
- Email template with MJML
- Multi-page application with shared layout

## Support

For issues or questions:
- GitHub: https://github.com/anthropics/ensemble-edge
- Docs: https://docs.ensemble-edge.com
