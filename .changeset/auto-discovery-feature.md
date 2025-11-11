---
"@ensemble-edge/conductor": minor
---

Add auto-discovery for pages using Vite + Rolldown

### Breaking Changes
- **Build System**: Now uses Vite with Rolldown bundler for 3x+ faster builds
- **Page Imports**: Pages are auto-discovered at build time - remove manual imports

### New Features
- **Auto-Discovery**: Pages automatically discovered from `pages/` directory
- **Virtual Module**: `virtual:conductor-pages` provides all discovered pages
- **Hot Module Replacement (HMR)**: Instant page updates during development
- **Faster Builds**: Rolldown bundler provides 3-16x faster builds than Rollup
- **Zero Configuration**: No manual page imports or registration needed

### Migration Guide
1. Update dependencies:
   ```bash
   npm install -D vite @cloudflare/vite-plugin rolldown-vite fast-glob
   ```

2. Add `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import { pageDiscoveryPlugin } from './scripts/vite-plugin-page-discovery.js'

   export default defineConfig({
     plugins: [pageDiscoveryPlugin()],
     // ... rest of config
   })
   ```

3. Update `src/index.ts`:
   ```typescript
   // Remove manual imports
   - import indexPageConfigRaw from '../pages/examples/index/page.yaml'
   - import dashboardPageConfigRaw from '../pages/examples/dashboard/page.yaml'

   // Replace with virtual module
   + import { pages as discoveredPages } from 'virtual:conductor-pages'
   ```

4. Update `package.json` scripts:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "dev": "vite dev",
       "deploy": "npm run build && wrangler deploy"
     }
   }
   ```

5. Update `wrangler.toml`:
   ```toml
   main = "dist/index.js"
   [build]
   command = "npm run build"
   watch_dirs = ["src", "pages", "members", "ensembles"]
   ```

### Templates Updated
- Cloudflare Workers template now uses auto-discovery by default
- No manual page imports needed in new projects
