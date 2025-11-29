/**
 * Zod Schema Validation Tests
 */

import { describe, it, expect } from 'vitest'
import {
  ConductorConfigSchema,
  SecurityConfigOptionsSchema,
  DocsConfigSchema,
  TestingConfigSchema,
  ObservabilityConfigSchema,
  ExecutionConfigSchema,
  StorageConfigSchema,
  validateConfig,
  validateConfigOrThrow,
  formatValidationErrors,
  validateSection,
} from '../schemas.js'

describe('Zod Config Schemas', () => {
  describe('ConductorConfigSchema', () => {
    it('should validate a minimal valid config', () => {
      const config = {}
      const result = ConductorConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should validate a complete valid config', () => {
      const config = {
        name: 'my-project',
        version: '1.0.0',
        security: {
          requireAuth: true,
          allowDirectAgentExecution: false,
          autoPermissions: true,
          productionEnvironments: ['production', 'staging'],
        },
        docs: {
          title: 'My API',
          ui: 'scalar',
          theme: {
            primaryColor: '#3B82F6',
            darkMode: true,
          },
        },
        testing: {
          timeout: 30000,
          environment: 'node',
          coverage: {
            lines: 80,
            functions: 75,
          },
        },
        observability: {
          logging: {
            enabled: true,
            level: 'info',
            format: 'json',
          },
          metrics: {
            enabled: true,
            binding: 'ANALYTICS',
          },
        },
        execution: {
          defaultTimeout: 30000,
          trackHistory: true,
        },
        storage: {
          type: 'filesystem',
          path: './.conductor',
        },
      }

      const result = ConductorConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject invalid config types', () => {
      const config = {
        name: 123, // Should be string
      }
      const result = ConductorConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('SecurityConfigOptionsSchema', () => {
    it('should validate security options', () => {
      const config = {
        requireAuth: true,
        allowDirectAgentExecution: false,
        autoPermissions: true,
        productionEnvironments: ['production', 'prod'],
      }
      const result = SecurityConfigOptionsSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject invalid production environments', () => {
      const config = {
        productionEnvironments: [123], // Should be strings
      }
      const result = SecurityConfigOptionsSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('DocsConfigSchema', () => {
    it('should validate docs config with valid UI framework', () => {
      const configs = ['stoplight', 'redoc', 'swagger', 'scalar', 'rapidoc']
      for (const ui of configs) {
        const result = DocsConfigSchema.safeParse({ ui })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid UI framework', () => {
      const result = DocsConfigSchema.safeParse({ ui: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should validate theme with valid hex color', () => {
      const result = DocsConfigSchema.safeParse({
        theme: { primaryColor: '#3B82F6' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid hex color', () => {
      const result = DocsConfigSchema.safeParse({
        theme: { primaryColor: 'not-a-color' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate AI config', () => {
      const result = DocsConfigSchema.safeParse({
        ai: {
          enabled: true,
          model: '@cf/meta/llama-3.1-8b-instruct',
          provider: 'cloudflare',
          temperature: 0.7,
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid temperature', () => {
      const result = DocsConfigSchema.safeParse({
        ai: { temperature: 1.5 }, // Must be 0-1
      })
      expect(result.success).toBe(false)
    })
  })

  describe('TestingConfigSchema', () => {
    it('should validate coverage thresholds', () => {
      const result = TestingConfigSchema.safeParse({
        coverage: {
          lines: 80,
          functions: 75,
          branches: 70,
          statements: 85,
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject coverage over 100', () => {
      const result = TestingConfigSchema.safeParse({
        coverage: { lines: 150 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative coverage', () => {
      const result = TestingConfigSchema.safeParse({
        coverage: { lines: -10 },
      })
      expect(result.success).toBe(false)
    })

    it('should validate environment', () => {
      const environments = ['node', 'jsdom', 'edge-runtime']
      for (const environment of environments) {
        const result = TestingConfigSchema.safeParse({ environment })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid environment', () => {
      const result = TestingConfigSchema.safeParse({ environment: 'browser' })
      expect(result.success).toBe(false)
    })
  })

  describe('ObservabilityConfigSchema', () => {
    it('should accept boolean logging shorthand', () => {
      const result = ObservabilityConfigSchema.safeParse({
        logging: false,
      })
      expect(result.success).toBe(true)
    })

    it('should accept full logging config', () => {
      const result = ObservabilityConfigSchema.safeParse({
        logging: {
          enabled: true,
          level: 'debug',
          format: 'pretty',
          context: ['requestId', 'executionId'],
          redact: ['password', 'apiKey'],
          events: ['request', 'response', 'agent:start'],
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid log level', () => {
      const result = ObservabilityConfigSchema.safeParse({
        logging: { level: 'verbose' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate metrics config', () => {
      const result = ObservabilityConfigSchema.safeParse({
        metrics: {
          enabled: true,
          binding: 'ANALYTICS',
          track: ['ensemble:execution', 'agent:execution'],
        },
      })
      expect(result.success).toBe(true)
    })

    it('should validate OpenTelemetry config', () => {
      const result = ObservabilityConfigSchema.safeParse({
        opentelemetry: {
          enabled: true,
          endpoint: 'https://api.honeycomb.io',
          headers: { 'x-honeycomb-team': 'my-key' },
          samplingRate: 0.5,
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid sampling rate', () => {
      const result = ObservabilityConfigSchema.safeParse({
        opentelemetry: { samplingRate: 2.0 }, // Must be 0-1
      })
      expect(result.success).toBe(false)
    })
  })

  describe('ExecutionConfigSchema', () => {
    it('should validate execution config', () => {
      const result = ExecutionConfigSchema.safeParse({
        defaultTimeout: 30000,
        trackHistory: true,
        maxHistoryEntries: 1000,
        storeStateSnapshots: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative timeout', () => {
      const result = ExecutionConfigSchema.safeParse({
        defaultTimeout: -1000,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('StorageConfigSchema', () => {
    it('should validate storage types', () => {
      const types = ['filesystem', 'd1', 'kv']
      for (const type of types) {
        const result = StorageConfigSchema.safeParse({ type })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid storage type', () => {
      const result = StorageConfigSchema.safeParse({ type: 'redis' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateConfig helper', () => {
    it('should return success result for valid config', () => {
      const result = validateConfig({ name: 'test' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('test')
      }
    })

    it('should return error result for invalid config', () => {
      const result = validateConfig({ name: 123 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('validateConfigOrThrow helper', () => {
    it('should return validated config for valid input', () => {
      const config = validateConfigOrThrow({ name: 'test' })
      expect(config.name).toBe('test')
    })

    it('should throw for invalid config', () => {
      expect(() => validateConfigOrThrow({ name: 123 })).toThrow()
    })
  })

  describe('formatValidationErrors helper', () => {
    it('should format errors with paths', () => {
      const result = ConductorConfigSchema.safeParse({
        docs: { ui: 'invalid' },
      })

      if (!result.success) {
        const messages = formatValidationErrors(result.error)
        expect(messages.length).toBeGreaterThan(0)
        expect(messages[0]).toContain('docs.ui')
      }
    })
  })

  describe('validateSection helper', () => {
    it('should validate a section independently', () => {
      const result = validateSection(DocsConfigSchema, { title: 'My API' })
      expect(result.success).toBe(true)
    })

    it('should return error for invalid section', () => {
      const result = validateSection(DocsConfigSchema, { ui: 'invalid' })
      expect(result.success).toBe(false)
    })
  })
})
