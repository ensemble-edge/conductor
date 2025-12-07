# Static Assets System Plan

## Overview

Rethink the assets system from R2-backed to **folder-backed static assets** using Wrangler's native `[assets]` feature, with proper integration into HTTP triggers, security, and the Conductor ecosystem.

**Key Principle**: Conductor handles assets via Wrangler. If users need R2, they set it up outside Conductor and optionally map external paths.

---

## Current State

- `assets/` folder exists in templates with `styles/` and empty `images/`
- R2 binding is commented out in wrangler.toml (was planned but never implemented)
- No actual static file serving mechanism exists
- Docs agent has `favicon?: string` config but no default
- HTTP triggers use Hono router with middleware support

---

## Design Goals

1. **Simple by default** - Assets just work without extra config
2. **Security-aware** - Protected assets use existing API auth settings
3. **Performance** - Leverage Cloudflare edge caching via Wrangler
4. **No R2 complexity** - If users want R2, they manage it externally

---

## Architecture: Wrangler Native Assets

Use Cloudflare's built-in [static assets](https://developers.cloudflare.com/workers/static-assets/) feature.

**wrangler.toml:**
```toml
[assets]
directory = "./assets"
run_worker_first = true  # Required: lets Conductor intercept /assets/protected/*
```

**Key insight**: The Wrangler directory name becomes the URL root. By naming the folder `assets/`, files inside are served at `/assets/*` URLs directly.

**`run_worker_first = true`**: This is critical! It ensures your Worker code (Conductor) runs before Wrangler serves static files, allowing us to intercept `/assets/protected/*` for auth.

**Pros:**
- Zero Conductor code required for basic serving
- Automatic caching, compression, ETags
- Files served directly from Cloudflare edge
- No R2 costs or complexity
- Clean URL structure: folder path = URL path

**Cons:**
- Assets bundled with worker (size limits ~25MB)
- Deploy required to update assets
- For large asset libraries, users manage R2 externally

**Works in both environments:**
- **Local dev** (`wrangler dev`): Assets served from local disk with hot reload
- **Production** (`wrangler deploy`): Assets bundled and served from Cloudflare edge

---

## URL Structure

```
/assets/public/*     → Public assets (no auth, edge-cached)
/assets/protected/*  → Protected assets (uses API auth settings)
/favicon.ico         → Convenience redirect to /assets/public/favicon.ico
/robots.txt          → Convenience redirect to /assets/public/robots.txt
```

### Why `/assets/public/` and `/assets/protected/`?

1. **Clear hierarchy** - Single `/assets/` namespace with sub-paths
2. **Consistent mental model** - Protected assets live alongside public ones
3. **Auth coupling** - `/assets/protected/` uses the same auth as your API endpoints

---

## File Structure

### Template Default
```
my-conductor-project/
├── assets/                         # Wrangler serves this (directory = "./assets")
│   ├── public/                     # No auth required → /assets/public/*
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   ├── images/
│   │   │   └── logo.svg
│   │   └── styles/
│   │       ├── reset.css
│   │       └── utilities.css
│   └── protected/                  # Requires API auth → /assets/protected/*
│       └── .gitkeep
├── src/
│   ├── ensembles/
│   ├── conductor.config.ts
│   └── index.ts
└── wrangler.toml
```

### URL Mapping
| File Path | URL | Auth |
|-----------|-----|------|
| `assets/public/favicon.ico` | `/assets/public/favicon.ico` | None |
| `assets/public/styles/reset.css` | `/assets/public/styles/reset.css` | None |
| `assets/protected/report.pdf` | `/assets/protected/report.pdf` | API auth |

---

## Routing Architecture

### How Routing Works

```
                                    ┌─────────────────────────────────────┐
                                    │          Incoming Request           │
                                    └─────────────────┬───────────────────┘
                                                      │
                                                      ▼
                                    ┌─────────────────────────────────────┐
                                    │      Conductor Hono Router          │
                                    │    (intercepts ALL requests first)  │
                                    └─────────────────┬───────────────────┘
                                                      │
                          ┌───────────────────────────┼───────────────────────────┐
                          │                           │                           │
                          ▼                           ▼                           ▼
              ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
              │ /assets/protected │      │   /favicon.ico    │      │ Ensemble routes   │
              │  Conductor auth   │      │   /robots.txt     │      │ /api/*, custom    │
              │   middleware      │      │ 301 → /assets/... │      │    paths          │
              └─────────┬─────────┘      └───────────────────┘      └───────────────────┘
                        │
            ┌───────────┴───────────┐
            │ Auth check            │
            │ (uses api.auth)       │
            └───────────┬───────────┘
                        │
            ┌───────────┴───────────┐
      ┌─────┤      Auth result      ├─────┐
      │     └───────────────────────┘     │
      ▼                                   ▼
┌───────────┐                       ┌───────────┐
│   PASS    │                       │   FAIL    │
│  return   │                       │  Return   │
│  next()   │                       │ 401/403   │
│           │                       └───────────┘
└─────┬─────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Wrangler Static Assets                       │
│              (serves /assets/public/* directly)                 │
│                                                                 │
│   All unhandled /assets/* requests fall through to Wrangler    │
└─────────────────────────────────────────────────────────────────┘
```

### Route Priority (from highest to lowest)

| Priority | Path | Handler | Description |
|----------|------|---------|-------------|
| 1 | `/api/*`, custom ensemble paths | Conductor | Explicit ensemble routes |
| 2 | `/assets/protected/*` | Conductor + Auth | Protected assets (requires `api.auth`) |
| 3 | `/favicon.ico`, `/robots.txt` | Conductor | 301 redirect to `/assets/public/...` |
| 4 | `/{ensemble-name}` | Conductor | Default ensemble routes |
| 5 | `/assets/public/*` | Wrangler | Static assets (fallthrough) |
| 6 | `/assets/*` (other) | Wrangler | Any other static files |

### Key Implementation Details

1. **Conductor intercepts first**: Hono router handles all incoming requests
2. **Protected assets require auth**: `/assets/protected/*` goes through `api.auth` middleware
3. **Auth pass = fall through**: After auth passes, `return next()` lets Wrangler serve the file
4. **Public assets fall through**: Unmatched routes → Wrangler serves static files directly

### Request Flow Examples

**Public asset (no auth):**
```
GET /assets/public/styles/reset.css
  → Conductor: no matching route
  → Wrangler: serves assets/public/styles/reset.css
  → Response: 200 + file + cache headers
```

**Protected asset (auth required):**
```
GET /assets/protected/report.pdf
Authorization: Bearer <token>
  → Conductor: matches /assets/protected/*
  → Auth middleware: validates token via api.auth
  → Pass: return next() → falls through to Wrangler
  → Response: 200 + file + private cache headers
```

**Convenience route:**
```
GET /favicon.ico
  → Conductor: matches /favicon.ico
  → Response: 301 redirect to /assets/public/favicon.ico
  → Browser follows redirect → Wrangler serves file
```

---

## Security: Protected Assets

Protected assets at `/assets/protected/*` use the **same auth settings** as your API endpoints.

### How It Works

1. Wrangler serves all files from `assets/` directory
2. Conductor intercepts requests to `/assets/protected/*` **before** Wrangler
3. Auth middleware validates using existing API auth config
4. If valid, proxies to the static file; if not, returns 401/403

### Configuration in conductor.config.ts

```typescript
// conductor.config.ts
export default {
  // API auth settings (existing)
  api: {
    auth: {
      type: 'bearer',
      // or apiKey, basic, etc.
    }
  },

  // Assets config (new)
  assets: {
    // Protected assets use api.auth settings automatically
    // No separate auth config needed!

    // Optional: cache settings for public assets
    public: {
      cacheControl: 'public, max-age=31536000, immutable'
    },

    // Optional: cache settings for protected assets
    protected: {
      cacheControl: 'private, max-age=3600'
    }
  }
} satisfies ConductorConfig;
```

### Auth Flow for Protected Assets

```
Request: GET /assets/protected/report.pdf
         Authorization: Bearer <token>

1. Wrangler would serve file, but Conductor intercepts first
2. Conductor checks: is path under /assets/protected/?
3. If yes, run API auth middleware
4. Auth passes → serve file with private cache headers
5. Auth fails → 401 Unauthorized
```

---

## External Assets (R2 Escape Hatch)

If users need R2 or external CDN for large assets, they manage it themselves and optionally map paths in Conductor.

### Use Case
- Large file libraries (videos, downloadable archives)
- User-uploaded content
- CDN-hosted assets

### Configuration

```typescript
// conductor.config.ts
export default {
  assets: {
    // Map external paths to replace local assets
    external: {
      // Requests to /assets/public/videos/* redirect to R2
      '/assets/public/videos': 'https://my-bucket.r2.cloudflarestorage.com/videos',

      // Or a custom CDN
      '/assets/public/images': 'https://cdn.example.com/images',
    }
  }
} satisfies ConductorConfig;
```

### How External Mapping Works

```
Request: GET /assets/public/videos/intro.mp4

1. Conductor checks external mappings
2. Finds match: /assets/public/videos → R2 URL
3. Returns 302 redirect to: https://my-bucket.r2.../videos/intro.mp4
   (or optionally proxy the request)
```

### Why Redirect (Not Proxy)?

- **Performance**: R2/CDN serves directly, no worker in the middle
- **Cost**: No worker CPU time for large file transfers
- **Simplicity**: Conductor doesn't need R2 bindings

Option to proxy instead (for auth or transformation):
```typescript
external: {
  '/assets/protected/files': {
    url: 'https://my-bucket.r2.cloudflarestorage.com/files',
    mode: 'proxy',  // proxy instead of redirect
    // Auth still applies since it's under /protected/
  }
}
```

---

## Convenience Routes

For common files, add convenience routes at root:

```
GET /favicon.ico  → 301 redirect to /assets/public/favicon.ico
GET /robots.txt   → 301 redirect to /assets/public/robots.txt
```

Or serve directly (configurable):
```typescript
assets: {
  rootFiles: {
    '/favicon.ico': '/assets/public/favicon.ico',
    '/robots.txt': '/assets/public/robots.txt',
  }
}
```

---

## MIME Type Handling

Wrangler handles MIME types automatically for static files. For Conductor-intercepted routes (protected assets), use:

```typescript
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
```

---

## Cache Headers

### Public Assets (Default)
```
Cache-Control: public, max-age=31536000, immutable
```
- Cached at edge for 1 year
- `immutable` tells browsers not to revalidate

### Protected Assets
```
Cache-Control: private, max-age=3600
```
- `private` prevents edge caching (auth required)
- Short TTL for browser cache

### Configurable
```typescript
assets: {
  public: {
    cacheControl: 'public, max-age=86400'  // 1 day
  },
  protected: {
    cacheControl: 'private, no-store'  // no caching
  }
}
```

---

## Route Priority

```
Priority 1: Explicit ensemble routes (/api/*, custom paths)
Priority 2: External asset redirects (if configured)
Priority 3: Protected assets (/assets/protected/*) - requires auth
Priority 4: Convenience root files (/favicon.ico, /robots.txt)
Priority 5: Default ensemble routes (/{ensemble-name})
Priority 6: Wrangler static assets (fallback)
```

---

## Configuration Design

### Where Settings Live

Settings are split based on their natural home:

```typescript
// conductor.config.ts
export default {
  // Public assets - top-level since they're project-wide
  assets: {
    /** Cache-Control header. Default: 'public, max-age=31536000, immutable' */
    cacheControl?: string;

    /** External URL mapping (redirect by default) */
    external?: string | {
      url: string;
      mode?: 'redirect' | 'proxy';
    };

    /** Root file mappings. Default: { '/favicon.ico': '...', '/robots.txt': '...' } */
    rootFiles?: Record<string, string>;
  },

  // Protected assets - under api since they use api auth
  api: {
    auth: {
      type: 'bearer',
      // ... existing auth config
    },

    // Protected assets settings (uses auth above)
    protectedAssets: {
      /** Cache-Control header. Default: 'private, max-age=3600' */
      cacheControl?: string;

      /** External URL mapping for protected assets */
      external?: string | {
        url: string;
        mode?: 'redirect' | 'proxy';
      };
    }
  }
} satisfies ConductorConfig;
```

### Why This Split?

| Setting | Location | Rationale |
|---------|----------|-----------|
| Public assets | `assets.*` | Project-wide, no auth dependency |
| Protected assets | `api.protectedAssets.*` | Directly coupled to `api.auth` |

### Example Configurations

**Minimal (defaults):**
```typescript
export default {} satisfies ConductorConfig;
// Public: /assets/public/* → served from assets/public/
// Protected: /assets/protected/* → 404 (no api.auth configured)
```

**With API auth (protected assets enabled):**
```typescript
export default {
  api: {
    auth: { type: 'bearer' }
  }
} satisfies ConductorConfig;
// Protected assets now work at /assets/protected/*
```

**External R2 for both:**
```typescript
export default {
  assets: {
    external: 'https://cdn.example.com/public'
  },
  api: {
    auth: { type: 'apiKey' },
    protectedAssets: {
      external: {
        url: 'https://my-bucket.r2.cloudflarestorage.com/protected',
        mode: 'proxy'  // proxy to apply auth
      }
    }
  }
} satisfies ConductorConfig;
```

---

## TypeScript Types

```typescript
// In conductor config types

interface PublicAssetsConfig {
  /** Cache-Control header. Default: 'public, max-age=31536000, immutable' */
  cacheControl?: string;

  /** External URL to redirect/proxy public assets */
  external?: string | {
    url: string;
    mode?: 'redirect' | 'proxy';
  };

  /** Map root paths to asset paths */
  rootFiles?: Record<string, string>;
}

interface ProtectedAssetsConfig {
  /** Cache-Control header. Default: 'private, max-age=3600' */
  cacheControl?: string;

  /** External URL to redirect/proxy protected assets */
  external?: string | {
    url: string;
    mode?: 'redirect' | 'proxy';
  };
}

interface ApiConfig {
  auth?: AuthConfig;
  /** Protected assets settings (requires auth to be configured) */
  protectedAssets?: ProtectedAssetsConfig;
  // ... existing api config
}

interface ConductorConfig {
  assets?: PublicAssetsConfig;
  api?: ApiConfig;
  // ... existing config
}
```

---

## Implementation Plan

### 1. Template Structure Changes

**Current template structure:**
```
assets/
├── favicon.ico           # → Move to assets/public/
├── styles/
│   ├── reset.css         # → Move to assets/public/styles/
│   └── utilities.css     # → Move to assets/public/styles/
└── README.md             # → Rewrite for new Wrangler-based system
```

**Target structure:**
```
assets/
├── public/                     # /assets/public/* (no auth)
│   ├── favicon.ico             # Moved from assets/
│   ├── robots.txt              # New default
│   ├── images/.gitkeep
│   └── styles/
│       ├── reset.css           # Moved from assets/styles/
│       └── utilities.css       # Moved from assets/styles/
├── protected/                  # /assets/protected/* (API auth)
│   └── .gitkeep
└── README.md                   # Rewritten for Wrangler assets
```

**Tasks:**
- [ ] Create `assets/public/` directory
- [ ] Move `assets/favicon.ico` → `assets/public/favicon.ico`
- [ ] Move `assets/styles/` → `assets/public/styles/`
- [ ] Create `assets/public/robots.txt` (default)
- [ ] Create `assets/public/images/.gitkeep`
- [ ] Create `assets/protected/.gitkeep`
- [ ] Delete old `assets/styles/` directory (after moving)
- [ ] Rewrite `assets/README.md` for Wrangler-based system (see README content below)
- [ ] Update template wrangler.toml (see wrangler.toml changes below)
- [ ] Update existing CSS path references in templates (see path updates below)

### Update Existing CSS Path References

**Files referencing old paths:**

| File | Old Path | New Path |
|------|----------|----------|
| `ensembles/examples/login-page.yaml` | `/assets/styles/reset.css` | `/assets/public/styles/reset.css` |
| `ensembles/examples/dashboard.yaml` | `/assets/styles/reset.css` | `/assets/public/styles/reset.css` |
| `ensembles/examples/dashboard.yaml` | `/assets/styles/utilities.css` | `/assets/public/styles/utilities.css` |

**Changes required:**

```yaml
# login-page.yaml (line 17)
# Before:
<link href="/assets/styles/reset.css" rel="stylesheet">
# After:
<link href="/assets/public/styles/reset.css" rel="stylesheet">

# dashboard.yaml (lines 18-19)
# Before:
<link href="/assets/styles/reset.css" rel="stylesheet">
<link href="/assets/styles/utilities.css" rel="stylesheet">
# After:
<link href="/assets/public/styles/reset.css" rel="stylesheet">
<link href="/assets/public/styles/utilities.css" rel="stylesheet">
```

**Also update comments in dashboard.yaml:**
```yaml
# Before (line 17):
<!-- Global CSS from R2 -->
# After:
<!-- Global CSS -->
```

### Documentation Scan

**Scan `/workspace/ensemble/docs` for `/assets/` path references that need updating.**

**Result:** ✅ No `/assets/styles/` or `/assets/images/` references found in docs.

The R2 documentation in `configuring-cloudflare.mdx` is for **storage operations** (programmatic file uploads/downloads via the storage operation), which is a different use case from static asset serving. That documentation remains valid.

**No docs changes required** for this migration.

### New assets/README.md Content

```markdown
# Static Assets

This directory contains **static assets** served via Cloudflare's [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/).

## Directory Structure

```
assets/
├── public/                 # /assets/public/* (no auth, edge-cached)
│   ├── favicon.ico         # Site favicon
│   ├── robots.txt          # Search engine directives
│   ├── images/             # Public images
│   │   └── logo.svg
│   └── styles/             # Global CSS
│       ├── reset.css       # CSS reset
│       └── utilities.css   # Utility classes
└── protected/              # /assets/protected/* (requires API auth)
    └── reports/            # Auth-protected files
        └── annual-report.pdf
```

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
- `/robots.txt` → `/assets/public/robots.txt`

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
```

### wrangler.toml Changes

The template's `wrangler.toml` needs the `[assets]` configuration added. This should go near the top, after the basic config:

```toml
name = "my-conductor-project"
main = "dist/index.mjs"
compatibility_date = "2025-10-29"
compatibility_flags = ["nodejs_compat"]

# ==================== Static Assets ====================
# Serves files from ./assets at /assets/* URLs
# Public assets: /assets/public/* (no auth, edge-cached)
# Protected assets: /assets/protected/* (requires API auth)
[assets]
directory = "./assets"
run_worker_first = true  # Required: lets Conductor intercept protected assets

# Build configuration for Vite
[build]
command = "pnpm run build"
# ... rest of config
```

**Key points:**
- `directory = "./assets"` tells Wrangler to serve files from the `assets/` folder
- Files at `assets/public/favicon.ico` become accessible at `/assets/public/favicon.ico`
- The optional `binding` allows programmatic access if needed
- R2 binding section should be updated to note it's for external/large assets only

### 2. Conductor Config Types
- [ ] Add `PublicAssetsConfig` interface
- [ ] Add `ProtectedAssetsConfig` interface
- [ ] Add `assets` field to `ConductorConfig`
- [ ] Add `protectedAssets` field to `ApiConfig`
- [ ] Add Zod schemas for validation

### 3. Asset Route Handling
- [ ] Create `src/assets/` module with:
  - [ ] `handler.ts` - Main asset request handler
  - [ ] `mime-types.ts` - MIME type detection
  - [ ] `cache.ts` - Cache header utilities
- [ ] Register `/assets/protected/*` route in Hono app
- [ ] Add auth middleware integration for protected routes
- [ ] Implement external redirect/proxy logic

### 4. Convenience Routes
- [ ] Register `/favicon.ico` redirect route
- [ ] Register `/robots.txt` redirect route
- [ ] Make configurable via `assets.rootFiles`

### 5. Documentation & Testing
- [ ] Update template README (replace old assets/README.md)
- [ ] Test with `ensemble conductor init`
- [ ] Test public asset serving
- [ ] Test protected asset auth flow
- [ ] Test external redirect/proxy modes

---

## Files to Create/Modify

### New Files
```
conductor/packages/conductor/
├── src/assets/
│   ├── index.ts           # Exports
│   ├── handler.ts         # Asset request handler
│   ├── mime-types.ts      # MIME type map
│   └── cache.ts           # Cache header utilities
└── catalog/cloud/cloudflare/templates/
    └── assets/
        ├── public/                    # /assets/public/*
        │   ├── favicon.ico
        │   ├── robots.txt
        │   ├── images/.gitkeep
        │   └── styles/
        │       ├── reset.css
        │       └── utilities.css
        └── protected/                 # /assets/protected/*
            └── .gitkeep
```

### Modified Files
```
conductor/packages/conductor/
├── src/types/config.ts          # Add asset config types
├── src/index.ts                 # Register asset routes
└── catalog/cloud/cloudflare/templates/
    ├── wrangler.toml            # Add [assets] section with directory = "./assets"
    │                            # Update R2 comments to note it's for external/large assets
    └── assets/                  # Restructure (move styles/, images/ under public/)
```

### wrangler.toml Diff Preview

```diff
 name = "my-conductor-project"
 main = "dist/index.mjs"
 compatibility_date = "2025-10-29"
 compatibility_flags = ["nodejs_compat"]

+# ==================== Static Assets ====================
+# Serves files from ./assets at /assets/* URLs
+# Public assets: /assets/public/* (no auth, edge-cached)
+# Protected assets: /assets/protected/* (requires API auth)
+[assets]
+directory = "./assets"
+run_worker_first = true  # Required: lets Conductor intercept protected assets
+
 # Build configuration for Vite
 [build]
 command = "pnpm run build"
 ...

-# R2 for static assets (images, fonts, global CSS)
-# Uncomment when you set up an R2 bucket:
+# R2 for large/external assets (videos, user uploads, large files)
+# For small static assets, use the [assets] directory above instead.
+# Uncomment only when you need R2 for assets exceeding worker size limits (~25MB):
 # [[r2_buckets]]
-# binding = "ASSETS"
+# binding = "R2_ASSETS"
 # bucket_name = "conductor-assets"
```

---

## Migration from Current State

### For Existing Projects

```bash
# 1. Create new structure under assets/
mkdir -p assets/public assets/protected

# 2. Move existing assets into public/
mv assets/styles assets/public/
mv assets/images assets/public/

# 3. Add favicon and robots.txt to assets/public/
# (copy from template or create)

# 4. Update wrangler.toml
# Add: [assets]
#      directory = "./assets"

# 5. Update any hardcoded paths
# /assets/styles/ → /assets/public/styles/
```

### For New Projects

`ensemble conductor init` creates the new structure automatically.

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL structure | `/assets/public/` and `/assets/protected/` | Clear hierarchy, single namespace |
| Wrangler directory | `./assets` | Folder name = URL root, no nesting confusion |
| Config location | `assets.*` for public, `api.protectedAssets.*` for protected | Natural coupling with auth |
| R2 support | External mapping only | Keep Conductor simple, users manage R2 |
| External mode | Redirect by default | Performance, cost savings |
| Root files | Redirect to `/assets/public/` | Single source of truth |

---

## Out of Scope

- Asset transforms (resize, minify) - users can use build tools
- Asset pipeline/bundling - not Conductor's job
- R2 bindings in Conductor - users manage externally
- Edgit versioning for assets - assets are deploy-time, not runtime

---

## References

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- Current assets README: `/conductor/packages/conductor/catalog/cloud/cloudflare/templates/assets/README.md`
