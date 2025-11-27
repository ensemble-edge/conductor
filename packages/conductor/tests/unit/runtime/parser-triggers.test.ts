/**
 * Parser Trigger Tests
 *
 * Tests parsing of build and CLI triggers in ensemble YAML configurations.
 */

import { describe, it, expect } from 'vitest'
import { Parser } from '../../../src/runtime/parser.js'

describe('Parser - Build Triggers', () => {
  it('should parse ensemble with build trigger', () => {
    const yaml = `
name: docs-generate
trigger:
  - type: build
    output: ./dist/docs
    enabled: true
flow:
  - agent: docs
    input:
      action: generate
`
    const config = Parser.parseEnsemble(yaml)

    expect(config.name).toBe('docs-generate')
    expect(config.trigger).toHaveLength(1)
    expect(config.trigger![0].type).toBe('build')
    expect((config.trigger![0] as any).output).toBe('./dist/docs')
    expect((config.trigger![0] as any).enabled).toBe(true)
  })

  it('should parse build trigger with all optional fields', () => {
    const yaml = `
name: full-build
trigger:
  - type: build
    output: ./dist/api
    enabled: true
    input:
      format: json
    metadata:
      version: "1.0"
flow:
  - agent: gen
    input: {}
`
    const config = Parser.parseEnsemble(yaml)
    const trigger = config.trigger![0] as any

    expect(trigger.type).toBe('build')
    expect(trigger.output).toBe('./dist/api')
    expect(trigger.input).toEqual({ format: 'json' })
    expect(trigger.metadata).toEqual({ version: '1.0' })
  })

  it('should parse build trigger without output', () => {
    const yaml = `
name: minimal-build
trigger:
  - type: build
flow:
  - agent: gen
    input: {}
`
    const config = Parser.parseEnsemble(yaml)

    expect(config.trigger).toHaveLength(1)
    expect(config.trigger![0].type).toBe('build')
    expect((config.trigger![0] as any).output).toBeUndefined()
  })

  it('should parse ensemble with mixed build and http triggers', () => {
    const yaml = `
name: mixed-triggers
trigger:
  - type: http
    path: /api/docs
    methods: [GET]
    public: true
  - type: build
    output: ./dist/docs
flow:
  - agent: docs
    input: {}
`
    const config = Parser.parseEnsemble(yaml)

    expect(config.trigger).toHaveLength(2)
    expect(config.trigger![0].type).toBe('http')
    expect(config.trigger![1].type).toBe('build')
  })
})

describe('Parser - CLI Triggers', () => {
  it('should parse ensemble with CLI trigger', () => {
    const yaml = `
name: docs-cli
trigger:
  - type: cli
    command: generate-docs
    description: Generate documentation
flow:
  - agent: docs
    input:
      action: generate
`
    const config = Parser.parseEnsemble(yaml)

    expect(config.name).toBe('docs-cli')
    expect(config.trigger).toHaveLength(1)
    expect(config.trigger![0].type).toBe('cli')
    expect((config.trigger![0] as any).command).toBe('generate-docs')
    expect((config.trigger![0] as any).description).toBe('Generate documentation')
  })

  it('should parse CLI trigger with options', () => {
    const yaml = `
name: cli-with-options
trigger:
  - type: cli
    command: deploy
    description: Deploy to environment
    options:
      - name: env
        type: string
        required: true
        description: Target environment
      - name: dry-run
        type: boolean
        default: false
      - name: count
        type: number
        default: 1
flow:
  - agent: deploy
    input: {}
`
    const config = Parser.parseEnsemble(yaml)
    const trigger = config.trigger![0] as any

    expect(trigger.type).toBe('cli')
    expect(trigger.command).toBe('deploy')
    expect(trigger.options).toHaveLength(3)

    const envOption = trigger.options[0]
    expect(envOption.name).toBe('env')
    expect(envOption.type).toBe('string')
    expect(envOption.required).toBe(true)

    const dryRunOption = trigger.options[1]
    expect(dryRunOption.name).toBe('dry-run')
    expect(dryRunOption.type).toBe('boolean')
    expect(dryRunOption.default).toBe(false)

    const countOption = trigger.options[2]
    expect(countOption.type).toBe('number')
    expect(countOption.default).toBe(1)
  })

  it('should parse disabled CLI trigger', () => {
    const yaml = `
name: disabled-cli
trigger:
  - type: cli
    command: maintenance
    enabled: false
flow:
  - agent: maint
    input: {}
`
    const config = Parser.parseEnsemble(yaml)
    const trigger = config.trigger![0] as any

    expect(trigger.enabled).toBe(false)
  })

  it('should parse multiple CLI triggers', () => {
    const yaml = `
name: multi-cli
trigger:
  - type: cli
    command: build
    description: Build the project
  - type: cli
    command: test
    description: Run tests
  - type: cli
    command: deploy
    description: Deploy to production
flow:
  - agent: task
    input: {}
`
    const config = Parser.parseEnsemble(yaml)

    expect(config.trigger).toHaveLength(3)
    expect(config.trigger!.every((t) => t.type === 'cli')).toBe(true)
    expect((config.trigger![0] as any).command).toBe('build')
    expect((config.trigger![1] as any).command).toBe('test')
    expect((config.trigger![2] as any).command).toBe('deploy')
  })
})

describe('Parser - All Trigger Types', () => {
  it('should parse ensemble with all trigger types', () => {
    const yaml = `
name: all-triggers
trigger:
  - type: http
    path: /api/resource
    methods: [GET, POST]
    public: true
  - type: webhook
    path: /hooks/github
    methods: [POST]
    public: true
  - type: cron
    cron: "0 * * * *"
  - type: mcp
    transport: stdio
    public: true
  - type: build
    output: ./dist
  - type: cli
    command: run-task
flow:
  - agent: handler
    input: {}
`
    const config = Parser.parseEnsemble(yaml)

    expect(config.trigger).toHaveLength(6)
    expect(config.trigger!.map((t) => t.type)).toEqual([
      'http',
      'webhook',
      'cron',
      'mcp',
      'build',
      'cli',
    ])
  })

  it('should reject invalid trigger type', () => {
    const yaml = `
name: invalid-trigger
trigger:
  - type: invalid-type
flow:
  - agent: test
    input: {}
`
    expect(() => Parser.parseEnsemble(yaml)).toThrow()
  })

  it('should reject CLI trigger without command', () => {
    const yaml = `
name: missing-command
trigger:
  - type: cli
    description: Missing command field
flow:
  - agent: test
    input: {}
`
    expect(() => Parser.parseEnsemble(yaml)).toThrow()
  })
})

describe('Parser - Multi-path HTTP Triggers', () => {
  it('should parse HTTP trigger with paths array', () => {
    const yaml = `
name: multi-path
trigger:
  - type: http
    paths:
      - path: /docs
        methods: [GET]
      - path: /docs/api
        methods: [GET]
      - path: /docs/:slug
        methods: [GET]
    public: true
flow:
  - agent: docs
    input: {}
`
    const config = Parser.parseEnsemble(yaml)
    const trigger = config.trigger![0] as any

    expect(trigger.type).toBe('http')
    expect(trigger.paths).toHaveLength(3)
    expect(trigger.paths[0].path).toBe('/docs')
    expect(trigger.paths[1].path).toBe('/docs/api')
    expect(trigger.paths[2].path).toBe('/docs/:slug')
    expect(trigger.public).toBe(true)
  })

  it('should still support single path HTTP trigger', () => {
    const yaml = `
name: single-path
trigger:
  - type: http
    path: /api/resource
    methods: [GET, POST]
    public: true
flow:
  - agent: api
    input: {}
`
    const config = Parser.parseEnsemble(yaml)
    const trigger = config.trigger![0] as any

    expect(trigger.type).toBe('http')
    expect(trigger.path).toBe('/api/resource')
    expect(trigger.methods).toEqual(['GET', 'POST'])
  })
})
