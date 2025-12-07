# Static Assets

This directory contains **static assets** served via Cloudflare's [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).

## Directory Structure

```
assets/
├── public/                 # /assets/public/* (no auth, edge-cached)
│   ├── favicon.ico         # Site favicon
│   ├── images/             # Public images
│   │   └── logo.svg
│   └── styles/             # Global CSS
│       ├── reset.css       # CSS reset
│       └── utilities.css   # Utility classes
└── protected/              # /assets/protected/* (requires API auth)
    └── reports/            # Auth-protected files
        └── annual-report.pdf
```

> **Note**: `robots.txt` is handled by the `ensembles/system/robots.yaml` ensemble, which provides configurable disallow paths, sitemap URL, and crawl delay.

## URL Mapping

| File Path | URL | Auth Required |
|-----------|-----|---------------|
| `assets/public/favicon.ico` | `/assets/public/favicon.ico` | No |
| `assets/public/styles/reset.css` | `/assets/public/styles/reset.css` | No |
| `assets/protected/reports/report.pdf` | `/assets/protected/reports/report.pdf` | Yes (API auth) |

## Public Assets (`/assets/public/`)

Public assets are served directly from Cloudflare's edge with aggressive caching:

- **No authentication required**
- **Edge-cached** with `Cache-Control: public, max-age=31536000, immutable`
- **Automatic compression** (gzip, brotli)
- **ETags** for cache validation

### Usage in Templates

```html
<link rel="stylesheet" href="/assets/public/styles/reset.css">
<link rel="icon" href="/assets/public/favicon.ico">
<img src="/assets/public/images/logo.svg" alt="Logo">
```

## Protected Assets (`/assets/protected/`)

Protected assets require authentication using your configured API auth settings:

- **Requires `api.auth`** to be configured in `conductor.config.ts`
- **Uses the same auth** as your API endpoints (bearer, API key, etc.)
- **Private caching** with `Cache-Control: private, max-age=3600`

### Configuration

Protected assets use the auth settings from your conductor config:

```typescript
// conductor.config.ts
export default {
  api: {
    auth: {
      type: 'bearer',
      // Protected assets will require this same auth
    }
  }
} satisfies ConductorConfig;
```

### Usage

```bash
# Requires Authorization header
curl -H "Authorization: Bearer <token>" \
  https://your-worker.dev/assets/protected/reports/annual-report.pdf
```

## Convenience Routes

Root-level files are redirected to their `/assets/public/` location:

- `/favicon.ico` → `/assets/public/favicon.ico`

> **Note**: `/robots.txt` is handled by the `robots` ensemble (see `ensembles/system/robots.yaml`), not a static file.

## Size Limits

Wrangler static assets are bundled with your worker (~25MB total limit). For large files:

1. Use external storage (R2, S3, etc.)
2. Configure external mapping in `conductor.config.ts`:

```typescript
export default {
  assets: {
    external: {
      '/assets/public/videos': 'https://my-bucket.r2.cloudflarestorage.com/videos'
    }
  }
} satisfies ConductorConfig;
```

## Best Practices

1. **Optimize assets**: Compress images, minify CSS
2. **Use web formats**: WebP, AVIF for images; WOFF2 for fonts
3. **Keep public small**: Only put truly public files in `public/`
4. **Protect sensitive files**: Use `protected/` for auth-required content

## Configuration

See `conductor.config.ts` for cache control and external mapping options:

```typescript
export default {
  assets: {
    cacheControl: 'public, max-age=86400',  // Override default (1 year)
  },
  api: {
    auth: { type: 'bearer' },
    protectedAssets: {
      cacheControl: 'private, no-store',    // Override default (1 hour)
    }
  }
} satisfies ConductorConfig;
```
