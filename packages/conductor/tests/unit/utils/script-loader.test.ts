/**
 * Script Loader Unit Tests
 *
 * Tests for the script-loader utility that resolves script:// URIs
 * to pre-bundled handler functions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  parseScriptURI,
  isScriptReference,
  createScriptLoader,
  setGlobalScriptLoader,
  getGlobalScriptLoader,
  hasGlobalScriptLoader,
  type ScriptHandler,
} from '../../../src/utils/script-loader'

describe('Script Loader', () => {
  describe('parseScriptURI', () => {
    it('should parse full URI format: script://path', () => {
      expect(parseScriptURI('script://transforms/csv')).toBe('transforms/csv')
      expect(parseScriptURI('script://health-check')).toBe('health-check')
      expect(parseScriptURI('script://utils/format-date')).toBe('utils/format-date')
    })

    it('should parse shorthand format: scripts/path', () => {
      expect(parseScriptURI('scripts/transforms/csv')).toBe('transforms/csv')
      expect(parseScriptURI('scripts/health-check')).toBe('health-check')
      expect(parseScriptURI('scripts/utils/format-date')).toBe('utils/format-date')
    })

    it('should strip version suffix', () => {
      expect(parseScriptURI('script://transforms/csv@v1.0.0')).toBe('transforms/csv')
      expect(parseScriptURI('scripts/health-check@v2.1.0')).toBe('health-check')
      expect(parseScriptURI('scripts/auth/verify@latest')).toBe('auth/verify')
    })

    it('should handle deeply nested paths', () => {
      expect(parseScriptURI('script://a/b/c/d/e')).toBe('a/b/c/d/e')
      expect(parseScriptURI('scripts/a/b/c/d/e')).toBe('a/b/c/d/e')
    })

    it('should throw on invalid format', () => {
      expect(() => parseScriptURI('invalid')).toThrow('Invalid script reference')
      expect(() => parseScriptURI('script:/missing-slash')).toThrow('Invalid script reference')
      expect(() => parseScriptURI('./relative/path')).toThrow('Invalid script reference')
      expect(() => parseScriptURI('/absolute/path')).toThrow('Invalid script reference')
    })

    it('should throw on empty path', () => {
      expect(() => parseScriptURI('script://')).toThrow('empty path')
      expect(() => parseScriptURI('scripts/')).toThrow('empty path')
    })

    it('should include helpful error message with examples', () => {
      try {
        parseScriptURI('bad-format')
      } catch (error) {
        expect((error as Error).message).toContain('Expected formats:')
        expect((error as Error).message).toContain('script://transforms/csv')
        expect((error as Error).message).toContain('scripts/transforms/csv')
      }
    })
  })

  describe('isScriptReference', () => {
    it('should return true for valid script references', () => {
      expect(isScriptReference('script://transforms/csv')).toBe(true)
      expect(isScriptReference('scripts/transforms/csv')).toBe(true)
      expect(isScriptReference('script://health-check')).toBe(true)
      expect(isScriptReference('scripts/health-check@v1.0.0')).toBe(true)
    })

    it('should return false for non-script references', () => {
      expect(isScriptReference('prompt://greeting')).toBe(false)
      expect(isScriptReference('query://users')).toBe(false)
      expect(isScriptReference('template://email')).toBe(false)
      expect(isScriptReference('./local/path')).toBe(false)
      expect(isScriptReference('')).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isScriptReference(null)).toBe(false)
      expect(isScriptReference(undefined)).toBe(false)
      expect(isScriptReference(123)).toBe(false)
      expect(isScriptReference({})).toBe(false)
      expect(isScriptReference([])).toBe(false)
    })
  })

  describe('createScriptLoader', () => {
    let scriptsMap: Map<string, ScriptHandler>

    beforeEach(() => {
      scriptsMap = new Map<string, ScriptHandler>([
        ['health-check', () => ({ status: 'ok' })],
        ['transforms/csv', (ctx) => ({ csv: 'data', input: ctx.input })],
        ['transforms/json', (ctx) => ({ json: ctx.input })],
        ['utils/format-date', () => ({ date: new Date().toISOString() })],
      ])
    })

    describe('resolve', () => {
      it('should resolve scripts from full URI format', () => {
        const loader = createScriptLoader(scriptsMap)

        const handler = loader.resolve('script://health-check')
        expect(handler).toBeDefined()
        expect(handler({} as any)).toEqual({ status: 'ok' })
      })

      it('should resolve scripts from shorthand format', () => {
        const loader = createScriptLoader(scriptsMap)

        const handler = loader.resolve('scripts/health-check')
        expect(handler).toBeDefined()
        expect(handler({} as any)).toEqual({ status: 'ok' })
      })

      it('should resolve nested scripts', () => {
        const loader = createScriptLoader(scriptsMap)

        const csvHandler = loader.resolve('script://transforms/csv')
        const jsonHandler = loader.resolve('scripts/transforms/json')

        expect(csvHandler({ input: { data: 'test' } } as any)).toMatchObject({ csv: 'data' })
        expect(jsonHandler({ input: { key: 'value' } } as any)).toEqual({ json: { key: 'value' } })
      })

      it('should strip version when resolving', () => {
        const loader = createScriptLoader(scriptsMap)

        const handler = loader.resolve('scripts/health-check@v1.0.0')
        expect(handler).toBeDefined()
        expect(handler({} as any)).toEqual({ status: 'ok' })
      })

      it('should throw helpful error when script not found', () => {
        const loader = createScriptLoader(scriptsMap)

        expect(() => loader.resolve('script://nonexistent')).toThrow('Script not found')
        expect(() => loader.resolve('script://nonexistent')).toThrow('nonexistent')
        expect(() => loader.resolve('script://nonexistent')).toThrow('Available scripts')
      })

      it('should list available scripts in error message', () => {
        const loader = createScriptLoader(scriptsMap)

        try {
          loader.resolve('script://missing')
        } catch (error) {
          expect((error as Error).message).toContain('health-check')
          expect((error as Error).message).toContain('transforms/csv')
        }
      })
    })

    describe('has', () => {
      it('should return true for existing scripts', () => {
        const loader = createScriptLoader(scriptsMap)

        expect(loader.has('script://health-check')).toBe(true)
        expect(loader.has('scripts/transforms/csv')).toBe(true)
        expect(loader.has('scripts/utils/format-date@v1.0.0')).toBe(true)
      })

      it('should return false for non-existing scripts', () => {
        const loader = createScriptLoader(scriptsMap)

        expect(loader.has('script://nonexistent')).toBe(false)
        expect(loader.has('scripts/missing')).toBe(false)
      })

      it('should return false for invalid URIs', () => {
        const loader = createScriptLoader(scriptsMap)

        expect(loader.has('invalid')).toBe(false)
        expect(loader.has('')).toBe(false)
      })
    })

    describe('list', () => {
      it('should return all script names', () => {
        const loader = createScriptLoader(scriptsMap)

        const scripts = loader.list()
        expect(scripts).toContain('health-check')
        expect(scripts).toContain('transforms/csv')
        expect(scripts).toContain('transforms/json')
        expect(scripts).toContain('utils/format-date')
        expect(scripts).toHaveLength(4)
      })

      it('should return empty array for empty map', () => {
        const loader = createScriptLoader(new Map())

        expect(loader.list()).toEqual([])
      })
    })
  })

  describe('Global Script Loader', () => {
    let originalLoader: ReturnType<typeof createScriptLoader> | null

    beforeEach(() => {
      // Save any existing global loader
      originalLoader = hasGlobalScriptLoader() ? getGlobalScriptLoader() : null
    })

    afterEach(() => {
      // Restore original loader if there was one
      if (originalLoader) {
        setGlobalScriptLoader(originalLoader)
      }
    })

    it('should set and get global script loader', () => {
      const scriptsMap = new Map<string, ScriptHandler>([['test-script', () => 'test']])
      const loader = createScriptLoader(scriptsMap)

      setGlobalScriptLoader(loader)

      expect(hasGlobalScriptLoader()).toBe(true)
      expect(getGlobalScriptLoader()).toBe(loader)
    })
  })
})
