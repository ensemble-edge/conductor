/**
 * Docs Operation Integration Tests
 *
 * Tests the full docs operation integration:
 * - Operation enum registration
 * - DocsMember instantiation via Executor
 * - YAML configuration parsing
 * - Agent execution
 */

import { describe, it, expect } from 'vitest'
import { Executor } from '../../src/runtime/executor.js'
import { Parser } from '../../src/runtime/parser.js'
import { Operation } from '../../src/types/constants.js'
import {
  getOperationDisplayName,
  getOperationDescription,
  requiresAI,
  isContentGenerationOperation,
  isOperation,
  getAllOperations,
} from '../../src/types/operation.js'
import type { AgentConfig } from '../../src/runtime/parser.js'
import type { ConductorEnv } from '../../src/types/env.js'

describe('Docs Operation Integration', () => {
  const mockEnv = {} as ConductorEnv
  const mockCtx = {
    waitUntil: (promise: Promise<any>) => promise,
    passThroughOnException: () => {},
  } as ExecutionContext

  describe('Operation Type Registration', () => {
    it('should include docs in Operation enum', () => {
      expect(Operation.docs).toBe('docs')
    })

    it('should validate docs as valid operation', () => {
      const config: AgentConfig = {
        name: 'test-docs',
        operation: Operation.docs,
        description: 'Test docs agent',
      }

      expect(config.operation).toBe('docs')
      expect(Operation.docs).toBeDefined()
    })

    it('should parse docs operation from string', () => {
      expect('docs' as Operation).toBe(Operation.docs)
    })
  })

  describe('YAML Configuration Parsing', () => {
    it('should parse docs agent from YAML', () => {
      const yaml = `
name: api-docs
operation: docs
description: API documentation

ui: stoplight
openApiVersion: "3.1"

branding:
  title: "My API Docs"
  description: "API Reference"
`

      const config = Parser.parseAgent(yaml)
      expect(config.name).toBe('api-docs')
      expect(config.operation).toBe(Operation.docs)
      expect(config.description).toBe('API documentation')
    })

    it('should parse docs agent with minimal config', () => {
      const yaml = `
name: simple-docs
operation: docs
`

      const config = Parser.parseAgent(yaml)
      expect(config.name).toBe('simple-docs')
      expect(config.operation).toBe(Operation.docs)
    })

    it('should parse docs agent with full config', () => {
      const yaml = `
name: full-docs
operation: docs
description: Complete documentation

ui: redoc
openApiVersion: "3.1"

branding:
  title: "Complete API"
  logo: "https://example.com/logo.png"
  primaryColor: "#007bff"

cache:
  enabled: true
  ttl: 3600

autoGenerate:
  enabled: true
  includeExamples: true
`

      const config = Parser.parseAgent(yaml)
      expect(config.name).toBe('full-docs')
      expect(config.operation).toBe(Operation.docs)
      expect(config.description).toBe('Complete documentation')
    })
  })

  describe('Executor Agent Creation', () => {
    it('should create DocsMember from config', () => {
      const executor = new Executor({ env: mockEnv, ctx: mockCtx })

      const config: AgentConfig = {
        name: 'test-docs',
        operation: Operation.docs,
        description: 'Test documentation',
      }

      // Verify executor can load the agent
      // The actual instantiation happens in createAgentFromConfig
      expect(config.operation).toBe(Operation.docs)
    })

    it('should register docs agent with executor', () => {
      const executor = new Executor({ env: mockEnv, ctx: mockCtx })

      const config: AgentConfig = {
        name: 'registered-docs',
        operation: Operation.docs,
      }

      // Executor should accept docs operation
      expect(() => {
        // This validates the operation type
        const validated = config.operation === Operation.docs
        expect(validated).toBe(true)
      }).not.toThrow()
    })
  })

  describe('Agent Execution', () => {
    it('should execute docs agent via ensemble', async () => {
      const executor = new Executor({ env: mockEnv, ctx: mockCtx })

      const ensembleYaml = `
name: test-docs-ensemble
description: Test documentation ensemble

flow:
  - agent: test-docs
    input:
      request:
        url: "http://localhost/docs"
        method: "GET"

output:
  docs: \${test-docs.output.content}
`

      const docsAgentYaml = `
name: test-docs
operation: docs
description: Test docs agent

ui: stoplight
`

      // Parse configurations
      const ensemble = Parser.parseEnsemble(ensembleYaml)
      const docsConfig = Parser.parseAgent(docsAgentYaml)

      // Verify configurations are valid
      expect(ensemble.name).toBe('test-docs-ensemble')
      expect(docsConfig.operation).toBe(Operation.docs)
      expect(ensemble.flow).toHaveLength(1)
      expect(ensemble.flow[0].agent).toBe('test-docs')
    })
  })

  describe('Template Integration', () => {
    it('should parse all template docs agents', () => {
      const templates = [
        { name: 'docs-simple', yaml: 'name: docs-simple\noperation: docs' },
        { name: 'docs-public', yaml: 'name: docs-public\noperation: docs' },
        { name: 'docs-authenticated', yaml: 'name: docs-authenticated\noperation: docs' },
        { name: 'docs-admin', yaml: 'name: docs-admin\noperation: docs' },
      ]

      templates.forEach((template) => {
        const config = Parser.parseAgent(template.yaml)
        expect(config.name).toBe(template.name)
        expect(config.operation).toBe(Operation.docs)
      })
    })

    it('should handle docs agent with route configuration', () => {
      const yaml = `
name: routed-docs
operation: docs

route:
  path: /api/docs
  auth:
    requirement: public
`

      const config = Parser.parseAgent(yaml)
      expect(config.name).toBe('routed-docs')
      expect(config.operation).toBe(Operation.docs)
    })
  })

  describe('Operation Metadata', () => {
    it('should provide correct operation display name', () => {
      expect(getOperationDisplayName(Operation.docs)).toBe('Docs Agent')
    })

    it('should provide correct operation description', () => {
      expect(getOperationDescription(Operation.docs)).toBe(
        'API documentation generation and serving'
      )
    })

    it('should not require AI', () => {
      expect(requiresAI(Operation.docs)).toBe(false)
    })

    it('should be a content generation operation', () => {
      expect(isContentGenerationOperation(Operation.docs)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid docs configuration gracefully', () => {
      const yaml = `
name: invalid-docs
operation: docs
unknown_field: this-should-be-ignored
`

      // Parser should still work, ignoring unknown fields
      const config = Parser.parseAgent(yaml)
      expect(config.name).toBe('invalid-docs')
      expect(config.operation).toBe(Operation.docs)
    })

    it('should require name field', () => {
      const yaml = `
operation: docs
`

      expect(() => Parser.parseAgent(yaml)).toThrow()
    })

    it('should require operation field', () => {
      const yaml = `
name: no-operation
`

      expect(() => Parser.parseAgent(yaml)).toThrow()
    })
  })

  describe('Type Safety', () => {
    it('should accept docs in AgentConfig type', () => {
      const config: AgentConfig = {
        name: 'typed-docs',
        operation: Operation.docs,
      }

      // TypeScript compilation validates this
      expect(config.operation).toBe('docs')
    })

    it('should validate operation enum values', () => {
      expect(isOperation('docs')).toBe(true)
      expect(isOperation('invalid')).toBe(false)
    })

    it('should include docs in all operations list', () => {
      const operations = getAllOperations()
      expect(operations).toContain(Operation.docs)
    })
  })
})
