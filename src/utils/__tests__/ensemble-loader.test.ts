import { describe, it, expect, beforeEach } from 'vitest'
import { EnsembleLoader } from '../ensemble-loader'

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
})
