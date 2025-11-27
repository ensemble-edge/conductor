/**
 * LocalLoader Unit Tests
 *
 * Tests the filesystem-based ensemble/agent loader for CLI commands.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { LocalLoader, DEFAULT_DIRS } from '../../../src/cli/local-loader.js'

describe('LocalLoader', () => {
  let testDir: string
  let loader: LocalLoader

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'conductor-test-'))
    loader = new LocalLoader(testDir)
  })

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('DEFAULT_DIRS', () => {
    it('should have correct default directories', () => {
      expect(DEFAULT_DIRS.ensembles).toBe('catalog/ensembles')
      expect(DEFAULT_DIRS.agents).toBe('catalog/agents')
    })
  })

  describe('path getters', () => {
    it('should return correct project root', () => {
      expect(loader.getProjectRoot()).toBe(testDir)
    })

    it('should return correct ensembles directory', () => {
      expect(loader.getEnsemblesDir()).toBe(path.join(testDir, 'catalog/ensembles'))
    })

    it('should return correct agents directory', () => {
      expect(loader.getAgentsDir()).toBe(path.join(testDir, 'catalog/agents'))
    })

    it('should use cwd when no projectRoot provided', () => {
      const defaultLoader = new LocalLoader()
      expect(defaultLoader.getProjectRoot()).toBe(process.cwd())
    })
  })

  describe('directoryExists', () => {
    it('should return true for existing directory', async () => {
      const dir = path.join(testDir, 'existing')
      await fs.mkdir(dir)
      expect(await loader.directoryExists(dir)).toBe(true)
    })

    it('should return false for non-existing directory', async () => {
      expect(await loader.directoryExists(path.join(testDir, 'nonexistent'))).toBe(false)
    })

    it('should return false for file (not directory)', async () => {
      const file = path.join(testDir, 'file.txt')
      await fs.writeFile(file, 'test')
      expect(await loader.directoryExists(file)).toBe(false)
    })
  })

  describe('loadAllEnsembles', () => {
    it('should return empty array when directory does not exist', async () => {
      const ensembles = await loader.loadAllEnsembles()
      expect(ensembles).toEqual([])
    })

    it('should load YAML ensembles from directory', async () => {
      // Create ensembles directory
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      // Create test ensemble
      const ensembleYaml = `
name: test-ensemble
flow:
  - agent: test
    input:
      action: test
`
      await fs.writeFile(path.join(ensemblesDir, 'test.yaml'), ensembleYaml)

      const ensembles = await loader.loadAllEnsembles()
      expect(ensembles).toHaveLength(1)
      expect(ensembles[0].name).toBe('test-ensemble')
    })

    it('should load ensembles from nested directories', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      const nestedDir = path.join(ensemblesDir, 'system/docs')
      await fs.mkdir(nestedDir, { recursive: true })

      const ensembleYaml = `
name: nested-ensemble
flow:
  - agent: docs
    input: {}
`
      await fs.writeFile(path.join(nestedDir, 'serve.yaml'), ensembleYaml)

      const ensembles = await loader.loadAllEnsembles()
      expect(ensembles).toHaveLength(1)
      expect(ensembles[0].name).toBe('nested-ensemble')
    })

    it('should handle both .yaml and .yml extensions', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      await fs.writeFile(
        path.join(ensemblesDir, 'test1.yaml'),
        'name: test1\nflow:\n  - agent: a\n    input: {}'
      )
      await fs.writeFile(
        path.join(ensemblesDir, 'test2.yml'),
        'name: test2\nflow:\n  - agent: b\n    input: {}'
      )

      const ensembles = await loader.loadAllEnsembles()
      expect(ensembles).toHaveLength(2)
      expect(ensembles.map((e) => e.name).sort()).toEqual(['test1', 'test2'])
    })

    it('should skip invalid YAML files gracefully', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      // Valid ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'valid.yaml'),
        'name: valid\nflow:\n  - agent: a\n    input: {}'
      )

      // Invalid YAML (missing required fields)
      await fs.writeFile(path.join(ensemblesDir, 'invalid.yaml'), 'not: valid')

      const ensembles = await loader.loadAllEnsembles()
      expect(ensembles).toHaveLength(1)
      expect(ensembles[0].name).toBe('valid')
    })
  })

  describe('loadBuildEnsembles', () => {
    it('should only return ensembles with build triggers', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      // Build trigger ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'build.yaml'),
        `name: build-ensemble
trigger:
  - type: build
    output: ./dist
flow:
  - agent: gen
    input: {}`
      )

      // HTTP trigger ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'http.yaml'),
        `name: http-ensemble
trigger:
  - type: http
    path: /api
    methods: [GET]
flow:
  - agent: api
    input: {}`
      )

      const ensembles = await loader.loadBuildEnsembles()
      expect(ensembles).toHaveLength(1)
      expect(ensembles[0].name).toBe('build-ensemble')
    })
  })

  describe('loadCLIEnsembles', () => {
    it('should only return ensembles with CLI triggers', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      // CLI trigger ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'cli.yaml'),
        `name: cli-ensemble
trigger:
  - type: cli
    command: my-cmd
flow:
  - agent: cmd
    input: {}`
      )

      // HTTP trigger ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'http.yaml'),
        `name: http-ensemble
trigger:
  - type: http
    path: /api
    methods: [GET]
flow:
  - agent: api
    input: {}`
      )

      const ensembles = await loader.loadCLIEnsembles()
      expect(ensembles).toHaveLength(1)
      expect(ensembles[0].name).toBe('cli-ensemble')
    })
  })

  describe('loadScheduledEnsembles', () => {
    it('should only return ensembles with cron triggers', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      // Cron trigger ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'cron.yaml'),
        `name: cron-ensemble
trigger:
  - type: cron
    cron: "0 * * * *"
flow:
  - agent: job
    input: {}`
      )

      // Build trigger ensemble
      await fs.writeFile(
        path.join(ensemblesDir, 'build.yaml'),
        `name: build-ensemble
trigger:
  - type: build
flow:
  - agent: gen
    input: {}`
      )

      const ensembles = await loader.loadScheduledEnsembles()
      expect(ensembles).toHaveLength(1)
      expect(ensembles[0].name).toBe('cron-ensemble')
    })
  })

  describe('loadEnsemble', () => {
    it('should load ensemble by name from root', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles')
      await fs.mkdir(ensemblesDir, { recursive: true })

      await fs.writeFile(
        path.join(ensemblesDir, 'my-ensemble.yaml'),
        'name: my-ensemble\nflow:\n  - agent: a\n    input: {}'
      )

      const ensemble = await loader.loadEnsemble('my-ensemble')
      expect(ensemble).not.toBeNull()
      expect(ensemble!.name).toBe('my-ensemble')
    })

    it('should return null for non-existent ensemble', async () => {
      const ensemble = await loader.loadEnsemble('nonexistent')
      expect(ensemble).toBeNull()
    })

    it('should find ensemble in subdirectory by name', async () => {
      const ensemblesDir = path.join(testDir, 'catalog/ensembles/my-ensemble')
      await fs.mkdir(ensemblesDir, { recursive: true })

      await fs.writeFile(
        path.join(ensemblesDir, 'my-ensemble.yaml'),
        'name: my-ensemble\nflow:\n  - agent: a\n    input: {}'
      )

      const ensemble = await loader.loadEnsemble('my-ensemble')
      expect(ensemble).not.toBeNull()
      expect(ensemble!.name).toBe('my-ensemble')
    })
  })

  describe('loadAllAgents', () => {
    it('should return empty array when directory does not exist', async () => {
      const agents = await loader.loadAllAgents()
      expect(agents).toEqual([])
    })

    it('should load agent YAML files', async () => {
      const agentsDir = path.join(testDir, 'catalog/agents')
      await fs.mkdir(agentsDir, { recursive: true })

      await fs.writeFile(
        path.join(agentsDir, 'test-agent.yaml'),
        `name: test-agent
operation: code
description: Test agent`
      )

      const agents = await loader.loadAllAgents()
      expect(agents).toHaveLength(1)
      expect(agents[0].name).toBe('test-agent')
      expect(agents[0].operation).toBe('code')
    })
  })

  describe('loadAgent', () => {
    it('should load agent by name', async () => {
      const agentsDir = path.join(testDir, 'catalog/agents')
      await fs.mkdir(agentsDir, { recursive: true })

      await fs.writeFile(
        path.join(agentsDir, 'my-agent.yaml'),
        'name: my-agent\noperation: think'
      )

      const agent = await loader.loadAgent('my-agent')
      expect(agent).not.toBeNull()
      expect(agent!.name).toBe('my-agent')
    })

    it('should find agent.yaml in subdirectory', async () => {
      const agentDir = path.join(testDir, 'catalog/agents/my-agent')
      await fs.mkdir(agentDir, { recursive: true })

      await fs.writeFile(
        path.join(agentDir, 'agent.yaml'),
        'name: my-agent\noperation: code'
      )

      const agent = await loader.loadAgent('my-agent')
      expect(agent).not.toBeNull()
      expect(agent!.name).toBe('my-agent')
    })

    it('should return null for non-existent agent', async () => {
      const agent = await loader.loadAgent('nonexistent')
      expect(agent).toBeNull()
    })
  })
})
