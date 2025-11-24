/**
 * Data Agent Tests
 *
 * Comprehensive tests for Data agent functionality including:
 * - Repository pattern integration
 * - CRUD operations (get, put, delete, list)
 * - Query operations with filtering and sorting
 * - Export functionality (CSV, JSON, NDJSON, Excel)
 * - Streaming exports for large datasets
 * - Multiple storage backends (KV, D1, R2)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataAgent } from '../../data-agent.js'
import type { DataConfig, DataInput } from '../../data-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import type { AgentExecutionContext } from '../../base-agent.js'
import type { Repository, Result, ListOptions, PutOptions } from '../../../storage/repository.js'
import { DatabaseType } from '../../../types/constants.js'

// Mock Repository implementation
class MockRepository implements Repository<unknown, string> {
  private store = new Map<string, { value: unknown; ttl?: number }>()
  public getCallCount = 0
  public putCallCount = 0
  public deleteCallCount = 0
  public listCallCount = 0

  async get(key: string): Promise<Result<unknown, Error>> {
    this.getCallCount++
    const item = this.store.get(key)
    if (!item) {
      return { success: false, error: new Error('Key not found') }
    }
    return { success: true, value: item.value }
  }

  async put(key: string, value: unknown, options?: PutOptions): Promise<Result<void, Error>> {
    this.putCallCount++
    this.store.set(key, { value, ttl: options?.ttl })
    return { success: true, value: undefined }
  }

  async delete(key: string): Promise<Result<void, Error>> {
    this.deleteCallCount++
    const existed = this.store.has(key)
    this.store.delete(key)
    if (!existed) {
      return { success: false, error: new Error('Key not found') }
    }
    return { success: true, value: undefined }
  }

  async list(options?: ListOptions): Promise<Result<unknown[], Error>> {
    this.listCallCount++
    // Return items as flat objects (the value itself, with key merged in)
    // This matches how real repositories work
    let items = Array.from(this.store.entries()).map(([key, data]) => {
      const value = data.value as any
      // Merge key into the value object for query/export operations
      return { ...value, key }
    })

    // Apply prefix filter
    if (options?.prefix) {
      items = items.filter((item) => item.key.startsWith(options.prefix!))
    }

    // Apply limit
    if (options?.limit) {
      items = items.slice(0, options.limit)
    }

    return { success: true, value: items }
  }

  async batch?(operations: any[]): Promise<Result<void, Error>> {
    return { success: true, value: undefined }
  }

  clear(): void {
    this.store.clear()
    this.getCallCount = 0
    this.putCallCount = 0
    this.deleteCallCount = 0
    this.listCallCount = 0
  }
}

describe('DataAgent', () => {
  let mockRepository: MockRepository
  let mockContext: AgentExecutionContext

  beforeEach(() => {
    mockRepository = new MockRepository()
    mockContext = {
      input: {},
      env: {
        CACHE: {},
        DB: {},
        STORAGE: {},
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AgentExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should throw error if storage type is missing', () => {
      const config: AgentConfig = {
        name: 'test-data',
        type: 'Data',
        config: {
          operation: 'get',
        },
      }

      expect(() => new DataAgent(config)).toThrow('requires database type')
    })

    it('should throw error if operation is missing', () => {
      const config: AgentConfig = {
        name: 'test-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
        },
      }

      expect(() => new DataAgent(config)).toThrow('requires operation type')
    })

    it('should accept valid configuration', () => {
      const config: AgentConfig = {
        name: 'test-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
          binding: 'CACHE',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      expect(agent).toBeDefined()
      expect(agent.name).toBe('test-data')
    })
  })

  describe('GET Operation', () => {
    it('should retrieve existing value', async () => {
      const config: AgentConfig = {
        name: 'get-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      // Setup test data
      await mockRepository.put('user:123', { name: 'Alice', age: 30 })

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { key: 'user:123' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.found).toBe(true)
      expect(result.key).toBe('user:123')
      expect(result.value).toEqual({ name: 'Alice', age: 30 })
      expect(mockRepository.getCallCount).toBe(1)
    })

    it('should handle non-existent key', async () => {
      const config: AgentConfig = {
        name: 'get-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { key: 'nonexistent' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.found).toBe(false)
      expect(result.value).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should throw error if key is missing', async () => {
      const config: AgentConfig = {
        name: 'get-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {}

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'GET operation requires "key"'
      )
    })
  })

  describe('PUT Operation', () => {
    it('should store value successfully', async () => {
      const config: AgentConfig = {
        name: 'put-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'put',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        key: 'user:456',
        value: { name: 'Bob', email: 'bob@example.com' },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.key).toBe('user:456')
      expect(mockRepository.putCallCount).toBe(1)

      // Verify data was stored
      const getResult = await mockRepository.get('user:456')
      expect(getResult.success).toBe(true)
      expect(getResult.value).toEqual({ name: 'Bob', email: 'bob@example.com' })
    })

    it('should store with TTL', async () => {
      const config: AgentConfig = {
        name: 'put-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'put',
          ttl: 3600,
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        key: 'session:abc',
        value: { userId: '123' },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
    })

    it('should override config TTL with input TTL', async () => {
      const config: AgentConfig = {
        name: 'put-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'put',
          ttl: 3600,
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        key: 'temp:data',
        value: { temp: true },
        ttl: 60,
      }

      await agent['run']({ ...mockContext, input })
      expect(mockRepository.putCallCount).toBe(1)
    })

    it('should throw error if key or value is missing', async () => {
      const config: AgentConfig = {
        name: 'put-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'put',
        },
      }

      const agent = new DataAgent(config, mockRepository)

      // Missing value
      await expect(agent['run']({ ...mockContext, input: { key: 'test' } })).rejects.toThrow(
        'PUT operation requires "key" and "value"'
      )

      // Missing key
      await expect(agent['run']({ ...mockContext, input: { value: 'data' } })).rejects.toThrow(
        'PUT operation requires "key" and "value"'
      )
    })
  })

  describe('DELETE Operation', () => {
    it('should delete existing key', async () => {
      const config: AgentConfig = {
        name: 'delete-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'delete',
        },
      }

      // Setup test data
      await mockRepository.put('user:789', { name: 'Charlie' })

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { key: 'user:789' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.key).toBe('user:789')
      expect(mockRepository.deleteCallCount).toBe(1)

      // Verify data was deleted
      const getResult = await mockRepository.get('user:789')
      expect(getResult.success).toBe(false)
    })

    it('should handle deleting non-existent key', async () => {
      const config: AgentConfig = {
        name: 'delete-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'delete',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { key: 'nonexistent' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should throw error if key is missing', async () => {
      const config: AgentConfig = {
        name: 'delete-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'delete',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {}

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'DELETE operation requires "key"'
      )
    })
  })

  describe('LIST Operation', () => {
    beforeEach(async () => {
      // Setup test data
      await mockRepository.put('user:1', { name: 'Alice', role: 'admin' })
      await mockRepository.put('user:2', { name: 'Bob', role: 'user' })
      await mockRepository.put('user:3', { name: 'Charlie', role: 'user' })
      await mockRepository.put('product:1', { name: 'Widget', price: 10 })
      await mockRepository.put('product:2', { name: 'Gadget', price: 20 })
    })

    it('should list all items', async () => {
      const config: AgentConfig = {
        name: 'list-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'list',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {}

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(5)
      expect(mockRepository.listCallCount).toBe(1)
    })

    it('should filter by prefix', async () => {
      const config: AgentConfig = {
        name: 'list-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'list',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { prefix: 'user:' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(3)
      expect(result.items.every((item: any) => item.key && item.key.startsWith('user:'))).toBe(true)
    })

    it('should limit results', async () => {
      const config: AgentConfig = {
        name: 'list-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'list',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { limit: 2 }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(2)
    })

    it('should combine prefix and limit', async () => {
      const config: AgentConfig = {
        name: 'list-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'list',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { prefix: 'product:', limit: 1 }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].key && result.items[0].key.includes('product:')).toBe(true)
    })
  })

  describe('QUERY Operation', () => {
    beforeEach(async () => {
      // Setup test data with various properties
      await mockRepository.put('user:1', { name: 'Alice', age: 30, city: 'NYC', active: true })
      await mockRepository.put('user:2', { name: 'Bob', age: 25, city: 'LA', active: true })
      await mockRepository.put('user:3', { name: 'Charlie', age: 35, city: 'NYC', active: false })
      await mockRepository.put('user:4', { name: 'Diana', age: 28, city: 'SF', active: true })
    })

    it('should query with filter', async () => {
      const config: AgentConfig = {
        name: 'query-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'query',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'user:',
        filter: { city: 'NYC' },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(2)
      expect(result.items.every((item: any) => item.city === 'NYC')).toBe(true)
    })

    it('should query with multiple filters', async () => {
      const config: AgentConfig = {
        name: 'query-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'query',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'user:',
        filter: { city: 'NYC', active: true },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Alice')
    })

    it('should sort results ascending', async () => {
      const config: AgentConfig = {
        name: 'query-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'query',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'user:',
        sort: 'age:asc',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items[0].age).toBe(25)
      expect(result.items[result.items.length - 1].age).toBe(35)
    })

    it('should sort results descending', async () => {
      const config: AgentConfig = {
        name: 'query-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'query',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'user:',
        sort: 'age:desc',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items[0].age).toBe(35)
      expect(result.items[result.items.length - 1].age).toBe(25)
    })

    it('should combine filter and sort', async () => {
      const config: AgentConfig = {
        name: 'query-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'query',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'user:',
        filter: { active: true },
        sort: 'age:asc',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.items).toHaveLength(3)
      expect(result.items[0].age).toBe(25) // Bob
      expect(result.items[0].name).toBe('Bob')
    })
  })

  describe('EXPORT Operation', () => {
    beforeEach(async () => {
      // Setup test data for export
      await mockRepository.put('product:1', { id: 1, name: 'Widget', price: 10.99, stock: 50 })
      await mockRepository.put('product:2', { id: 2, name: 'Gadget', price: 25.5, stock: 30 })
      await mockRepository.put('product:3', { id: 3, name: 'Doohickey', price: 15.0, stock: 100 })
    })

    it('should export to JSON format', async () => {
      const config: AgentConfig = {
        name: 'export-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'export',
          exportFormat: 'json',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = { prefix: 'product:' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.streaming).toBe(false)
      expect(result.contentType).toBe('application/json')
      expect(result.extension).toBe('json')
      expect(result.count).toBe(3)

      const data = JSON.parse(result.data)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(3)
    })

    it('should export to CSV format', async () => {
      const config: AgentConfig = {
        name: 'export-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'export',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'product:',
        format: 'csv',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.contentType).toBe('text/csv')
      expect(result.extension).toBe('csv')
      expect(typeof result.data).toBe('string')
      expect(result.data).toContain('id,name,price') // CSV headers
    })

    it('should export to NDJSON format', async () => {
      const config: AgentConfig = {
        name: 'export-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'export',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'product:',
        format: 'ndjson',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.contentType).toBe('application/x-ndjson')
      expect(result.extension).toBe('ndjson')

      const lines = result.data.split('\n').filter((line: string) => line.trim())
      expect(lines).toHaveLength(3)
      lines.forEach((line: string) => {
        expect(() => JSON.parse(line)).not.toThrow()
      })
    })

    it('should use streaming for large datasets', async () => {
      const config: AgentConfig = {
        name: 'export-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'export',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'product:',
        format: 'json',
        streaming: true,
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      expect(result.streaming).toBe(true)
      expect(result.stream).toBeDefined()
      expect(result.contentType).toBe('application/json')
    })

    it('should apply filter before export', async () => {
      const config: AgentConfig = {
        name: 'export-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'export',
        },
      }

      // Add more data with different values
      await mockRepository.put('product:4', { id: 4, name: 'Thingamajig', price: 5.0, stock: 200 })

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'product:',
        filter: { stock: 50 },
        format: 'json',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      const data = JSON.parse(result.data)
      expect(data).toHaveLength(1)
      expect(data[0].stock).toBe(50)
    })

    it('should handle export with custom options', async () => {
      const config: AgentConfig = {
        name: 'export-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'export',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const input: DataInput = {
        prefix: 'product:',
        format: 'json',
        exportOptions: {
          format: 'json',
          pretty: true,
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.success).toBe(true)
      // Pretty JSON should have newlines
      expect(result.data).toContain('\n')
    })
  })

  describe('Storage Backend Integration', () => {
    it('should use default binding name for KV', () => {
      const config: AgentConfig = {
        name: 'kv-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const dataConfig = agent.getDataConfig()
      expect(dataConfig.database).toBe(DatabaseType.D1)
    })

    it('should use custom binding name', () => {
      const config: AgentConfig = {
        name: 'custom-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
          binding: 'MY_CACHE',
        },
      }

      const agent = new DataAgent(config, mockRepository)
      const dataConfig = agent.getDataConfig()
      expect(dataConfig.binding).toBe('MY_CACHE')
    })
  })

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      const errorRepo = new MockRepository()
      vi.spyOn(errorRepo, 'get').mockResolvedValue({
        success: false,
        error: new Error('Connection timeout'),
      })

      const config: AgentConfig = {
        name: 'error-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      const agent = new DataAgent(config, errorRepo)
      const input: DataInput = { key: 'test' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.found).toBe(false)
      expect(result.error).toBe('Connection timeout')
    })

    it('should throw error for unknown operation', async () => {
      const config: AgentConfig = {
        name: 'bad-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'invalid' as any,
        },
      }

      const agent = new DataAgent(config, mockRepository)

      await expect(agent['run']({ ...mockContext, input: {} })).rejects.toThrow('Unknown operation')
    })
  })

  describe('Repository Pattern Integration', () => {
    it('should accept injected repository', async () => {
      const customRepo = new MockRepository()
      await customRepo.put('test:key', { value: 'injected' })

      const config: AgentConfig = {
        name: 'injected-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      const agent = new DataAgent(config, customRepo)
      const input: DataInput = { key: 'test:key' }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as any

      expect(result.found).toBe(true)
      expect(result.value).toEqual({ value: 'injected' })
      expect(customRepo.getCallCount).toBe(1)
    })

    it('should use same repository instance across operations', async () => {
      const config: AgentConfig = {
        name: 'multi-data',
        type: 'Data',
        config: {
          database: DatabaseType.D1,
          operation: 'put',
        },
      }

      const agent = new DataAgent(config, mockRepository)

      // First operation
      await agent['run']({
        ...mockContext,
        input: { key: 'test1', value: 'value1' },
      })

      // Second operation
      await agent['run']({
        ...mockContext,
        input: { key: 'test2', value: 'value2' },
      })

      expect(mockRepository.putCallCount).toBe(2)

      // Verify both values were stored
      const result1 = await mockRepository.get('test1')
      const result2 = await mockRepository.get('test2')
      expect(result1.success && result1.value).toBe('value1')
      expect(result2.success && result2.value).toBe('value2')
    })
  })
})
