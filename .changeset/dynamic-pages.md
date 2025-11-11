---
"@ensemble-edge/conductor": minor
---

Add dynamic pages with handler functions and parameter support

**New Features:**
- Handler functions for dynamic data fetching in pages
- Route parameters (`:slug`), query parameters, and header access in handlers
- Automatic handler detection and import via Vite plugin
- Full template context with `params`, `query`, and `headers` variables

**Example:**
```typescript
// pages/blog/post/handler.ts
export async function handler({ params, query, headers, env }) {
  const post = await env.DB.prepare('SELECT * FROM posts WHERE slug = ?')
    .bind(params.slug)
    .first()
  return { post }
}
```

```yaml
# pages/blog/post/page.yaml
route:
  path: /blog/:slug

component: |
  <h1>{{post.title}}</h1>
  <p>Slug: {{params.slug}}</p>
  <p>Preview: {{query.preview}}</p>
```

**API:**
- `HandlerContext` type with `request`, `env`, `ctx`, `params`, `query`, `headers`
- `HandlerFunction` type: `(context: HandlerContext) => HandlerResult`
- PageMember automatically calls handler before rendering
- Template receives handler data merged with route/query params

**Template Support:**
- Updated blog-post example with full handler implementation
- Mock data, KV, and D1 database examples
- 404 handling when data not found
