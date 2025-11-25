/**
 * Script Loader Utility
 *
 * Resolves script URIs to pre-bundled handler functions.
 * This approach avoids `new Function()` which is blocked in Cloudflare Workers.
 *
 * Supports two URI formats (consistent with other component protocols):
 * - Full URI: "script://transforms/csv" or "script://transforms/csv@v1.0.0"
 * - Shorthand: "script/transforms/csv" or "script/transforms/csv@v1.0.0"
 *
 * Scripts are discovered at build time by vite-plugin-script-discovery and
 * bundled into a scriptsMap that can be passed to this loader.
 *
 * @example
 * ```typescript
 * import { scriptsMap } from 'virtual:conductor-scripts'
 * import { createScriptLoader } from './utils/script-loader'
 *
 * const loader = createScriptLoader(scriptsMap)
 * const handler = loader.resolve('script://transforms/csv')
 * // or: loader.resolve('script/transforms/csv')
 * const result = await handler(context)
 * ```
 */

import type { AgentExecutionContext } from '../agents/base-agent.js'

/**
 * Script handler function signature
 * Same as agent handlers - receives full execution context
 */
export type ScriptHandler = (context: AgentExecutionContext) => Promise<unknown> | unknown

/**
 * Script loader for resolving script:// URIs to bundled handlers
 */
export interface ScriptLoader {
  /**
   * Resolve a script:// URI to its handler function
   * @param uri - Script URI (e.g., "script://transforms/csv")
   * @returns The handler function
   * @throws Error if script not found in bundle
   */
  resolve(uri: string): ScriptHandler

  /**
   * Check if a script exists in the bundle
   * @param uri - Script URI
   * @returns true if script is bundled
   */
  has(uri: string): boolean

  /**
   * Get all available script names
   * @returns Array of script names (without script:// prefix)
   */
  list(): string[]
}

/**
 * Parse a script reference to extract the script name
 *
 * Supports multiple formats (consistent with other component protocols):
 * - Full URI: "script://transforms/csv" or "script://transforms/csv@v1.0.0"
 * - Shorthand: "scripts/transforms/csv" or "scripts/transforms/csv@v1.0.0"
 *
 * @example
 * parseScriptURI('script://transforms/csv') // returns 'transforms/csv'
 * parseScriptURI('scripts/transforms/csv') // returns 'transforms/csv'
 * parseScriptURI('scripts/health-check@v1.0.0') // returns 'health-check'
 */
export function parseScriptURI(uri: string): string {
  let pathWithVersion: string

  // Handle full URI format: script://path[@version]
  if (uri.startsWith('script://')) {
    pathWithVersion = uri.slice('script://'.length)
  }
  // Handle shorthand format: scripts/path[@version]
  else if (uri.startsWith('scripts/')) {
    pathWithVersion = uri.slice('scripts/'.length)
  }
  // Invalid format
  else {
    throw new Error(
      `Invalid script reference: ${uri}\n` +
        `Expected formats:\n` +
        `  - script://transforms/csv (full URI)\n` +
        `  - scripts/transforms/csv (shorthand)\n` +
        `  - scripts/transforms/csv@v1.0.0 (with version)\n` +
        `Examples:\n` +
        `  - script://validators/email\n` +
        `  - scripts/health-check\n` +
        `  - scripts/auth/verify-token@v1.0.0`
    )
  }

  // Remove version suffix if present (versioning handled by edgit, not at runtime)
  const [path] = pathWithVersion.split('@')

  if (!path) {
    throw new Error(`Script reference has empty path: ${uri}`)
  }

  return path
}

/**
 * Check if a string is a script reference
 * @param value - The value to check
 * @returns true if it's a script reference (script:// or scripts/)
 */
export function isScriptReference(value: unknown): value is string {
  return (
    typeof value === 'string' && (value.startsWith('script://') || value.startsWith('scripts/'))
  )
}

/**
 * Create a script loader from a Map of bundled scripts
 *
 * @param scriptsMap - Map from script name to handler function
 *                     (typically from virtual:conductor-scripts)
 * @returns ScriptLoader instance
 */
export function createScriptLoader(scriptsMap: Map<string, ScriptHandler>): ScriptLoader {
  return {
    resolve(uri: string): ScriptHandler {
      const scriptName = parseScriptURI(uri)
      const handler = scriptsMap.get(scriptName)

      if (!handler) {
        const available = Array.from(scriptsMap.keys())
        const suggestions =
          available.length > 0 ? `\nAvailable scripts:\n  - ${available.join('\n  - ')}` : ''

        throw new Error(
          `Script not found: ${uri}\n` +
            `Script "${scriptName}" is not in the bundle.\n` +
            `Make sure you have a file at scripts/${scriptName}.ts with a default export.` +
            suggestions
        )
      }

      return handler
    },

    has(uri: string): boolean {
      try {
        const scriptName = parseScriptURI(uri)
        return scriptsMap.has(scriptName)
      } catch {
        return false
      }
    },

    list(): string[] {
      return Array.from(scriptsMap.keys())
    },
  }
}

/**
 * Global script loader instance
 * Set this during application initialization with bundled scripts
 */
let globalScriptLoader: ScriptLoader | null = null

/**
 * Set the global script loader
 * Call this during app initialization with the bundled scriptsMap
 *
 * @example
 * ```typescript
 * import { scriptsMap } from 'virtual:conductor-scripts'
 * import { setGlobalScriptLoader, createScriptLoader } from '@ensemble-edge/conductor'
 *
 * setGlobalScriptLoader(createScriptLoader(scriptsMap))
 * ```
 */
export function setGlobalScriptLoader(loader: ScriptLoader): void {
  globalScriptLoader = loader
}

/**
 * Get the global script loader
 * @throws Error if not initialized
 */
export function getGlobalScriptLoader(): ScriptLoader {
  if (!globalScriptLoader) {
    throw new Error(
      'Script loader not initialized.\n' +
        'Call setGlobalScriptLoader() during app initialization:\n' +
        '\n' +
        "  import { scriptsMap } from 'virtual:conductor-scripts'\n" +
        "  import { setGlobalScriptLoader, createScriptLoader } from '@ensemble-edge/conductor'\n" +
        '\n' +
        '  setGlobalScriptLoader(createScriptLoader(scriptsMap))'
    )
  }
  return globalScriptLoader
}

/**
 * Check if a global script loader is available
 */
export function hasGlobalScriptLoader(): boolean {
  return globalScriptLoader !== null
}
