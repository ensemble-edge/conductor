# Static Assets

This directory contains **static assets** served via Cloudflare's [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).

## Directory Structure

```
assets/
├── public/                 # Served at root URLs (/, /favicon.ico, /styles/*)
│   ├── favicon.ico         # Served at /favicon.ico
│   ├── images/             # Served at /images/*
│   │   └── logo.svg        # Served at /images/logo.svg
│   └── styles/             # Served at /styles/*
│       ├── reset.css       # Served at /styles/reset.css
│       └── utilities.css   # Served at /styles/utilities.css
└── protected/              # For auth-protected files (see Protected Assets below)
    └── reports/
        └── annual-report.pdf
```

> **Note**: `robots.txt` is handled by the `ensembles/system/robots.yaml` ensemble, which provides configurable disallow paths, sitemap URL, and crawl delay.

## URL Mapping

With `directory = "./assets/public"` in wrangler.toml, files are served at **root URLs**:

| File Path | URL | Auth Required |
|-----------|-----|---------------|
| `assets/public/favicon.ico` | `/favicon.ico` | No |
| `assets/public/styles/reset.css` | `/styles/reset.css` | No |
| `assets/public/images/logo.svg` | `/images/logo.svg` | No |

> **How it works**: Wrangler's `directory` setting acts as a document root. Files inside `./assets/public/` are served without the `assets/public` prefix in the URL.

## Public Assets

Public assets are served directly from Cloudflare's edge with aggressive caching:

- **No authentication required**
- **Edge-cached** with `Cache-Control: public, max-age=31536000, immutable`
- **Automatic compression** (gzip, brotli)
- **ETags** for cache validation
- **Served before Worker runs** (fastest possible response)

### Usage in Templates

```html
<link rel="stylesheet" href="/styles/reset.css">
<link rel="icon" href="/favicon.ico">
<img src="/images/logo.svg" alt="Logo">
```

## Protected Assets

Protected assets require authentication. Since Wrangler serves the `assets/public/` directory directly, protected files should be stored elsewhere and served via the Worker.

### Option 1: Use `assets/protected/` with Worker handling

Store protected files in `assets/protected/` and use `run_worker_first = true` to intercept requests:

```toml
# wrangler.toml
[assets]
directory = "./assets/public"
binding = "ASSETS"
run_worker_first = true  # Worker handles auth first
```

The Worker's notFound handler will try `env.ASSETS.fetch()` as a fallback, allowing you to serve protected content after auth.

### Option 2: Store in R2 or external storage

For large protected files, use R2 or external storage:

```typescript
// conductor.config.ts
export default {
  api: {
    protectedAssets: {
      cacheControl: 'private, no-store',
    }
  }
} satisfies ConductorConfig;
```

```bash
# Access protected files (requires auth)
curl -H "Authorization: Bearer <token>" \
  https://your-worker.dev/api/protected/reports/annual-report.pdf
```

## Size Limits

Wrangler static assets are bundled with your worker (~25MB total limit). For large files:

1. Use external storage (R2, S3, etc.)
2. Configure external mapping in `conductor.config.ts`:

```typescript
export default {
  assets: {
    external: {
      '/videos': 'https://my-bucket.r2.cloudflarestorage.com/videos'
    }
  }
} satisfies ConductorConfig;
```

## Common Use Cases

### Web Manifest (PWA)

```
assets/
└── public/
    └── manifest.json    # Served at /manifest.json
```

```json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### OpenAPI/Swagger Spec

```
assets/
└── public/
    └── openapi.yaml    # Served at /openapi.yaml
```

```html
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({ url: "/openapi.yaml", dom_id: '#swagger' });
</script>
```

### Font Files

```
assets/
└── public/
    └── fonts/
        ├── inter-var.woff2    # Served at /fonts/inter-var.woff2
        └── mono.woff2
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-display: swap;
}
```

### Well-Known Files

```
assets/
└── public/
    └── .well-known/
        ├── security.txt      # Served at /.well-known/security.txt
        ├── ai-plugin.json    # Served at /.well-known/ai-plugin.json
        └── apple-app-site-association
```

## Best Practices

1. **Optimize assets**: Compress images, minify CSS
2. **Use web formats**: WebP, AVIF for images; WOFF2 for fonts
3. **Keep public small**: Only put truly public files in `public/`
4. **Use external storage**: For files >5MB, use R2 or CDN

## Configuration

See `conductor.config.ts` for cache control options:

```typescript
export default {
  assets: {
    cacheControl: 'public, max-age=86400',  // Override default (1 year)
  },
  api: {
    protectedAssets: {
      cacheControl: 'private, no-store',    // Override default (1 hour)
    }
  }
} satisfies ConductorConfig;
```
