#!/usr/bin/env node
/**
 * Page Directory Watcher
 *
 * Watches pages/ directory and touches src/index.ts when changes occur
 * to trigger Vite rebuild. Workaround for Wrangler not supporting watch_dirs.
 */

import { watch } from 'node:fs'
import { utimes } from 'node:fs/promises'
import { resolve } from 'node:path'

const pagesDir = resolve(process.cwd(), 'pages')
const srcIndex = resolve(process.cwd(), 'src/index.ts')

console.log('👀 Watching pages/ directory for changes...')

let debounceTimer = null

watch(pagesDir, { recursive: true }, async (eventType, filename) => {
  if (!filename || filename.includes('node_modules') || filename.startsWith('.')) return

  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    console.log(`\n📄 Page change: ${filename}`)
    console.log('🔄 Triggering rebuild...')
    try {
      await utimes(srcIndex, new Date(), new Date())
      console.log('✅ Rebuild triggered')
    } catch (error) {
      console.error('❌ Failed:', error.message)
    }
  }, 100)
})

process.on('SIGINT', () => {
  console.log('\n\n👋 Stopped watching')
  process.exit(0)
})
