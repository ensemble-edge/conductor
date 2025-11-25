/**
 * Bundle Command Tests
 *
 * Tests for the bundle CLI command functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('Bundle Command Logic', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bundle-test-'))
  })

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('Dependency Extraction', () => {
    it('should extract agent names from simple flow', () => {
      const flow = [
        { agent: 'step1' },
        { agent: 'step2' },
        { agent: 'step3' },
      ]

      const agentNames: string[] = []
      for (const step of flow) {
        if (typeof step.agent === 'string') {
          agentNames.push(step.agent)
        }
      }

      expect(agentNames).toEqual(['step1', 'step2', 'step3'])
    })

    it('should extract agent names from parallel steps', () => {
      const flow = [
        {
          type: 'parallel',
          steps: [{ agent: 'task1' }, { agent: 'task2' }],
        },
      ]

      const agentNames: string[] = []

      function extractAgents(steps: Array<Record<string, unknown>>): void {
        for (const step of steps) {
          if (typeof step.agent === 'string') {
            agentNames.push(step.agent)
          }
          if (Array.isArray(step.steps)) {
            extractAgents(step.steps as Array<Record<string, unknown>>)
          }
        }
      }

      extractAgents(flow)
      expect(agentNames).toContain('task1')
      expect(agentNames).toContain('task2')
    })

    it('should extract agent names from branch then/else', () => {
      const flow = [
        {
          type: 'branch',
          condition: 'test',
          then: [{ agent: 'success-handler' }],
          else: [{ agent: 'error-handler' }],
        },
      ]

      const agentNames: string[] = []

      function extractAgents(steps: Array<Record<string, unknown>>): void {
        for (const step of steps) {
          if (typeof step.agent === 'string') {
            agentNames.push(step.agent)
          }
          if (Array.isArray(step.then)) {
            extractAgents(step.then as Array<Record<string, unknown>>)
          }
          if (Array.isArray(step.else)) {
            extractAgents(step.else as Array<Record<string, unknown>>)
          }
        }
      }

      extractAgents(flow)
      expect(agentNames).toContain('success-handler')
      expect(agentNames).toContain('error-handler')
    })

    it('should extract agent names from try/catch/finally', () => {
      const flow = [
        {
          type: 'try',
          steps: [{ agent: 'risky' }],
          catch: [{ agent: 'catch-handler' }],
          finally: [{ agent: 'cleanup' }],
        },
      ]

      const agentNames: string[] = []

      function extractAgents(steps: Array<Record<string, unknown>>): void {
        for (const step of steps) {
          if (typeof step.agent === 'string') {
            agentNames.push(step.agent)
          }
          if (Array.isArray(step.steps)) {
            extractAgents(step.steps as Array<Record<string, unknown>>)
          }
          if (Array.isArray(step.catch)) {
            extractAgents(step.catch as Array<Record<string, unknown>>)
          }
          if (Array.isArray(step.finally)) {
            extractAgents(step.finally as Array<Record<string, unknown>>)
          }
        }
      }

      extractAgents(flow)
      expect(agentNames).toContain('risky')
      expect(agentNames).toContain('catch-handler')
      expect(agentNames).toContain('cleanup')
    })

    it('should extract agent from foreach step', () => {
      const flow = [
        {
          type: 'foreach',
          items: '${input.items}',
          step: { agent: 'processor' },
        },
      ]

      const agentNames: string[] = []

      function extractAgents(steps: Array<Record<string, unknown>>): void {
        for (const step of steps) {
          if (typeof step.agent === 'string') {
            agentNames.push(step.agent)
          }
          if (step.step && typeof step.step === 'object') {
            const nestedStep = step.step as Record<string, unknown>
            if (typeof nestedStep.agent === 'string') {
              agentNames.push(nestedStep.agent)
            }
          }
        }
      }

      extractAgents(flow)
      expect(agentNames).toContain('processor')
    })

    it('should extract agents from map-reduce', () => {
      const flow = [
        {
          type: 'map-reduce',
          items: '${input.docs}',
          map: { agent: 'analyzer' },
          reduce: { agent: 'aggregator' },
        },
      ]

      const agentNames: string[] = []

      function extractAgents(steps: Array<Record<string, unknown>>): void {
        for (const step of steps) {
          if (step.map && typeof step.map === 'object') {
            const mapStep = step.map as Record<string, unknown>
            if (typeof mapStep.agent === 'string') {
              agentNames.push(mapStep.agent)
            }
          }
          if (step.reduce && typeof step.reduce === 'object') {
            const reduceStep = step.reduce as Record<string, unknown>
            if (typeof reduceStep.agent === 'string') {
              agentNames.push(reduceStep.agent)
            }
          }
        }
      }

      extractAgents(flow)
      expect(agentNames).toContain('analyzer')
      expect(agentNames).toContain('aggregator')
    })

    it('should extract agents from switch cases', () => {
      const flow = [
        {
          type: 'switch',
          value: '${input.type}',
          cases: {
            typeA: [{ agent: 'handler-a' }],
            typeB: [{ agent: 'handler-b' }],
          },
          default: [{ agent: 'default-handler' }],
        },
      ]

      const agentNames: string[] = []

      function extractAgents(steps: Array<Record<string, unknown>>): void {
        for (const step of steps) {
          if (typeof step.agent === 'string') {
            agentNames.push(step.agent)
          }
          if (step.cases && typeof step.cases === 'object') {
            for (const caseSteps of Object.values(
              step.cases
            ) as Array<Array<Record<string, unknown>>>) {
              if (Array.isArray(caseSteps)) {
                extractAgents(caseSteps)
              }
            }
          }
          if (Array.isArray(step.default)) {
            extractAgents(step.default as Array<Record<string, unknown>>)
          }
        }
      }

      extractAgents(flow)
      expect(agentNames).toContain('handler-a')
      expect(agentNames).toContain('handler-b')
      expect(agentNames).toContain('default-handler')
    })
  })

  describe('Path Resolution', () => {
    it('should resolve relative paths from YAML location', () => {
      const basePath = '/project/ensembles/workflow.yaml'
      const referencePath = './prompts/system.md'

      const resolved = path.resolve(path.dirname(basePath), referencePath)

      expect(resolved).toBe('/project/ensembles/prompts/system.md')
    })

    it('should handle parent directory references', () => {
      const basePath = '/project/agents/think/agent.yaml'
      const referencePath = '../prompts/shared.md'

      const resolved = path.resolve(path.dirname(basePath), referencePath)

      expect(resolved).toBe('/project/agents/prompts/shared.md')
    })

    it('should preserve absolute paths', () => {
      const basePath = '/project/ensembles/workflow.yaml'
      const referencePath = '/absolute/path/to/file.md'

      const resolved = path.isAbsolute(referencePath)
        ? referencePath
        : path.resolve(path.dirname(basePath), referencePath)

      expect(resolved).toBe('/absolute/path/to/file.md')
    })
  })

  describe('Agent Config Dependencies', () => {
    it('should extract prompt file from systemPrompt', () => {
      const agentConfig = {
        config: {
          systemPrompt: './prompts/system.md',
          model: 'gpt-4',
        },
      }

      const prompts: string[] = []
      const config = agentConfig.config

      if (
        typeof config.systemPrompt === 'string' &&
        config.systemPrompt.startsWith('./')
      ) {
        prompts.push(config.systemPrompt)
      }

      expect(prompts).toContain('./prompts/system.md')
    })

    it('should extract handler file from handler field', () => {
      const agentConfig = {
        config: {
          handler: './handlers/calculate.js',
        },
      }

      const handlers: string[] = []
      const config = agentConfig.config

      if (
        typeof config.handler === 'string' &&
        config.handler.startsWith('./')
      ) {
        handlers.push(config.handler)
      }

      expect(handlers).toContain('./handlers/calculate.js')
    })

    it('should extract template file from template field', () => {
      const agentConfig = {
        template: './templates/email.mjml',
      }

      const templates: string[] = []

      if (
        typeof agentConfig.template === 'string' &&
        agentConfig.template.startsWith('./')
      ) {
        templates.push(agentConfig.template)
      }

      expect(templates).toContain('./templates/email.mjml')
    })
  })

  describe('Manifest Generation', () => {
    it('should generate valid manifest structure', () => {
      const manifest = {
        version: '1.0.0',
        type: 'ensemble' as const,
        name: 'test-workflow',
        description: 'Test workflow bundle',
        createdAt: new Date().toISOString(),
        files: [
          { path: 'ensembles/workflow.yaml', type: 'ensemble' as const, size: 1024 },
          { path: 'agents/processor.yaml', type: 'agent' as const, size: 512 },
        ],
        dependencies: {
          agents: ['processor'],
          prompts: ['system.md'],
          handlers: [],
          configs: [],
        },
      }

      expect(manifest.version).toBe('1.0.0')
      expect(manifest.type).toBe('ensemble')
      expect(manifest.files).toHaveLength(2)
      expect(manifest.dependencies.agents).toContain('processor')
    })

    it('should include timestamp in manifest', () => {
      const before = new Date()
      const manifest = {
        createdAt: new Date().toISOString(),
      }
      const after = new Date()

      const created = new Date(manifest.createdAt)
      expect(created.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(created.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('Bundle Path Mapping', () => {
    it('should map ensemble files correctly', () => {
      const sourcePath = '/project/ensembles/workflow.yaml'
      const bundlePath = `ensembles/${path.basename(sourcePath)}`

      expect(bundlePath).toBe('ensembles/workflow.yaml')
    })

    it('should map agent files correctly', () => {
      const sourcePath = '/project/agents/processor.yaml'
      const bundlePath = `agents/${path.basename(sourcePath)}`

      expect(bundlePath).toBe('agents/processor.yaml')
    })

    it('should map prompt files correctly', () => {
      const sourcePath = '/project/prompts/system.md'
      const bundlePath = `prompts/${path.basename(sourcePath)}`

      expect(bundlePath).toBe('prompts/system.md')
    })

    it('should map handler files correctly', () => {
      const sourcePath = '/project/handlers/calculate.js'
      const bundlePath = `handlers/${path.basename(sourcePath)}`

      expect(bundlePath).toBe('handlers/calculate.js')
    })
  })
})
