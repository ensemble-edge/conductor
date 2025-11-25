import { describe, it, expect, beforeEach } from 'vitest'
import { EnsembleLoader } from '../ensemble-loader'
import { createEnsemble, Ensemble, isEnsemble } from '../../primitives/ensemble'
import { step } from '../../primitives/step'
import { parallel } from '../../primitives/flow'

const mockEnv = {} as Env
const mockCtx = {} as ExecutionContext

describe('EnsembleLoader', () => {
  let loader: EnsembleLoader

  beforeEach(() => {
    loader = new EnsembleLoader({
      env: mockEnv,
      ctx: mockCtx,
    })
  })

  describe('autoDiscover', () => {
    it('should discover and register ensembles from virtual module', async () => {
      const discoveredEnsembles = [
        {
          name: 'hello-world',
          config: `name: hello-world
description: A simple workflow
flow:
  - step: greet
    agent: hello`,
        },
      ]

      await loader.autoDiscover(discoveredEnsembles)

      expect(loader.hasEnsemble('hello-world')).toBe(true)
      expect(loader.getEnsembleNames()).toContain('hello-world')
    })

    it('should handle multiple ensembles', async () => {
      const discoveredEnsembles = [
        {
          name: 'workflow1',
          config: `name: workflow1
flow:
  - step: step1
    agent: agent1`,
        },
        {
          name: 'workflow2',
          config: `name: workflow2
flow:
  - step: step2
    agent: agent2`,
        },
        {
          name: 'workflow3',
          config: `name: workflow3
flow:
  - step: step3
    agent: agent3`,
        },
      ]

      await loader.autoDiscover(discoveredEnsembles)

      expect(loader.getEnsembleNames()).toHaveLength(3)
      expect(loader.getEnsembleNames()).toEqual(
        expect.arrayContaining(['workflow1', 'workflow2', 'workflow3'])
      )
    })

    it('should continue on error for individual ensembles', async () => {
      const discoveredEnsembles = [
        {
          name: 'valid-ensemble',
          config: `name: valid-ensemble
flow:
  - step: test
    agent: test-agent`,
        },
        {
          name: 'invalid-ensemble',
          config: 'invalid yaml: [[[',
        },
        {
          name: 'another-valid',
          config: `name: another-valid
flow:
  - step: test2
    agent: test-agent2`,
        },
      ]

      await loader.autoDiscover(discoveredEnsembles)

      expect(loader.hasEnsemble('valid-ensemble')).toBe(true)
      expect(loader.hasEnsemble('another-valid')).toBe(true)
      expect(loader.hasEnsemble('invalid-ensemble')).toBe(false)
    })

    it('should handle empty discovered ensembles array', async () => {
      await loader.autoDiscover([])
      expect(loader.getEnsembleNames()).toHaveLength(0)
    })

    it('should handle complex ensemble configurations', async () => {
      const discoveredEnsembles = [
        {
          name: 'complex-workflow',
          config: `name: complex-workflow
description: Complex workflow with triggers
state:
  schema:
    count: number
  initial:
    count: 0
trigger:
  - type: webhook
    path: /workflow
    methods: [POST]
    public: true
  - type: cron
    cron: "0 9 * * *"
flow:
  - step: initialize
    agent: init-agent
  - step: process
    agent: process-agent
    loop:
      items: "{{state.items}}"
  - step: finalize
    agent: final-agent`,
        },
      ]

      await loader.autoDiscover(discoveredEnsembles)

      const ensemble = loader.getEnsemble('complex-workflow')
      expect(ensemble).toBeDefined()
      expect(ensemble?.name).toBe('complex-workflow')
      expect(ensemble?.flow).toHaveLength(3)
      expect(ensemble?.trigger).toHaveLength(2)
    })
  })

  describe('registerEnsemble', () => {
    it('should register ensemble from YAML string', () => {
      const yaml = `name: test-ensemble
description: Test
flow:
  - step: test
    agent: test-agent`

      const config = loader.registerEnsemble(yaml)
      expect(config.name).toBe('test-ensemble')
      expect(loader.hasEnsemble('test-ensemble')).toBe(true)
    })

    it('should register ensemble from config object', () => {
      const config = {
        name: 'test-ensemble',
        description: 'Test',
        flow: [
          {
            step: 'test-step',
            agent: 'test-agent',
          },
        ],
      }

      const result = loader.registerEnsemble(config as any)
      expect(result.name).toBe('test-ensemble')
      expect(loader.hasEnsemble('test-ensemble')).toBe(true)
    })
  })

  describe('getEnsemble', () => {
    it('should return undefined for non-existent ensemble', () => {
      expect(loader.getEnsemble('nonexistent')).toBeUndefined()
    })

    it('should return ensemble config for registered ensemble', () => {
      const yaml = `name: test-ensemble
flow:
  - step: test
    agent: test-agent`

      loader.registerEnsemble(yaml)
      const ensemble = loader.getEnsemble('test-ensemble')
      expect(ensemble).toBeDefined()
      expect(ensemble?.name).toBe('test-ensemble')
    })
  })

  describe('getAllEnsembles', () => {
    it('should return empty array initially', () => {
      expect(loader.getAllEnsembles()).toHaveLength(0)
    })

    it('should return all registered ensembles', () => {
      loader.registerEnsemble(`name: ensemble1\nflow:\n  - step: test1\n    agent: agent1`)
      loader.registerEnsemble(`name: ensemble2\nflow:\n  - step: test2\n    agent: agent2`)

      const ensembles = loader.getAllEnsembles()
      expect(ensembles).toHaveLength(2)
      expect(ensembles.map((e) => e.name)).toEqual(
        expect.arrayContaining(['ensemble1', 'ensemble2'])
      )
    })
  })

  describe('clear', () => {
    it('should clear all registered ensembles', () => {
      loader.registerEnsemble(`name: ensemble1\nflow:\n  - step: test\n    agent: agent1`)
      expect(loader.getEnsembleNames()).toHaveLength(1)

      loader.clear()
      expect(loader.getEnsembleNames()).toHaveLength(0)
    })
  })

  // =========================================================================
  // TypeScript Ensemble Instance Tests
  // =========================================================================

  describe('registerEnsembleInstance', () => {
    it('should register a TypeScript ensemble created via createEnsemble', () => {
      const tsEnsemble = createEnsemble({
        name: 'ts-pipeline',
        steps: [
          step('fetch-data', { operation: 'http' }),
          step('transform', { script: 'scripts/transform' }),
        ],
      })

      const result = loader.registerEnsembleInstance(tsEnsemble)

      expect(result).toBe(tsEnsemble)
      expect(loader.hasEnsemble('ts-pipeline')).toBe(true)
      expect(loader.getEnsembleInstance('ts-pipeline')).toBe(tsEnsemble)
    })

    it('should throw error for non-Ensemble values', () => {
      const notAnEnsemble = { name: 'fake', steps: [] }

      expect(() => loader.registerEnsembleInstance(notAnEnsemble as any)).toThrow(
        'registerEnsembleInstance expects an Ensemble instance'
      )
    })

    it('should store source as typescript', () => {
      const tsEnsemble = createEnsemble({
        name: 'ts-source-test',
        steps: [step('test')],
      })

      loader.registerEnsembleInstance(tsEnsemble)

      const loaded = loader.getLoadedEnsemble('ts-source-test')
      expect(loaded?.source).toBe('typescript')
    })

    it('should register ensemble with triggers', () => {
      const tsEnsemble = createEnsemble({
        name: 'triggered-ensemble',
        steps: [step('handler')],
        trigger: [
          {
            type: 'http',
            path: '/api/handler',
            methods: ['POST'],
            public: true,
          },
        ],
      })

      loader.registerEnsembleInstance(tsEnsemble)

      const instance = loader.getEnsembleInstance('triggered-ensemble')
      expect(instance?.trigger).toHaveLength(1)
      expect(instance?.trigger?.[0].type).toBe('http')
    })

    it('should register ensemble with parallel steps', () => {
      const tsEnsemble = createEnsemble({
        name: 'parallel-pipeline',
        steps: [
          parallel([
            step('fetch-a', { operation: 'http' }),
            step('fetch-b', { operation: 'http' }),
          ]),
          step('merge'),
        ],
      })

      loader.registerEnsembleInstance(tsEnsemble)

      const instance = loader.getEnsembleInstance('parallel-pipeline')
      expect(instance?.flow).toHaveLength(2)
    })

    it('should register dynamic ensemble', async () => {
      const dynamicEnsemble = createEnsemble({
        name: 'dynamic-pipeline',
        steps: (context) => {
          const count = (context.input.count as number) || 1
          return Array.from({ length: count }, (_, i) => step(`step-${i}`))
        },
      })

      loader.registerEnsembleInstance(dynamicEnsemble)

      const instance = loader.getEnsembleInstance('dynamic-pipeline')
      expect(instance?.isDynamic).toBe(true)

      // Resolve dynamic steps
      const mockContext = {
        input: { count: 3 },
        state: {},
        env: {},
        ctx: mockCtx,
      }
      const resolvedSteps = await instance?.resolveSteps(mockContext)
      expect(resolvedSteps).toHaveLength(3)
    })
  })

  describe('autoDiscover with TypeScript ensembles', () => {
    it('should handle mixed YAML and TypeScript ensembles', async () => {
      const tsEnsemble = createEnsemble({
        name: 'ts-ensemble',
        steps: [step('ts-step')],
      })

      const discovered = [
        {
          name: 'yaml-ensemble',
          config: `name: yaml-ensemble
flow:
  - agent: yaml-agent`,
        },
        {
          name: 'ts-ensemble',
          instance: tsEnsemble,
        },
      ]

      await loader.autoDiscover(discovered)

      expect(loader.hasEnsemble('yaml-ensemble')).toBe(true)
      expect(loader.hasEnsemble('ts-ensemble')).toBe(true)

      // Verify sources
      const yamlLoaded = loader.getLoadedEnsemble('yaml-ensemble')
      const tsLoaded = loader.getLoadedEnsemble('ts-ensemble')
      expect(yamlLoaded?.source).toBe('yaml')
      expect(tsLoaded?.source).toBe('typescript')
    })

    it('should prioritize instance over config when both provided', async () => {
      const tsEnsemble = createEnsemble({
        name: 'prioritized-ensemble',
        description: 'TypeScript version',
        steps: [step('ts-step')],
      })

      const discovered = [
        {
          name: 'prioritized-ensemble',
          config: `name: prioritized-ensemble
description: YAML version
flow:
  - agent: yaml-agent`,
          instance: tsEnsemble,
        },
      ]

      await loader.autoDiscover(discovered)

      const loaded = loader.getLoadedEnsemble('prioritized-ensemble')
      expect(loaded?.source).toBe('typescript')
      expect(loaded?.instance.description).toBe('TypeScript version')
    })

    it('should skip entries with neither config nor instance', async () => {
      const discovered = [
        {
          name: 'empty-entry',
          // No config or instance
        },
      ]

      await loader.autoDiscover(discovered)

      expect(loader.hasEnsemble('empty-entry')).toBe(false)
    })
  })

  describe('getEnsembleInstance', () => {
    it('should return undefined for non-existent ensemble', () => {
      expect(loader.getEnsembleInstance('nonexistent')).toBeUndefined()
    })

    it('should return Ensemble instance for YAML-registered ensemble', () => {
      loader.registerEnsemble(`name: yaml-test
flow:
  - agent: test`)

      const instance = loader.getEnsembleInstance('yaml-test')
      expect(instance).toBeInstanceOf(Ensemble)
      expect(isEnsemble(instance)).toBe(true)
    })

    it('should return same instance for TS-registered ensemble', () => {
      const original = createEnsemble({
        name: 'ts-test',
        steps: [step('test')],
      })

      loader.registerEnsembleInstance(original)

      const retrieved = loader.getEnsembleInstance('ts-test')
      expect(retrieved).toBe(original)
    })
  })

  describe('getAllEnsembleInstances', () => {
    it('should return empty array initially', () => {
      expect(loader.getAllEnsembleInstances()).toHaveLength(0)
    })

    it('should return all Ensemble instances', () => {
      loader.registerEnsemble(`name: yaml1\nflow:\n  - agent: a1`)
      loader.registerEnsembleInstance(
        createEnsemble({
          name: 'ts1',
          steps: [step('s1')],
        })
      )

      const instances = loader.getAllEnsembleInstances()
      expect(instances).toHaveLength(2)
      expect(instances.every((i) => i instanceof Ensemble)).toBe(true)
    })
  })

  describe('getLoadedEnsemble', () => {
    it('should return full loaded ensemble data', () => {
      const tsEnsemble = createEnsemble({
        name: 'full-data-test',
        steps: [step('test')],
      })

      loader.registerEnsembleInstance(tsEnsemble)

      const loaded = loader.getLoadedEnsemble('full-data-test')
      expect(loaded).toBeDefined()
      expect(loaded?.config).toBeDefined()
      expect(loaded?.instance).toBe(tsEnsemble)
      expect(loaded?.source).toBe('typescript')
    })
  })

  describe('getAllLoadedEnsembles', () => {
    it('should return all loaded ensemble data', () => {
      loader.registerEnsemble(`name: e1\nflow:\n  - agent: a1`)
      loader.registerEnsembleInstance(
        createEnsemble({
          name: 'e2',
          steps: [step('s2')],
        })
      )

      const allLoaded = loader.getAllLoadedEnsembles()
      expect(allLoaded).toHaveLength(2)
      expect(allLoaded.every((l) => l.config && l.instance && l.source)).toBe(true)
    })
  })

  describe('YAML and TypeScript equivalence', () => {
    it('should produce equivalent structures from YAML and TS', async () => {
      // Register via YAML
      loader.registerEnsemble(`name: equiv-test
description: Test equivalence
state:
  initial:
    count: 0
flow:
  - agent: processor`)

      // Register via TypeScript
      const tsEnsemble = createEnsemble({
        name: 'equiv-test-ts',
        description: 'Test equivalence',
        state: {
          initial: { count: 0 },
        },
        steps: [step('processor')],
      })
      loader.registerEnsembleInstance(tsEnsemble)

      // Both should be Ensemble instances
      const yamlInstance = loader.getEnsembleInstance('equiv-test')
      const tsInstance = loader.getEnsembleInstance('equiv-test-ts')

      expect(yamlInstance).toBeInstanceOf(Ensemble)
      expect(tsInstance).toBeInstanceOf(Ensemble)

      // Both should have same structure
      expect(yamlInstance?.description).toBe(tsInstance?.description)
      expect(yamlInstance?.state?.initial).toEqual(tsInstance?.state?.initial)
      expect(yamlInstance?.flow).toHaveLength(1)
      expect(tsInstance?.flow).toHaveLength(1)
    })
  })
})
