import { defineConfig, Plugin } from 'vite'
import { pageDiscoveryPlugin } from './scripts/vite-plugin-page-discovery.js'
import { docsDiscoveryPlugin } from './scripts/vite-plugin-docs-discovery.js'
import * as fs from 'node:fs'

// Plugin to load YAML files as raw text
function yamlRawPlugin(): Plugin {
  return {
    name: 'yaml-raw',
    transform(code, id) {
      if (id.endsWith('.yaml') || id.endsWith('.yml')) {
        // Load as raw string
        const content = fs.readFileSync(id, 'utf-8')
        return {
          code: `export default ${JSON.stringify(content)}`,
          map: null,
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    yamlRawPlugin(),
    pageDiscoveryPlugin(),
    docsDiscoveryPlugin(), // Auto-discover docs/ markdown files
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
  assetsInclude: ['**/*.yaml', '**/*.yml'],
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
