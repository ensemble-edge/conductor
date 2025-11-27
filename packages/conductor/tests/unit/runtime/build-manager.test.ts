/**
 * BuildManager Unit Tests
 *
 * Tests the build trigger management system without requiring Cloudflare services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  BuildManager,
  getBuildManager,
  resetBuildManager,
  type BuildExecutionResult,
} from '../../../src/runtime/build-manager.js'
import type { EnsembleConfig } from '../../../src/runtime/parser.js'

describe('BuildManager', () => {
  let manager: BuildManager

  beforeEach(() => {
    manager = new BuildManager()
  })

  describe('register', () => {
    it('should register ensemble with build trigger', () => {
      const ensemble: EnsembleConfig = {
        name: 'docs-generator',
        trigger: [{ type: 'build', output: './dist/docs' }],
        flow: [{ agent: 'docs', input: { action: 'generate' } }],
      }

      manager.register(ensemble)
      expect(manager.getBuildCount()).toBe(1)
    })

    it('should not register ensemble without build trigger', () => {
      const ensemble: EnsembleConfig = {
        name: 'http-endpoint',
        trigger: [{ type: 'http', path: '/api/test', methods: ['GET'] }],
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getBuildCount()).toBe(0)
    })

    it('should ignore ensembles with empty triggers', () => {
      const ensemble: EnsembleConfig = {
        name: 'no-triggers',
        trigger: [],
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getBuildCount()).toBe(0)
    })

    it('should ignore ensembles with undefined triggers', () => {
      const ensemble: EnsembleConfig = {
        name: 'undefined-triggers',
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getBuildCount()).toBe(0)
    })
  })

  describe('registerAll', () => {
    it('should register multiple ensembles at once', () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'docs-gen',
          trigger: [{ type: 'build', output: './dist/docs' }],
          flow: [{ agent: 'docs', input: {} }],
        },
        {
          name: 'openapi-gen',
          trigger: [{ type: 'build', output: './dist/openapi.json' }],
          flow: [{ agent: 'openapi', input: {} }],
        },
        {
          name: 'http-only',
          trigger: [{ type: 'http', path: '/api', methods: ['GET'] }],
          flow: [{ agent: 'api', input: {} }],
        },
      ]

      manager.registerAll(ensembles)
      expect(manager.getBuildCount()).toBe(2)
    })

    it('should handle empty array', () => {
      manager.registerAll([])
      expect(manager.getBuildCount()).toBe(0)
    })
  })

  describe('listBuildEnsembles', () => {
    it('should list ensembles with build triggers', () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'docs-gen',
          trigger: [{ type: 'build', output: './dist/docs' }],
          flow: [{ agent: 'docs', input: {} }],
        },
        {
          name: 'multi-trigger',
          trigger: [
            { type: 'http', path: '/api', methods: ['GET'] },
            { type: 'build', output: './dist/api' },
          ],
          flow: [{ agent: 'api', input: {} }],
        },
      ]

      manager.registerAll(ensembles)
      const list = manager.listBuildEnsembles()

      expect(list).toHaveLength(2)
      expect(list[0].ensembleName).toBe('docs-gen')
      expect(list[0].triggers).toHaveLength(1)
      expect(list[0].triggers[0].output).toBe('./dist/docs')
    })

    it('should return empty array when no ensembles registered', () => {
      const list = manager.listBuildEnsembles()
      expect(list).toHaveLength(0)
    })
  })

  describe('clear', () => {
    it('should clear all registered ensembles', () => {
      const ensemble: EnsembleConfig = {
        name: 'test',
        trigger: [{ type: 'build', output: './dist' }],
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getBuildCount()).toBe(1)

      manager.clear()
      expect(manager.getBuildCount()).toBe(0)
    })
  })

  describe('getBuildCount', () => {
    it('should return correct count', () => {
      expect(manager.getBuildCount()).toBe(0)

      manager.register({
        name: 'test1',
        trigger: [{ type: 'build' }],
        flow: [{ agent: 'a', input: {} }],
      })
      expect(manager.getBuildCount()).toBe(1)

      manager.register({
        name: 'test2',
        trigger: [{ type: 'build' }],
        flow: [{ agent: 'b', input: {} }],
      })
      expect(manager.getBuildCount()).toBe(2)
    })
  })
})

describe('Global BuildManager', () => {
  beforeEach(() => {
    resetBuildManager()
  })

  it('should return singleton instance', () => {
    const manager1 = getBuildManager()
    const manager2 = getBuildManager()
    expect(manager1).toBe(manager2)
  })

  it('should reset to new instance', () => {
    const manager1 = getBuildManager()
    manager1.register({
      name: 'test',
      trigger: [{ type: 'build' }],
      flow: [{ agent: 'a', input: {} }],
    })
    expect(manager1.getBuildCount()).toBe(1)

    resetBuildManager()

    const manager2 = getBuildManager()
    expect(manager2).not.toBe(manager1)
    expect(manager2.getBuildCount()).toBe(0)
  })
})
