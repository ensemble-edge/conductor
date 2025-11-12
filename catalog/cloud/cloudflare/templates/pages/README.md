# Pages

Page components for server-side rendered pages with client-side hydration.

## Structure

Each page can be organized as:

### Option 1: Single File (Simple Pages)
```
pages/
  my-page.yaml
```

### Option 2: Directory (Complex Pages)
```
pages/
  my-page/
    page.yaml       # Page configuration
    component.tsx   # JSX/TSX component (future)
    styles.css      # Optional styles
    README.md       # Documentation
```

## Page Configuration

A `page.yaml` file defines:

```yaml
name: my-page
type: Page
description: My page description

# Component source (inline HTML/Handlebars for now)
component: |
  <div>
    <h1>{{title}}</h1>
    <p>{{content}}</p>
  </div>

# Render mode: ssr, static, or hybrid
renderMode: ssr

# Hydration strategy
hydration:
  strategy: htmx  # none, htmx, progressive, or islands

# SEO configuration
seo:
  title: Page Title
  description: Page description
  canonical: /my-page

# Caching
cache:
  enabled: true
  ttl: 3600

# Default input props
input:
  title: Default Title
  content: Default content
```

## Hydration Strategies

1. **none** - Static HTML, no client-side JavaScript
2. **htmx** - HTMX for dynamic interactions
3. **progressive** - Progressive enhancement
4. **islands** - Component islands architecture

## Examples

See `examples/` directory for:
- `dashboard/` - Analytics dashboard with htmx
- `login/` - Login page with form handling

## Usage

Pages are loaded and rendered by the Page agent type in ensembles:

```yaml
name: render-dashboard
agents:
  - name: dashboard-page
    type: Page
    input:
      title: $input.title
      user: $input.user
      metrics: $getData.metrics
```
