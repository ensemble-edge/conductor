import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare(),
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        // External dependencies that shouldn't be bundled
        /^node:.*/,
        'cloudflare:workers',
        'mjml', // Optional dependency - dynamically imported
      ],
      output: {
        preserveModules: false,
        exports: 'named',
      },
    },
    minify: false,
    sourcemap: true,
    target: 'esnext',
  },
  resolve: {
    conditions: ['workerd', 'worker', 'browser'],
    alias: {
      // Force browser builds of libraries that have Node.js-specific code
      // This eliminates the build warnings about Node.js imports
      'liquidjs': 'liquidjs/dist/liquid.browser.mjs',
      // Handlebars runtime-only build (no fs/path dependencies)
      'handlebars': 'handlebars/dist/handlebars.runtime.js',
    },
  },
  optimizeDeps: {
    include: [],
    exclude: ['cloudflare:workers'],
  },
  // Use Rolldown for 3x+ faster builds
  rolldown: {
    output: {
      platform: 'neutral', // CRITICAL: Prevents Node.js-specific code
    },
  },
})
