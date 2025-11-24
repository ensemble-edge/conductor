# Development Guide

This guide covers local development workflows, troubleshooting, and best practices for working with Conductor.

## Production Builds (CI/CD)

For automated deployments, none of the watch mode complexity matters:

```bash
# CI/CD pipeline - just build and deploy
pnpm run build   # Vite plugin scans pages/ and generates everything
pnpm run deploy  # Deploys to Cloudflare Workers
```

**The Vite plugin automatically:**
- ✅ Scans entire pages/ directory at build time
- ✅ Discovers all page.yaml files
- ✅ Imports all handlers
- ✅ Generates the virtual module with all pages
- ✅ Works perfectly in automated builds

**No manual intervention needed** - the plugin is designed for zero-config CI/CD deployment.

## Local Development

### Starting the Development Server

**Always use:**
```bash
ppnpm run dev
```

**Why not `wrangler dev` directly?**

The `ppnpm run dev` command runs two processes in parallel:
1. `node scripts/watch-pages.js` - Watches the `pages/` directory for changes
2. `vite dev` - Runs the Vite development server with HMR

This is necessary due to a known limitation in Wrangler's watch mode.

### Watch Mode Limitations

**Note:** This ONLY affects local development with live reload. Production builds and CI/CD are completely unaffected.

Wrangler's `watch_dirs` configuration has a known limitation: **it only detects changes to existing files, not new files being added**. This is a limitation of the underlying esbuild watch mode that Wrangler uses.

**What this means:**
- ✅ Modifying existing pages triggers rebuild automatically
- ✅ Modifying handlers in existing pages triggers rebuild automatically
- ❌ Adding new page directories does NOT trigger rebuild
- ❌ Adding new page.yaml files does NOT trigger rebuild

**The Solution:**

The `watch-pages.js` script solves this by:
1. Watching the entire `pages/` directory recursively
2. When it detects any change (including new files), it touches `src/index.ts`
3. Touching `src/index.ts` triggers Wrangler's watch mode
4. Wrangler rebuilds and the new page is discovered

### How the Vite Plugin Works

The Vite plugin (`scripts/vite-plugin-page-discovery.ts`) provides:

1. **Virtual Module Generation**: Creates `virtual:conductor-pages` at build time by scanning the `pages/` directory
2. **HMR Support**: The `handleHotUpdate` hook invalidates the virtual module when pages change
3. **Automatic Imports**: Discovers and imports handler functions automatically

**When using `vite dev` (via `pnpm run dev`):**
- The HMR works perfectly for modifying existing pages
- The watch-pages.js script handles new file detection
- You get instant feedback on changes

**When using `wrangler dev` directly:**
- You lose the watch-pages.js automatic detection
- You have to manually touch `src/index.ts` when adding new pages
- Not recommended for active development

## Working with Pages

### Adding a New Page

When you add a new page:

```bash
# Create new page directory
mkdir -p pages/blog/post

# Create page configuration
cat > pages/blog/post/page.yaml << 'EOF'
name: blog-post
type: Page
description: Blog post page with dynamic routing

# ... rest of config
EOF
```

**With `ppnpm run dev` running:**
- ✅ The watch-pages.js script detects the new files
- ✅ Automatically touches src/index.ts
- ✅ Wrangler rebuilds
- ✅ Your new page is available immediately

**With `wrangler dev` running:**
- ❌ Wrangler doesn't detect the new files
- ❌ Your page won't be available
- 🔧 You must manually run: `touch src/index.ts`

### Modifying Existing Pages

When you modify an existing page.yaml or handler.ts:

**With either `ppnpm run dev` or `wrangler dev`:**
- ✅ Changes are detected automatically
- ✅ Rebuild happens automatically
- ✅ No manual intervention needed

## Understanding the Development Scripts

### watch-pages.js

Located at `scripts/watch-pages.js`, this script:

```javascript
// Watches pages/ directory recursively
watch(pagesDir, { recursive: true }, async (eventType, filename) => {
  // Debounces changes (100ms)
  // Touches src/index.ts to trigger Wrangler rebuild
  await utimes(srcIndex, new Date(), new Date())
})
```

**Why it works:**
- Wrangler's `watch_dirs` includes `src/`
- Touching `src/index.ts` updates its modification time
- Wrangler sees the change and rebuilds
- During rebuild, the Vite plugin re-scans pages/ and discovers new pages

### vite-plugin-page-discovery.ts

Located at `scripts/vite-plugin-page-discovery.ts`, this plugin:

1. **Scans** the pages/ directory for `page.yaml` files
2. **Checks** for corresponding `handler.ts` files
3. **Generates** import statements for all handlers
4. **Creates** a virtual module with the pagesMap
5. **Watches** for changes and invalidates the module for HMR

**Key features:**
- Proper relative import paths with `./` prefix (fixed in v1.4.1)
- Embeds YAML config content directly (no runtime YAML parsing)
- Supports both Vite dev server and production builds

## Troubleshooting

### Browser Compatibility Warnings During Build

**Symptom:** You see many warnings like `"Module X externalized for browser compatibility"` during `pnpm run build`.

**This is expected behavior!** These warnings appear because:
- Cloudflare Workers runtime handles Node.js modules differently than browsers
- Vite externalizes these modules to prevent bundling issues
- The warnings don't indicate any problems with your code

**Why they're suppressed:**
The template's `vite.config.ts` includes an `onwarn` handler that silences these warnings to keep build output clean:

```typescript
rollupOptions: {
  onwarn(warning, warn) {
    // Silence browser compatibility warnings (expected for Workers)
    if (warning.message?.includes('externalized for browser')) return;
    warn(warning);
  }
}
```

If you see other types of warnings, those will still be shown and should be investigated.

### New Page Not Appearing

**Symptom:** You created a new page but it's not showing up when you visit the route.

**Solutions:**
1. Check if you're using `ppnpm run dev` (not `wrangler dev`)
2. Look for console output: `📄 Page change: your-page/page.yaml`
3. If not using `ppnpm run dev`, manually run: `touch src/index.ts`
4. Check for errors in the page.yaml syntax

### Handler Import Errors

**Symptom:** Build fails with "failed to resolve import" error for handler.ts files.

**Solutions:**
1. Ensure you're on Conductor v1.4.1 or later (import path fix)
2. Check that handler.ts is in the same directory as page.yaml
3. Verify handler.ts exports default function or has named exports

### Watch Mode Not Working

**Symptom:** Changes to pages aren't triggering rebuilds.

**Solutions:**
1. Stop the dev server
2. Kill any lingering node processes: `pkill -f watch-pages`
3. Restart with `ppnpm run dev`
4. Check that watch-pages.js has execute permissions

### Build Succeeds but Pages Don't Work

**Symptom:** Build completes but pages return 404 or don't render.

**Common causes:**
1. Page name in page.yaml doesn't match directory convention
2. Handler function signature is incorrect
3. Missing template engine dependency

**Debug steps:**
```bash
# Check what pages were discovered
pnpm run build
grep "Auto-generated by vite-plugin-page-discovery" dist/index.mjs -A 20

# Test the ensemble endpoint
curl http://localhost:8787/api/v1/pages

# Check logs
ppnpm run dev  # Look for page registration messages
```

## Alternative Development Workflows

### Using Vite Dev Only (No Wrangler)

For faster iteration without Cloudflare-specific features:

```bash
# Terminal 1: Watch pages
node scripts/watch-pages.js

# Terminal 2: Vite dev server
npx vite dev
```

This gives you:
- ✅ Faster startup (no Wrangler overhead)
- ✅ Full HMR support
- ✅ Automatic page detection
- ❌ No Cloudflare bindings (KV, D1, etc.)
- ❌ No Workers AI

### Using Wrangler with Manual Reload

If you prefer `wrangler dev` and don't mind manual reloads:

```bash
# Terminal 1: Wrangler dev
wrangler dev

# Terminal 2: When you add new pages
touch src/index.ts
```

## References

- [Wrangler Watch Mode Issue](https://github.com/cloudflare/workers-sdk/issues/5351)
- [Vite Plugin API - handleHotUpdate](https://vitejs.dev/guide/api-plugin.html#handlehotupdate)
- [Node.js fs.watch](https://nodejs.org/api/fs.html#fswatchfilename-options-listener)
