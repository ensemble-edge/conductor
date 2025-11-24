import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { pageDiscoveryPlugin } from './scripts/vite-plugin-page-discovery'

export default defineConfig({
  plugins: [
    cloudflare(),
    pageDiscoveryPlugin(),
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
