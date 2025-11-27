/**
 * CLIManager Unit Tests
 *
 * Tests the CLI trigger management system without requiring Cloudflare services.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  CLIManager,
  getCLIManager,
  resetCLIManager,
} from '../../../src/runtime/cli-manager.js'
import type { EnsembleConfig } from '../../../src/runtime/parser.js'

describe('CLIManager', () => {
  let manager: CLIManager

  beforeEach(() => {
    manager = new CLIManager()
  })

  describe('register', () => {
    it('should register ensemble with CLI trigger', () => {
      const ensemble: EnsembleConfig = {
        name: 'docs-generate',
        trigger: [
          {
            type: 'cli',
            command: 'generate-docs',
            description: 'Generate documentation',
          },
        ],
        flow: [{ agent: 'docs', input: { action: 'generate' } }],
      }

      manager.register(ensemble)
      expect(manager.getCommandCount()).toBe(1)
      expect(manager.hasCommand('generate-docs')).toBe(true)
    })

    it('should not register ensemble without CLI trigger', () => {
      const ensemble: EnsembleConfig = {
        name: 'http-endpoint',
        trigger: [{ type: 'http', path: '/api/test', methods: ['GET'] }],
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getCommandCount()).toBe(0)
    })

    it('should register multiple CLI triggers from one ensemble', () => {
      const ensemble: EnsembleConfig = {
        name: 'multi-command',
        trigger: [
          { type: 'cli', command: 'cmd1', description: 'Command 1' },
          { type: 'cli', command: 'cmd2', description: 'Command 2' },
        ],
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getCommandCount()).toBe(2)
      expect(manager.hasCommand('cmd1')).toBe(true)
      expect(manager.hasCommand('cmd2')).toBe(true)
    })

    it('should skip disabled CLI triggers', () => {
      const ensemble: EnsembleConfig = {
        name: 'disabled-cmd',
        trigger: [
          { type: 'cli', command: 'disabled', enabled: false },
          { type: 'cli', command: 'enabled', enabled: true },
        ],
        flow: [{ agent: 'test', input: {} }],
      }

      manager.register(ensemble)
      expect(manager.getCommandCount()).toBe(1)
      expect(manager.hasCommand('disabled')).toBe(false)
      expect(manager.hasCommand('enabled')).toBe(true)
    })

    it('should overwrite duplicate command names with warning', () => {
      const ensemble1: EnsembleConfig = {
        name: 'first',
        trigger: [{ type: 'cli', command: 'duplicate' }],
        flow: [{ agent: 'a', input: {} }],
      }
      const ensemble2: EnsembleConfig = {
        name: 'second',
        trigger: [{ type: 'cli', command: 'duplicate' }],
        flow: [{ agent: 'b', input: {} }],
      }

      manager.register(ensemble1)
      manager.register(ensemble2)

      expect(manager.getCommandCount()).toBe(1)
      const metadata = manager.getCommandMetadata('duplicate')
      expect(metadata?.ensembleName).toBe('second')
    })
  })

  describe('registerAll', () => {
    it('should register multiple ensembles at once', () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'cmd1',
          trigger: [{ type: 'cli', command: 'first' }],
          flow: [{ agent: 'a', input: {} }],
        },
        {
          name: 'cmd2',
          trigger: [{ type: 'cli', command: 'second' }],
          flow: [{ agent: 'b', input: {} }],
        },
        {
          name: 'http-only',
          trigger: [{ type: 'http', path: '/api', methods: ['GET'] }],
          flow: [{ agent: 'c', input: {} }],
        },
      ]

      manager.registerAll(ensembles)
      expect(manager.getCommandCount()).toBe(2)
    })
  })

  describe('hasCommand', () => {
    it('should return true for registered commands', () => {
      manager.register({
        name: 'test',
        trigger: [{ type: 'cli', command: 'my-cmd' }],
        flow: [{ agent: 'a', input: {} }],
      })

      expect(manager.hasCommand('my-cmd')).toBe(true)
      expect(manager.hasCommand('unknown')).toBe(false)
    })
  })

  describe('getCommandMetadata', () => {
    it('should return metadata for registered command', () => {
      const ensemble: EnsembleConfig = {
        name: 'docs-gen',
        trigger: [
          {
            type: 'cli',
            command: 'generate',
            description: 'Generate docs',
            options: [
              { name: 'format', type: 'string', default: 'html' },
              { name: 'output', type: 'string', required: true },
            ],
          },
        ],
        flow: [{ agent: 'docs', input: {} }],
      }

      manager.register(ensemble)
      const metadata = manager.getCommandMetadata('generate')

      expect(metadata).not.toBeNull()
      expect(metadata!.command).toBe('generate')
      expect(metadata!.description).toBe('Generate docs')
      expect(metadata!.ensembleName).toBe('docs-gen')
      expect(metadata!.options).toHaveLength(2)
      expect(metadata!.options[0].name).toBe('format')
      expect(metadata!.options[0].default).toBe('html')
      expect(metadata!.options[1].required).toBe(true)
    })

    it('should return null for unknown command', () => {
      expect(manager.getCommandMetadata('unknown')).toBeNull()
    })
  })

  describe('listCommands', () => {
    it('should list all registered commands sorted alphabetically', () => {
      const ensembles: EnsembleConfig[] = [
        {
          name: 'z-ensemble',
          trigger: [{ type: 'cli', command: 'zebra' }],
          flow: [{ agent: 'a', input: {} }],
        },
        {
          name: 'a-ensemble',
          trigger: [{ type: 'cli', command: 'apple' }],
          flow: [{ agent: 'b', input: {} }],
        },
        {
          name: 'm-ensemble',
          trigger: [{ type: 'cli', command: 'mango' }],
          flow: [{ agent: 'c', input: {} }],
        },
      ]

      manager.registerAll(ensembles)
      const commands = manager.listCommands()

      expect(commands).toHaveLength(3)
      expect(commands[0].command).toBe('apple')
      expect(commands[1].command).toBe('mango')
      expect(commands[2].command).toBe('zebra')
    })

    it('should return empty array when no commands registered', () => {
      const commands = manager.listCommands()
      expect(commands).toHaveLength(0)
    })
  })

  describe('clear', () => {
    it('should clear all registered commands', () => {
      manager.register({
        name: 'test',
        trigger: [{ type: 'cli', command: 'test-cmd' }],
        flow: [{ agent: 'a', input: {} }],
      })

      expect(manager.getCommandCount()).toBe(1)
      manager.clear()
      expect(manager.getCommandCount()).toBe(0)
    })
  })
})

describe('Global CLIManager', () => {
  beforeEach(() => {
    resetCLIManager()
  })

  it('should return singleton instance', () => {
    const manager1 = getCLIManager()
    const manager2 = getCLIManager()
    expect(manager1).toBe(manager2)
  })

  it('should reset to new instance', () => {
    const manager1 = getCLIManager()
    manager1.register({
      name: 'test',
      trigger: [{ type: 'cli', command: 'test' }],
      flow: [{ agent: 'a', input: {} }],
    })
    expect(manager1.getCommandCount()).toBe(1)

    resetCLIManager()

    const manager2 = getCLIManager()
    expect(manager2).not.toBe(manager1)
    expect(manager2.getCommandCount()).toBe(0)
  })
})

describe('CLIManager Option Parsing', () => {
  let manager: CLIManager

  beforeEach(() => {
    manager = new CLIManager()
  })

  // Note: parseOptions is private, but we can test it indirectly through runCommand
  // These tests verify the parsing logic via the metadata

  it('should define options with type information', () => {
    manager.register({
      name: 'typed-cmd',
      trigger: [
        {
          type: 'cli',
          command: 'process',
          options: [
            { name: 'count', type: 'number', default: 10 },
            { name: 'verbose', type: 'boolean', default: false },
            { name: 'format', type: 'string', default: 'json' },
          ],
        },
      ],
      flow: [{ agent: 'a', input: {} }],
    })

    const metadata = manager.getCommandMetadata('process')
    expect(metadata!.options).toHaveLength(3)

    const countOpt = metadata!.options.find((o) => o.name === 'count')
    expect(countOpt?.type).toBe('number')
    expect(countOpt?.default).toBe(10)

    const verboseOpt = metadata!.options.find((o) => o.name === 'verbose')
    expect(verboseOpt?.type).toBe('boolean')
    expect(verboseOpt?.default).toBe(false)
  })

  it('should define required options', () => {
    manager.register({
      name: 'required-cmd',
      trigger: [
        {
          type: 'cli',
          command: 'deploy',
          options: [
            { name: 'env', type: 'string', required: true },
            { name: 'dry-run', type: 'boolean' },
          ],
        },
      ],
      flow: [{ agent: 'a', input: {} }],
    })

    const metadata = manager.getCommandMetadata('deploy')
    const envOpt = metadata!.options.find((o) => o.name === 'env')
    expect(envOpt?.required).toBe(true)
  })
})
