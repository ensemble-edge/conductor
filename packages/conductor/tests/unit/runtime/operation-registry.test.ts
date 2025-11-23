/**
 * Operation Registry Tests
 *
 * Tests for the global operation registry that enables plugin operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  OperationRegistry,
  getOperationRegistry,
  type OperationHandler,
  type OperationContext,
  type OperationConfig,
  type OperationMetadata,
} from '../../../src/runtime/operation-registry.js'

describe('OperationRegistry', () => {
  let registry: OperationRegistry
  let mockContext: OperationContext

  beforeEach(() => {
    registry = OperationRegistry.getInstance()
    registry.reset() // Reset to clean state

    mockContext = {
      env: {} as any,
      ctx: {} as any,
      contextType: 'ensemble',
      data: { test: 'data' },
    }
  })

  afterEach(() => {
    registry.reset()
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = OperationRegistry.getInstance()
      const instance2 = OperationRegistry.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should return same instance via getOperationRegistry()', () => {
      const instance1 = getOperationRegistry()
      const instance2 = getOperationRegistry()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Built-in Operations', () => {
    it('should have fetch-data operation registered', () => {
      expect(registry.has('fetch-data')).toBe(true)
    })

    it('should have transform-data operation registered', () => {
      expect(registry.has('transform-data')).toBe(true)
    })

    it('should have custom-code operation registered', () => {
      expect(registry.has('custom-code')).toBe(true)
    })

    it('should list all built-in operations', () => {
      const operations = registry.list()
      expect(operations).toContain('fetch-data')
      expect(operations).toContain('transform-data')
      expect(operations).toContain('custom-code')
    })
  })

  describe('Custom Operation Registration', () => {
    it('should register a custom operation', () => {
      const handler: OperationHandler = {
        async execute(operation, context) {
          return { result: 'custom' }
        },
      }

      registry.register('custom:test', handler)

      expect(registry.has('custom:test')).toBe(true)
      expect(registry.get('custom:test')).toBe(handler)
    })

    it('should register operation with metadata', () => {
      const handler: OperationHandler = {
        async execute() {
          return {}
        },
      }

      const metadata: OperationMetadata = {
        name: 'test:op',
        description: 'Test operation',
        version: '1.0.0',
        author: '@conductor/test',
        contexts: ['page', 'form'],
        tags: ['test', 'example'],
      }

      registry.register('test:op', handler, metadata)

      const retrievedMetadata = registry.getMetadata('test:op')
      expect(retrievedMetadata).toEqual(metadata)
    })

    it('should warn when overwriting existing operation', () => {
      const handler1: OperationHandler = {
        async execute() {
          return { v: 1 }
        },
      }
      const handler2: OperationHandler = {
        async execute() {
          return { v: 2 }
        },
      }

      const consoleSpy = vi.spyOn(console, 'warn')

      registry.register('dup:op', handler1)
      registry.register('dup:op', handler2)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[OperationRegistry] Overwriting operation: dup:op'
      )
      expect(registry.get('dup:op')).toBe(handler2)
    })
  })

  describe('Operation Discovery', () => {
    beforeEach(() => {
      const pageHandler: OperationHandler = {
        async execute() {
          return {}
        },
      }
      const formHandler: OperationHandler = {
        async execute() {
          return {}
        },
      }
      const universalHandler: OperationHandler = {
        async execute() {
          return {}
        },
      }

      registry.register('page:op', pageHandler, {
        name: 'page:op',
        description: 'Page only',
        contexts: ['page'],
        tags: ['ui'],
      })

      registry.register('form:op', formHandler, {
        name: 'form:op',
        description: 'Form only',
        contexts: ['form'],
        tags: ['ui', 'input'],
      })

      registry.register('universal:op', universalHandler, {
        name: 'universal:op',
        description: 'Works everywhere',
        contexts: ['all'],
        tags: ['data'],
      })
    })

    it('should list operations by context', () => {
      const pageOps = registry.listByContext('page')
      expect(pageOps).toContain('page:op')
      expect(pageOps).toContain('universal:op')
      expect(pageOps).toContain('fetch-data') // Built-in with 'all'
    })

    it('should list operations by tag', () => {
      const uiOps = registry.listByTag('ui')
      expect(uiOps).toContain('page:op')
      expect(uiOps).toContain('form:op')
      expect(uiOps).not.toContain('universal:op')
    })

    it('should list all operations', () => {
      const all = registry.list()
      expect(all).toContain('page:op')
      expect(all).toContain('form:op')
      expect(all).toContain('universal:op')
      expect(all).toContain('fetch-data')
    })
  })

  describe('Operation Execution', () => {
    it('should execute registered operation', async () => {
      const handler: OperationHandler = {
        async execute(operation, context) {
          return {
            input: context.data,
            config: operation.config,
          }
        },
      }

      registry.register('test:exec', handler)

      const operation: OperationConfig = {
        operation: 'test:exec',
        config: { foo: 'bar' },
      }

      const result = await registry.execute(operation, mockContext)

      expect(result).toEqual({
        input: { test: 'data' },
        config: { foo: 'bar' },
      })
    })

    it('should execute operation with custom handler', async () => {
      const customHandler = async (context: OperationContext) => {
        return { custom: true, data: context.data }
      }

      const operation: OperationConfig = {
        operation: 'any:op',
        config: {},
        handler: customHandler,
      }

      const result = await registry.execute(operation, mockContext)

      expect(result).toEqual({
        custom: true,
        data: { test: 'data' },
      })
    })

    it('should throw error for unknown operation', async () => {
      const operation: OperationConfig = {
        operation: 'unknown:op',
        config: {},
      }

      await expect(registry.execute(operation, mockContext)).rejects.toThrow(
        '[OperationRegistry] Unknown operation: unknown:op'
      )
    })

    it('should execute built-in fetch-data operation', async () => {
      const operation: OperationConfig = {
        operation: 'fetch-data',
        config: {
          source: 'payload',
          collection: 'users',
          query: { active: true },
        },
      }

      const result = await registry.execute(operation, mockContext)

      expect(result._mock).toBe(true)
      expect(result.source).toBe('payload')
      expect(result.collection).toBe('users')
    })
  })

  describe('Plugin Use Cases', () => {
    it('should support plasmic plugin pattern', async () => {
      // Simulating @conductor/plasmic plugin
      const plasmicHandler: OperationHandler = {
        async execute(operation, context) {
          const { componentId, props } = operation.config
          return {
            html: `<div data-plasmic="${componentId}">${JSON.stringify(props)}</div>`,
          }
        },
      }

      registry.register('plasmic:render', plasmicHandler, {
        name: 'plasmic:render',
        description: 'Render Plasmic component',
        version: '1.0.0',
        author: '@conductor/plasmic',
        contexts: ['page', 'form'],
        tags: ['ui', 'render', 'visual'],
      })

      const operation: OperationConfig = {
        operation: 'plasmic:render',
        config: {
          componentId: 'hero-section',
          props: { title: 'Welcome' },
        },
      }

      const result = await registry.execute(operation, mockContext)

      expect(result.html).toContain('hero-section')
      expect(result.html).toContain('Welcome')
    })

    it('should support unkey plugin pattern', async () => {
      // Simulating @conductor/unkey plugin
      const unkeyHandler: OperationHandler = {
        async execute(operation, context) {
          const { apiKey } = operation.config
          // Mock API key validation
          const valid = apiKey && apiKey.length > 10
          return { valid, keyId: valid ? 'key_123' : null }
        },
      }

      registry.register('unkey:validate', unkeyHandler, {
        name: 'unkey:validate',
        description: 'Validate API key with Unkey',
        version: '1.0.0',
        author: '@conductor/unkey',
        contexts: ['all'],
        tags: ['auth', 'security', 'validation'],
      })

      const operation: OperationConfig = {
        operation: 'unkey:validate',
        config: {
          apiKey: 'test_key_12345',
        },
      }

      const result = await registry.execute(operation, mockContext)

      expect(result.valid).toBe(true)
      expect(result.keyId).toBe('key_123')
    })
  })

  describe('Registry Management', () => {
    it('should unregister operation', () => {
      const handler: OperationHandler = {
        async execute() {
          return {}
        },
      }

      registry.register('temp:op', handler)
      expect(registry.has('temp:op')).toBe(true)

      const deleted = registry.unregister('temp:op')
      expect(deleted).toBe(true)
      expect(registry.has('temp:op')).toBe(false)
    })

    it('should clear all operations', () => {
      registry.clear()
      expect(registry.list()).toHaveLength(0)
    })

    it('should reset to initial state', () => {
      const handler: OperationHandler = {
        async execute() {
          return {}
        },
      }
      registry.register('custom:op', handler)

      registry.reset()

      expect(registry.has('custom:op')).toBe(false)
      expect(registry.has('fetch-data')).toBe(true) // Built-ins restored
    })
  })

  describe('Context Types', () => {
    it('should work in ensemble context', async () => {
      const handler: OperationHandler = {
        async execute(operation, context) {
          return { contextType: context.contextType }
        },
      }

      registry.register('ctx:test', handler)

      const result = await registry.execute(
        { operation: 'ctx:test', config: {} },
        { ...mockContext, contextType: 'ensemble' }
      )

      expect(result.contextType).toBe('ensemble')
    })

    it('should work in page context', async () => {
      const handler: OperationHandler = {
        async execute(operation, context) {
          return { contextType: context.contextType }
        },
      }

      registry.register('ctx:test2', handler)

      const result = await registry.execute(
        { operation: 'ctx:test2', config: {} },
        { ...mockContext, contextType: 'page' }
      )

      expect(result.contextType).toBe('page')
    })
  })
})
