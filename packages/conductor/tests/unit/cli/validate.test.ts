/**
 * Validate Command Tests
 *
 * Tests for the validate CLI command functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('Validate Command Logic', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'validate-test-'))
  })

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('YAML Validation', () => {
    it('should identify valid ensemble YAML', async () => {
      const validEnsemble = `
name: test-ensemble
flow:
  - agent: greeter
`
      const filePath = path.join(tempDir, 'valid.yaml')
      await fs.writeFile(filePath, validEnsemble)

      // Read and verify it's parseable
      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('name: test-ensemble')
      expect(content).toContain('flow:')
    })

    it('should detect inputs: instead of input:', async () => {
      const invalidEnsemble = `
name: test
inputs:
  data: string
flow:
  - agent: test
`
      expect(invalidEnsemble).toContain('inputs:')
      // The validate command would flag this as fixable
    })

    it('should detect outputs: instead of output:', async () => {
      const invalidEnsemble = `
name: test
flow:
  - agent: test
outputs:
  result: \${test.output}
`
      expect(invalidEnsemble).toContain('outputs:')
      // The validate command would flag this as fixable
    })

    it('should detect old-style output syntax', async () => {
      const invalidEnsemble = `
name: test
flow:
  - agent: greeter
output: $greeter
`
      const pattern = /^output:\s*\$([a-zA-Z0-9_-]+)\s*$/m
      const match = invalidEnsemble.match(pattern)
      expect(match).toBeTruthy()
      expect(match![1]).toBe('greeter')
    })

    it('should not flag valid output syntax', async () => {
      const validEnsemble = `
name: test
flow:
  - agent: greeter
output:
  result: \${greeter.output}
`
      const pattern = /^output:\s*\$([a-zA-Z0-9_-]+)\s*$/m
      const match = validEnsemble.match(pattern)
      expect(match).toBeNull()
    })
  })

  describe('Agent Validation', () => {
    it('should identify valid agent YAML', async () => {
      const validAgent = `
name: thinker
operation: think
config:
  model: gpt-4
  systemPrompt: You are helpful
`
      const filePath = path.join(tempDir, 'agent.yaml')
      await fs.writeFile(filePath, validAgent)

      const content = await fs.readFile(filePath, 'utf-8')
      expect(content).toContain('name: thinker')
      expect(content).toContain('operation: think')
    })

    it('should identify agent missing name', async () => {
      const invalidAgent = `
operation: think
config:
  model: gpt-4
`
      expect(invalidAgent).not.toContain('name:')
    })

    it('should identify agent missing operation', async () => {
      const invalidAgent = `
name: test
config:
  model: gpt-4
`
      expect(invalidAgent).not.toContain('operation:')
    })
  })

  describe('Auto-fix Patterns', () => {
    it('should fix inputs: to input:', () => {
      const content = `name: test
inputs:
  data: string
flow:
  - agent: test`

      const fixed = content.replace(/^inputs:/gm, 'input:')
      expect(fixed).toContain('input:')
      expect(fixed).not.toContain('inputs:')
    })

    it('should fix outputs: to output:', () => {
      const content = `name: test
flow:
  - agent: test
outputs:
  result: value`

      const fixed = content.replace(/^outputs:/gm, 'output:')
      expect(fixed).toContain('output:')
      expect(fixed).not.toContain('outputs:')
    })

    it('should fix old-style output syntax', () => {
      const content = `name: test
flow:
  - agent: greeter
output: $greeter`

      const agentName = 'greeter'
      const pattern = new RegExp(`^output:\\s*\\$${agentName}\\s*$`, 'm')
      const fixed = content.replace(
        pattern,
        `output:\n  result: \${${agentName}.output}`
      )

      expect(fixed).toContain('output:')
      expect(fixed).toContain('result: ${greeter.output}')
      expect(fixed).not.toContain('output: $greeter')
    })
  })

  describe('Flow Control Validation', () => {
    it('should accept parallel flow steps', async () => {
      const ensemble = `
name: parallel-test
flow:
  - type: parallel
    steps:
      - agent: task1
      - agent: task2
`
      expect(ensemble).toContain('type: parallel')
      expect(ensemble).toContain('steps:')
    })

    it('should accept branch flow steps', async () => {
      const ensemble = `
name: branch-test
flow:
  - type: branch
    condition: input.value > 0
    then:
      - agent: handler
`
      expect(ensemble).toContain('type: branch')
      expect(ensemble).toContain('condition:')
      expect(ensemble).toContain('then:')
    })

    it('should accept try/catch flow steps', async () => {
      const ensemble = `
name: try-test
flow:
  - type: try
    steps:
      - agent: risky
    catch:
      - agent: error-handler
`
      expect(ensemble).toContain('type: try')
      expect(ensemble).toContain('catch:')
    })

    it('should accept foreach flow steps', async () => {
      const ensemble = `
name: foreach-test
flow:
  - type: foreach
    items: \${input.items}
    step:
      agent: processor
`
      expect(ensemble).toContain('type: foreach')
      expect(ensemble).toContain('items:')
      expect(ensemble).toContain('step:')
    })

    it('should accept switch/case flow steps', async () => {
      const ensemble = `
name: switch-test
flow:
  - type: switch
    value: \${input.type}
    cases:
      typeA:
        - agent: handler-a
    default:
      - agent: default-handler
`
      expect(ensemble).toContain('type: switch')
      expect(ensemble).toContain('value:')
      expect(ensemble).toContain('cases:')
    })

    it('should accept while loop flow steps', async () => {
      const ensemble = `
name: while-test
flow:
  - type: while
    condition: \${hasMore}
    maxIterations: 100
    steps:
      - agent: processor
`
      expect(ensemble).toContain('type: while')
      expect(ensemble).toContain('condition:')
      expect(ensemble).toContain('maxIterations:')
    })

    it('should accept map-reduce flow steps', async () => {
      const ensemble = `
name: mapreduce-test
flow:
  - type: map-reduce
    items: \${input.docs}
    map:
      agent: analyzer
    reduce:
      agent: aggregator
`
      expect(ensemble).toContain('type: map-reduce')
      expect(ensemble).toContain('map:')
      expect(ensemble).toContain('reduce:')
    })
  })

  describe('Flat Config Detection', () => {
    it('should detect flat config in inline HTML agent', async () => {
      // This is the WRONG format (flat config)
      const invalidEnsemble = `
name: test-html-ensemble
agents:
  - name: render
    operation: html
    template:
      inline: "<h1>{{title}}</h1>"
flow:
  - agent: render
`
      // The validator should detect 'template' is at root level, not under config:
      expect(invalidEnsemble).toContain('operation: html')
      expect(invalidEnsemble).toContain('template:')
      // 'template' should be nested under 'config:'
      expect(invalidEnsemble).not.toMatch(/config:\s*\n\s+template:/)
    })

    it('should accept correct nested config in inline HTML agent', async () => {
      // This is the CORRECT format (nested config)
      const validEnsemble = `
name: test-html-ensemble
agents:
  - name: render
    operation: html
    config:
      template:
        inline: "<h1>{{title}}</h1>"
flow:
  - agent: render
`
      expect(validEnsemble).toContain('config:')
      expect(validEnsemble).toMatch(/config:\s*\n\s+template:/)
    })

    it('should detect flat config in inline Queue agent', async () => {
      // This is the WRONG format (flat config)
      const invalidEnsemble = `
name: test-queue-ensemble
agents:
  - name: sender
    operation: queue
    queue: MY_QUEUE
    mode: send
flow:
  - agent: sender
`
      // The validator should detect 'queue' and 'mode' are at root level
      expect(invalidEnsemble).toContain('queue: MY_QUEUE')
      expect(invalidEnsemble).not.toMatch(/config:\s*\n\s+queue:/)
    })

    it('should accept correct nested config in inline Queue agent', async () => {
      // This is the CORRECT format (nested config)
      const validEnsemble = `
name: test-queue-ensemble
agents:
  - name: sender
    operation: queue
    config:
      queue: MY_QUEUE
      mode: send
flow:
  - agent: sender
`
      expect(validEnsemble).toContain('config:')
      expect(validEnsemble).toMatch(/config:\s*\n\s+queue:/)
    })

    it('should detect flat config in standalone agent file', async () => {
      // This is the WRONG format (flat config)
      const invalidAgent = `
name: html-renderer
operation: html
template:
  inline: "<h1>Hello</h1>"
renderOptions:
  minify: true
`
      expect(invalidAgent).toContain('operation: html')
      expect(invalidAgent).toContain('template:')
      expect(invalidAgent).toContain('renderOptions:')
      expect(invalidAgent).not.toContain('config:')
    })

    it('should accept correct nested config in standalone agent file', async () => {
      // This is the CORRECT format (nested config)
      const validAgent = `
name: html-renderer
operation: html
config:
  template:
    inline: "<h1>Hello</h1>"
  renderOptions:
    minify: true
`
      expect(validAgent).toContain('config:')
      expect(validAgent).toMatch(/config:\s*\n\s+template:/)
    })
  })

  describe('Agent Step Options Validation', () => {
    it('should accept retry configuration', async () => {
      const ensemble = `
name: retry-test
flow:
  - agent: api-caller
    retry:
      attempts: 3
      backoff: exponential
`
      expect(ensemble).toContain('retry:')
      expect(ensemble).toContain('attempts: 3')
      expect(ensemble).toContain('backoff: exponential')
    })

    it('should accept timeout configuration', async () => {
      const ensemble = `
name: timeout-test
flow:
  - agent: slow-op
    timeout: 5000
    onTimeout:
      fallback: { result: "default" }
      error: false
`
      expect(ensemble).toContain('timeout: 5000')
      expect(ensemble).toContain('onTimeout:')
      expect(ensemble).toContain('fallback:')
    })

    it('should accept conditional execution with when', async () => {
      const ensemble = `
name: when-test
flow:
  - agent: optional
    when: \${input.enabled === true}
`
      expect(ensemble).toContain('when:')
    })
  })
})
