/**
 * Transform Agent Tests
 *
 * Comprehensive tests for Transform agent functionality including:
 * - Value mode (returning literal values)
 * - Input mode with modifiers (pick, omit, defaults, rename)
 * - Merge mode (combining objects and arrays)
 * - Parse/Format (CSV, TSV, JSONL, XLSX) - Phase 2.5
 * - Array operations (filter, sort, limit, offset) - Phase 3
 * - Data cleaning (trim, compact, dedupe, coerce) - Phase 3
 * - Error handling for invalid configurations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TransformAgent } from '../transform-agent.js'
import type { AgentExecutionContext } from '../../base-agent.js'
import type { AgentConfig } from '../../../runtime/parser.js'

describe('TransformAgent', () => {
  let mockContext: AgentExecutionContext

  beforeEach(() => {
    mockContext = {
      input: {},
      env: {},
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AgentExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should throw error if no mode specified', async () => {
      const config: AgentConfig = {
        name: 'test-transform',
        operation: 'transform',
        config: {},
      }

      const agent = new TransformAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow(
        'transform operation requires one of: config.value, config.input, or config.merge'
      )
    })
  })

  describe('Value Mode', () => {
    it('should return literal string value', async () => {
      const config: AgentConfig = {
        name: 'string-transform',
        operation: 'transform',
        config: {
          value: 'hello world',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe('hello world')
    })

    it('should return literal number value', async () => {
      const config: AgentConfig = {
        name: 'number-transform',
        operation: 'transform',
        config: {
          value: 42,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe(42)
    })

    it('should return literal boolean value', async () => {
      const config: AgentConfig = {
        name: 'boolean-transform',
        operation: 'transform',
        config: {
          value: true,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe(true)
    })

    it('should return null value', async () => {
      const config: AgentConfig = {
        name: 'null-transform',
        operation: 'transform',
        config: {
          value: null,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBeNull()
    })

    it('should return literal object value', async () => {
      const config: AgentConfig = {
        name: 'object-transform',
        operation: 'transform',
        config: {
          value: {
            name: 'Alice',
            email: 'alice@example.com',
            age: 30,
          },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
      })
    })

    it('should return literal array value', async () => {
      const config: AgentConfig = {
        name: 'array-transform',
        operation: 'transform',
        config: {
          value: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Carol' },
          ],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ])
    })

    it('should return nested object value', async () => {
      const config: AgentConfig = {
        name: 'nested-transform',
        operation: 'transform',
        config: {
          value: {
            app: {
              name: 'my-app',
              settings: {
                theme: 'dark',
                notifications: true,
              },
            },
            database: {
              host: 'localhost',
              port: 5432,
            },
          },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({
        app: {
          name: 'my-app',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        database: {
          host: 'localhost',
          port: 5432,
        },
      })
    })

    it('should handle undefined value as no-mode error', async () => {
      const config: AgentConfig = {
        name: 'undefined-transform',
        operation: 'transform',
        config: {
          value: undefined,
        },
      }

      const agent = new TransformAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow('transform operation requires one of')
    })
  })

  describe('Input Mode', () => {
    it('should pass through input unchanged', async () => {
      const config: AgentConfig = {
        name: 'passthrough-transform',
        operation: 'transform',
        config: {
          input: { name: 'Alice', email: 'alice@example.com' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ name: 'Alice', email: 'alice@example.com' })
    })

    it('should apply pick modifier to object', async () => {
      const config: AgentConfig = {
        name: 'pick-transform',
        operation: 'transform',
        config: {
          input: { id: 1, name: 'Alice', email: 'alice@example.com', password: 'secret' },
          pick: ['id', 'name'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, name: 'Alice' })
      expect(result).not.toHaveProperty('email')
      expect(result).not.toHaveProperty('password')
    })

    it('should apply omit modifier to object', async () => {
      const config: AgentConfig = {
        name: 'omit-transform',
        operation: 'transform',
        config: {
          input: { id: 1, name: 'Alice', email: 'alice@example.com', password: 'secret' },
          omit: ['password', 'email'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, name: 'Alice' })
      expect(result).not.toHaveProperty('email')
      expect(result).not.toHaveProperty('password')
    })

    it('should apply defaults modifier to object', async () => {
      const config: AgentConfig = {
        name: 'defaults-transform',
        operation: 'transform',
        config: {
          input: { name: 'Alice' },
          defaults: { status: 'pending', role: 'user' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ name: 'Alice', status: 'pending', role: 'user' })
    })

    it('should not override existing values with defaults', async () => {
      const config: AgentConfig = {
        name: 'defaults-override-transform',
        operation: 'transform',
        config: {
          input: { name: 'Alice', status: 'active' },
          defaults: { status: 'pending', role: 'user' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ name: 'Alice', status: 'active', role: 'user' })
    })

    it('should combine pick and defaults modifiers', async () => {
      const config: AgentConfig = {
        name: 'combined-transform',
        operation: 'transform',
        config: {
          input: { id: 1, name: 'Alice', email: 'alice@example.com', password: 'secret' },
          pick: ['id', 'name', 'status'],
          defaults: { status: 'active' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, name: 'Alice', status: 'active' })
    })

    it('should combine omit and defaults modifiers', async () => {
      const config: AgentConfig = {
        name: 'omit-defaults-transform',
        operation: 'transform',
        config: {
          input: { id: 1, name: 'Alice', password: 'secret' },
          omit: ['password'],
          defaults: { status: 'active' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, name: 'Alice', status: 'active' })
    })

    it('should apply modifiers to array of objects', async () => {
      const config: AgentConfig = {
        name: 'array-modifiers-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice', password: 'secret1' },
            { id: 2, name: 'Bob', password: 'secret2' },
          ],
          omit: ['password'],
          defaults: { status: 'pending' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice', status: 'pending' },
        { id: 2, name: 'Bob', status: 'pending' },
      ])
    })

    it('should handle non-object input without modification', async () => {
      const config: AgentConfig = {
        name: 'primitive-input-transform',
        operation: 'transform',
        config: {
          input: 'just a string',
          pick: ['field'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe('just a string')
    })

    it('should handle pick with non-existent fields gracefully', async () => {
      const config: AgentConfig = {
        name: 'pick-missing-transform',
        operation: 'transform',
        config: {
          input: { id: 1, name: 'Alice' },
          pick: ['id', 'nonexistent', 'missing'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1 })
    })

    it('should handle omit with non-existent fields gracefully', async () => {
      const config: AgentConfig = {
        name: 'omit-missing-transform',
        operation: 'transform',
        config: {
          input: { id: 1, name: 'Alice' },
          omit: ['nonexistent', 'missing'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, name: 'Alice' })
    })
  })

  describe('Rename Modifier (Phase 2)', () => {
    it('should rename fields in object', async () => {
      const config: AgentConfig = {
        name: 'rename-transform',
        operation: 'transform',
        config: {
          input: { user_id: 1, display_name: 'Alice' },
          rename: { user_id: 'id', display_name: 'name' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, name: 'Alice' })
    })

    it('should rename fields in array of objects', async () => {
      const config: AgentConfig = {
        name: 'rename-array-transform',
        operation: 'transform',
        config: {
          input: [
            { user_id: 1, display_name: 'Alice' },
            { user_id: 2, display_name: 'Bob' },
          ],
          rename: { user_id: 'id', display_name: 'name' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
    })

    it('should combine rename with pick', async () => {
      const config: AgentConfig = {
        name: 'rename-pick-transform',
        operation: 'transform',
        config: {
          input: { user_id: 1, display_name: 'Alice', extra: 'field' },
          rename: { user_id: 'id' },
          pick: ['id', 'display_name'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: 1, display_name: 'Alice' })
    })
  })

  describe('Merge Mode', () => {
    it('should merge multiple objects', async () => {
      const config: AgentConfig = {
        name: 'merge-objects-transform',
        operation: 'transform',
        config: {
          merge: [{ name: 'Alice' }, { email: 'alice@example.com' }, { age: 30 }],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
      })
    })

    it('should override with later values in merge', async () => {
      const config: AgentConfig = {
        name: 'merge-override-transform',
        operation: 'transform',
        config: {
          merge: [
            { name: 'Alice', status: 'pending' },
            { status: 'active' },
            { name: 'Alice Johnson' },
          ],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({
        name: 'Alice Johnson',
        status: 'active',
      })
    })

    it('should concatenate arrays in merge mode', async () => {
      const config: AgentConfig = {
        name: 'merge-arrays-transform',
        operation: 'transform',
        config: {
          merge: [[{ id: 1, name: 'Alice' }], [{ id: 2, name: 'Bob' }], [{ id: 3, name: 'Carol' }]],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ])
    })

    it('should handle single item in merge', async () => {
      const config: AgentConfig = {
        name: 'merge-single-transform',
        operation: 'transform',
        config: {
          merge: [{ name: 'Alice' }],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ name: 'Alice' })
    })

    it('should throw error for empty merge array', async () => {
      const config: AgentConfig = {
        name: 'merge-empty-transform',
        operation: 'transform',
        config: {
          merge: [],
        },
      }

      const agent = new TransformAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow(
        'transform merge mode requires a non-empty array'
      )
    })

    it('should return first item for non-mergeable primitives', async () => {
      const config: AgentConfig = {
        name: 'merge-primitives-transform',
        operation: 'transform',
        config: {
          merge: ['first', 'second', 'third'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBe('first')
    })

    it('should skip non-object items when merging objects', async () => {
      const config: AgentConfig = {
        name: 'merge-mixed-transform',
        operation: 'transform',
        config: {
          merge: [
            { name: 'Alice' },
            'ignored string',
            { email: 'alice@example.com' },
            123,
            { age: 30 },
          ],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
      })
    })
  })

  describe('CSV Parse/Format (Phase 2.5)', () => {
    it('should parse CSV string to array of objects', async () => {
      const config: AgentConfig = {
        name: 'parse-csv-transform',
        operation: 'transform',
        config: {
          input: 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com',
          parse: 'csv',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ])
    })

    it('should format array of objects to CSV', async () => {
      const config: AgentConfig = {
        name: 'format-csv-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
          ],
          format: 'csv',
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('id,name,email')
      expect(result).toContain('1,Alice,alice@example.com')
      expect(result).toContain('2,Bob,bob@example.com')
    })

    it('should format with specific columns', async () => {
      const config: AgentConfig = {
        name: 'format-csv-columns-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice', email: 'alice@example.com', password: 'secret' },
            { id: 2, name: 'Bob', email: 'bob@example.com', password: 'secret2' },
          ],
          format: 'csv',
          columns: ['id', 'name', 'email'],
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('id,name,email')
      expect(result).not.toContain('password')
      expect(result).not.toContain('secret')
    })

    it('should handle empty CSV', async () => {
      const config: AgentConfig = {
        name: 'parse-empty-csv-transform',
        operation: 'transform',
        config: {
          input: '',
          parse: 'csv',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([])
    })
  })

  describe('TSV Parse/Format (Phase 2.5)', () => {
    it('should parse TSV string to array of objects', async () => {
      const config: AgentConfig = {
        name: 'parse-tsv-transform',
        operation: 'transform',
        config: {
          input: 'id\tname\temail\n1\tAlice\talice@example.com\n2\tBob\tbob@example.com',
          parse: 'tsv',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ])
    })

    it('should format array of objects to TSV', async () => {
      const config: AgentConfig = {
        name: 'format-tsv-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
          format: 'tsv',
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('id\tname')
      expect(result).toContain('1\tAlice')
      expect(result).toContain('2\tBob')
    })
  })

  describe('JSONL Parse/Format (Phase 2.5)', () => {
    it('should parse JSONL string to array of objects', async () => {
      const config: AgentConfig = {
        name: 'parse-jsonl-transform',
        operation: 'transform',
        config: {
          input: '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}',
          parse: 'jsonl',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
    })

    it('should format array of objects to JSONL', async () => {
      const config: AgentConfig = {
        name: 'format-jsonl-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
          format: 'jsonl',
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as string

      const lines = result.split('\n')
      expect(JSON.parse(lines[0])).toEqual({ id: 1, name: 'Alice' })
      expect(JSON.parse(lines[1])).toEqual({ id: 2, name: 'Bob' })
    })

    it('should throw error for invalid JSONL', async () => {
      const config: AgentConfig = {
        name: 'parse-invalid-jsonl-transform',
        operation: 'transform',
        config: {
          input: '{"id":1}\n{invalid json}',
          parse: 'jsonl',
        },
      }

      const agent = new TransformAgent(config)
      await expect(agent['run'](mockContext)).rejects.toThrow('JSONL parse error at line 2')
    })
  })

  describe('Filter (Phase 3)', () => {
    it('should filter by truthy field value', async () => {
      const config: AgentConfig = {
        name: 'filter-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice', active: true },
            { id: 2, name: 'Bob', active: false },
            { id: 3, name: 'Carol', active: true },
          ],
          filter: 'active',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice', active: true },
        { id: 3, name: 'Carol', active: true },
      ])
    })

    it('should filter with null/undefined values', async () => {
      const config: AgentConfig = {
        name: 'filter-null-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: null },
            { id: 3, name: 'Carol', email: undefined },
            { id: 4, name: 'Dave', email: 'dave@example.com' },
          ],
          filter: 'email',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 4, name: 'Dave', email: 'dave@example.com' },
      ])
    })
  })

  describe('Sort (Phase 3)', () => {
    it('should sort by string field ascending', async () => {
      const config: AgentConfig = {
        name: 'sort-asc-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 3, name: 'Carol' },
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
          sort: { by: 'name', order: 'asc' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ])
    })

    it('should sort by number field descending', async () => {
      const config: AgentConfig = {
        name: 'sort-desc-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, score: 75 },
            { id: 2, score: 90 },
            { id: 3, score: 82 },
          ],
          sort: { by: 'score', order: 'desc' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 2, score: 90 },
        { id: 3, score: 82 },
        { id: 1, score: 75 },
      ])
    })

    it('should handle null values in sort', async () => {
      const config: AgentConfig = {
        name: 'sort-null-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Bob' },
            { id: 2, name: null },
            { id: 3, name: 'Alice' },
          ],
          sort: { by: 'name', order: 'asc' },
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as Array<{ id: number; name: string | null }>

      // Null values should be last
      expect(result[2].name).toBeNull()
      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe('Bob')
    })
  })

  describe('Limit and Offset (Phase 3)', () => {
    it('should limit results', async () => {
      const config: AgentConfig = {
        name: 'limit-transform',
        operation: 'transform',
        config: {
          input: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          limit: 3,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })

    it('should offset results', async () => {
      const config: AgentConfig = {
        name: 'offset-transform',
        operation: 'transform',
        config: {
          input: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          offset: 2,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }])
    })

    it('should combine offset and limit', async () => {
      const config: AgentConfig = {
        name: 'offset-limit-transform',
        operation: 'transform',
        config: {
          input: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          offset: 1,
          limit: 2,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([{ id: 2 }, { id: 3 }])
    })
  })

  describe('Trim (Phase 3)', () => {
    it('should trim whitespace from string fields', async () => {
      const config: AgentConfig = {
        name: 'trim-transform',
        operation: 'transform',
        config: {
          input: [
            { name: '  Alice  ', email: ' alice@example.com ' },
            { name: 'Bob ', email: '  bob@example.com' },
          ],
          trim: true,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ])
    })

    it('should not affect non-string fields', async () => {
      const config: AgentConfig = {
        name: 'trim-nonstring-transform',
        operation: 'transform',
        config: {
          input: { name: '  Alice  ', age: 30, active: true },
          trim: true,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ name: 'Alice', age: 30, active: true })
    })
  })

  describe('Compact (Phase 3)', () => {
    it('should remove null and undefined values', async () => {
      const config: AgentConfig = {
        name: 'compact-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice', email: null, phone: undefined },
            { id: 2, name: 'Bob', email: 'bob@example.com', phone: null },
          ],
          compact: true,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ])
    })
  })

  describe('Dedupe (Phase 3)', () => {
    it('should dedupe by specific field', async () => {
      const config: AgentConfig = {
        name: 'dedupe-field-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, email: 'alice@example.com' },
            { id: 2, email: 'bob@example.com' },
            { id: 3, email: 'alice@example.com' },
            { id: 4, email: 'carol@example.com' },
          ],
          dedupe: 'email',
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, email: 'alice@example.com' },
        { id: 2, email: 'bob@example.com' },
        { id: 4, email: 'carol@example.com' },
      ])
    })

    it('should dedupe by full object value', async () => {
      const config: AgentConfig = {
        name: 'dedupe-full-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 1, name: 'Alice' },
            { id: 3, name: 'Carol' },
          ],
          dedupe: true,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ])
    })
  })

  describe('Coerce (Phase 3)', () => {
    it('should coerce string to number', async () => {
      const config: AgentConfig = {
        name: 'coerce-number-transform',
        operation: 'transform',
        config: {
          input: [
            { id: '1', name: 'Alice', score: '95.5' },
            { id: '2', name: 'Bob', score: '82' },
          ],
          coerce: { id: 'number', score: 'number' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, name: 'Alice', score: 95.5 },
        { id: 2, name: 'Bob', score: 82 },
      ])
    })

    it('should coerce string to boolean', async () => {
      const config: AgentConfig = {
        name: 'coerce-boolean-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, active: 'true' },
            { id: 2, active: 'false' },
            { id: 3, active: '1' },
            { id: 4, active: 'yes' },
          ],
          coerce: { active: 'boolean' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true },
        { id: 4, active: true },
      ])
    })

    it('should coerce to string', async () => {
      const config: AgentConfig = {
        name: 'coerce-string-transform',
        operation: 'transform',
        config: {
          input: { id: 123, active: true, score: 95.5 },
          coerce: { id: 'string', active: 'string', score: 'string' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ id: '123', active: 'true', score: '95.5' })
    })

    it('should coerce to date', async () => {
      const config: AgentConfig = {
        name: 'coerce-date-transform',
        operation: 'transform',
        config: {
          input: { created: '2024-01-15' },
          coerce: { created: 'date' },
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as { created: Date }

      expect(result.created).toBeInstanceOf(Date)
      expect(result.created.getFullYear()).toBe(2024)
    })

    it('should handle invalid date coercion', async () => {
      const config: AgentConfig = {
        name: 'coerce-invalid-date-transform',
        operation: 'transform',
        config: {
          input: { created: 'not-a-date' },
          coerce: { created: 'date' },
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as { created: Date | null }

      expect(result.created).toBeNull()
    })
  })

  describe('Combined Operations (Phase 3)', () => {
    it('should parse CSV, filter, sort, and limit', async () => {
      const config: AgentConfig = {
        name: 'combined-pipeline-transform',
        operation: 'transform',
        config: {
          input:
            'id,name,score,active\n1,Alice,85,true\n2,Bob,72,false\n3,Carol,95,true\n4,Dave,88,true',
          parse: 'csv',
          filter: 'active',
          sort: { by: 'score', order: 'desc' },
          limit: 2,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([
        { id: 3, name: 'Carol', score: 95, active: true },
        { id: 4, name: 'Dave', score: 88, active: true },
      ])
    })

    it('should clean data and export to CSV', async () => {
      const config: AgentConfig = {
        name: 'clean-export-transform',
        operation: 'transform',
        config: {
          input: [
            { id: 1, name: '  Alice  ', email: 'alice@example.com', temp: null },
            { id: 2, name: 'Bob ', email: 'bob@example.com', temp: undefined },
          ],
          trim: true,
          compact: true,
          omit: ['temp'],
          format: 'csv',
          columns: ['id', 'name', 'email'],
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as string

      expect(result).toContain('id,name,email')
      expect(result).toContain('1,Alice,alice@example.com')
      expect(result).toContain('2,Bob,bob@example.com')
      expect(result).not.toContain('temp')
    })
  })

  describe('Mode Priority', () => {
    it('should prioritize value mode over input mode', async () => {
      const config: AgentConfig = {
        name: 'priority-value-transform',
        operation: 'transform',
        config: {
          value: { fromValue: true },
          input: { fromInput: true },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ fromValue: true })
    })

    it('should prioritize value mode over merge mode', async () => {
      const config: AgentConfig = {
        name: 'priority-value-merge-transform',
        operation: 'transform',
        config: {
          value: { fromValue: true },
          merge: [{ fromMerge: true }],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ fromValue: true })
    })

    it('should prioritize merge mode over input mode', async () => {
      const config: AgentConfig = {
        name: 'priority-merge-input-transform',
        operation: 'transform',
        config: {
          merge: [{ fromMerge: true }],
          input: { fromInput: true },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ fromMerge: true })
    })
  })

  describe('Runtime Config Override', () => {
    it('should allow runtime config to override static config', async () => {
      const config: AgentConfig = {
        name: 'override-transform',
        operation: 'transform',
        config: {
          value: { static: true },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run']({
        ...mockContext,
        config: {
          value: { runtime: true },
        },
      })

      expect(result).toEqual({ runtime: true })
    })

    it('should merge runtime config with static config', async () => {
      const config: AgentConfig = {
        name: 'merge-config-transform',
        operation: 'transform',
        config: {
          input: { name: 'Alice', email: 'alice@example.com' },
          defaults: { status: 'pending' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run']({
        ...mockContext,
        config: {
          omit: ['email'],
        },
      })

      expect(result).toEqual({ name: 'Alice', status: 'pending' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty object input', async () => {
      const config: AgentConfig = {
        name: 'empty-object-transform',
        operation: 'transform',
        config: {
          input: {},
          defaults: { status: 'new' },
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual({ status: 'new' })
    })

    it('should handle empty array input', async () => {
      const config: AgentConfig = {
        name: 'empty-array-transform',
        operation: 'transform',
        config: {
          input: [],
          omit: ['password'],
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toEqual([])
    })

    it('should handle deeply nested objects in value mode', async () => {
      const config: AgentConfig = {
        name: 'deep-nested-transform',
        operation: 'transform',
        config: {
          value: {
            level1: {
              level2: {
                level3: {
                  level4: {
                    value: 'deep',
                  },
                },
              },
            },
          },
        },
      }

      const agent = new TransformAgent(config)
      const result = (await agent['run'](mockContext)) as Record<string, unknown>

      expect((result as any).level1.level2.level3.level4.value).toBe('deep')
    })

    it('should handle null input in input mode', async () => {
      const config: AgentConfig = {
        name: 'null-input-transform',
        operation: 'transform',
        config: {
          input: null,
        },
      }

      const agent = new TransformAgent(config)
      const result = await agent['run'](mockContext)

      expect(result).toBeNull()
    })
  })
})
