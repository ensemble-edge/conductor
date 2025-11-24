/**
 * Storage/Data Split Tests
 *
 * Verifies that StorageAgent and DataAgent are correctly separated
 * and handle their respective backend types
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StorageAgent } from '../../src/agents/storage-agent.js'
import { DataAgent } from '../../src/agents/data-agent.js'
import { StorageType, DatabaseType } from '../../src/types/constants.js'
import { Operation } from '../../src/types/operation.js'
import type { AgentConfig } from '../../src/runtime/parser.js'

describe('Storage/Data Split', () => {
  describe('StorageAgent', () => {
    it('should accept KV backend', () => {
      const config: AgentConfig = {
        name: 'test-kv',
        operation: Operation.storage,
        config: {
          backend: StorageType.KV,
          operation: 'get',
        },
      }

      expect(() => new StorageAgent(config)).not.toThrow()
    })

    it('should accept R2 backend', () => {
      const config: AgentConfig = {
        name: 'test-r2',
        operation: Operation.storage,
        config: {
          backend: StorageType.R2,
          operation: 'get',
        },
      }

      expect(() => new StorageAgent(config)).not.toThrow()
    })

    it('should accept Cache backend', () => {
      const config: AgentConfig = {
        name: 'test-cache',
        operation: Operation.storage,
        config: {
          backend: StorageType.Cache,
          operation: 'get',
        },
      }

      expect(() => new StorageAgent(config)).not.toThrow()
    })

    it('should throw error without backend type', () => {
      const config: AgentConfig = {
        name: 'test-invalid',
        operation: Operation.storage,
        config: {
          operation: 'get',
        },
      }

      expect(() => new StorageAgent(config)).toThrow(/requires backend type/)
    })

    it('should throw error without operation', () => {
      const config: AgentConfig = {
        name: 'test-invalid',
        operation: Operation.storage,
        config: {
          backend: StorageType.KV,
        },
      }

      expect(() => new StorageAgent(config)).toThrow(/requires operation type/)
    })
  })

  describe('DataAgent', () => {
    it('should accept D1 database', () => {
      const config: AgentConfig = {
        name: 'test-d1',
        operation: Operation.data,
        config: {
          database: DatabaseType.D1,
          operation: 'get',
        },
      }

      expect(() => new DataAgent(config)).not.toThrow()
    })

    it('should accept Hyperdrive database', () => {
      const config: AgentConfig = {
        name: 'test-hyperdrive',
        operation: Operation.data,
        config: {
          database: DatabaseType.Hyperdrive,
          operation: 'query',
        },
      }

      expect(() => new DataAgent(config)).not.toThrow()
    })

    it('should accept Vectorize database', () => {
      const config: AgentConfig = {
        name: 'test-vectorize',
        operation: Operation.data,
        config: {
          database: DatabaseType.Vectorize,
          operation: 'query',
        },
      }

      expect(() => new DataAgent(config)).not.toThrow()
    })

    it('should throw error without database type', () => {
      const config: AgentConfig = {
        name: 'test-invalid',
        operation: Operation.data,
        config: {
          operation: 'get',
        },
      }

      expect(() => new DataAgent(config)).toThrow(/requires database type/)
    })

    it('should throw error without operation', () => {
      const config: AgentConfig = {
        name: 'test-invalid',
        operation: Operation.data,
        config: {
          database: DatabaseType.D1,
        },
      }

      expect(() => new DataAgent(config)).toThrow(/requires operation type/)
    })
  })

  describe('Type System', () => {
    it('should distinguish Storage and Data operations', () => {
      expect(Operation.storage).toBe('storage')
      expect(Operation.data).toBe('data')
      expect(Operation.storage).not.toBe(Operation.data)
    })

    it('should have correct StorageType values', () => {
      expect(StorageType.KV).toBe('kv')
      expect(StorageType.R2).toBe('r2')
      expect(StorageType.Cache).toBe('cache')
    })

    it('should have correct DatabaseType values', () => {
      expect(DatabaseType.D1).toBe('d1')
      expect(DatabaseType.Hyperdrive).toBe('hyperdrive')
      expect(DatabaseType.Vectorize).toBe('vectorize')
      expect(DatabaseType.Supabase).toBe('supabase')
      expect(DatabaseType.Neon).toBe('neon')
      expect(DatabaseType.PlanetScale).toBe('planetscale')
    })
  })
})
