import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildAndPackConductor } from '../setup/build-pack.js'
import { TestProject } from '../setup/test-project.js'
import { TestServer } from '../setup/server.js'
import { testJsonEndpoint } from '../helpers/http.js'

/**
 * Phase 5: Custom Ensembles Testing
 *
 * Creates custom ensembles that orchestrate multiple agents:
 * 1. Create agents (text-processor, calculator, data-validator)
 * 2. Create text-pipeline ensemble (sequential: uppercase → reverse)
 * 3. Create text-analysis ensemble (parallel: count + validate)
 * 4. Create user-registration ensemble (sequential: validate → calculate → format)
 * 5. Test all ensembles via /api/v1/execute/{name}
 */
describe('Phase 5: Custom Ensembles', () => {
  let project: TestProject
  let server: TestServer

  beforeAll(async () => {
    console.log('🏗️  Setting up Phase 5: Custom Ensembles testing...')

    // Build and pack Conductor
    const tarballPath = await buildAndPackConductor()

    // Create test project
    project = await TestProject.create({ name: 'conductor-custom-ensembles-test' })

    // Install and initialize
    await project.installConductor(tarballPath)
    await project.init()

    // IMPORTANT: Use auto-discovery index file instead of pages-only version
    // The default src/index.ts only loads pages, not agents or ensembles
    // We write our own simplified version to avoid emoji parsing issues in comments
    await project.writeFile(
      'src/index.ts',
      `import { createAutoDiscoveryAPI } from '@ensemble-edge/conductor/api'
import { ExecutionState, HITLState } from '@ensemble-edge/conductor/cloudflare'
import { agents } from 'virtual:conductor-agents'
import { ensembles } from 'virtual:conductor-ensembles'

export default createAutoDiscoveryAPI({
  autoDiscover: true,
  agents,
  ensembles,
  auth: {
    apiKeys: [],
    allowAnonymous: true,
  },
  logging: true,
  cors: {
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  },
})

export { ExecutionState, HITLState }
`
    )

    await project.install()

    // Create agents first
    await createTestAgents(project)

    // Then create ensembles that use those agents
    await createTestEnsembles(project)

    // Build
    await project.build()

    // Start dev server
    server = new TestServer(project.dir)
    await server.start()

    console.log('✅ Phase 5 setup complete')
  }, 600000) // 10 minutes

  afterAll(async () => {
    if (server) {
      await server.stop()
    }
    if (project) {
      await project.cleanup()
    }
  })

  it('should have created ensemble files', async () => {
    expect(await project.exists('ensembles/text-pipeline.yaml')).toBe(true)
    expect(await project.exists('ensembles/text-analysis.yaml')).toBe(true)
    expect(await project.exists('ensembles/math-pipeline.yaml')).toBe(true)
  })

  it('should execute text-pipeline ensemble (sequential workflow)', async () => {
    const response = await testJsonEndpoint(server.getUrl('/api/v1/execute/text-pipeline'), {
      method: 'POST',
      body: {
        input: { text: 'hello world' },
      },
      expectedStatus: 200,
    })

    // Pipeline: text → uppercase → reverse = "DLROW OLLEH"
    expect(response.output.result).toBe('DLROW OLLEH')
    expect(response.output.steps).toBeDefined()
    expect(response.output.steps.uppercase).toBe('HELLO WORLD')
  })

  it('should execute text-analysis ensemble (parallel workflow)', async () => {
    const response = await testJsonEndpoint(server.getUrl('/api/v1/execute/text-analysis'), {
      method: 'POST',
      body: {
        input: {
          text: 'integration test',
          email: 'test@example.com',
          age: 25,
          username: 'testuser',
        },
      },
      expectedStatus: 200,
    })

    // Parallel execution: word count + data validation
    expect(response.output.wordCount).toBe(2)
    expect(response.output.textLength).toBe(16)
    expect(response.output.validation.isValid).toBe(true)
  })

  it('should execute math-pipeline ensemble with chained calculations', async () => {
    const response = await testJsonEndpoint(server.getUrl('/api/v1/execute/math-pipeline'), {
      method: 'POST',
      body: {
        input: { number: 10 },
      },
      expectedStatus: 200,
    })

    // Pipeline: 10 * 2 = 20, then 20 + 22 = 42
    expect(response.output.result).toBe(42)
    expect(response.output.steps.doubled).toBe(20)
    expect(response.output.steps.final).toBe(42)
  })

  it('should handle ensemble with invalid input', async () => {
    const response = await fetch(server.getUrl('/api/v1/execute/text-analysis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          text: 'test',
          email: 'invalid-email',
          age: -5,
          username: 'ab',
        },
      }),
    })

    const data = await response.json()

    // Should still execute but validation should fail
    expect(data.output.validation.isValid).toBe(false)
    expect(data.output.validation.errors.length).toBeGreaterThan(0)
  })

  it('should track execution steps in ensemble response', async () => {
    const response = await testJsonEndpoint(server.getUrl('/api/v1/execute/text-pipeline'), {
      method: 'POST',
      body: {
        input: { text: 'test' },
      },
      expectedStatus: 200,
    })

    expect(response.output.steps).toBeDefined()
    expect(response.output.steps.uppercase).toBeDefined()
    expect(response.output.steps.reversed).toBeDefined()
  })
})

/**
 * Create test agents for ensemble testing
 */
async function createTestAgents(project: TestProject): Promise<void> {
  // Text processor agent
  await project.createAgent('text-processor', {
    yaml: `name: text-processor
operation: code
schema:
  input:
    text: string
    operation: string
  output:
    result: string
`,
    ts: `export default async function(context: any): Promise<{ result: string }> {
  console.error('[DEBUG] context.input:', JSON.stringify(context.input))
  console.error('[DEBUG] context.input type:', typeof context.input)
  console.error('[DEBUG] context.input keys:', context.input ? Object.keys(context.input) : 'null')

  const input = context.input
  const { text, operation } = input
  let result: string
  switch (operation) {
    case 'uppercase': result = text.toUpperCase(); break
    case 'lowercase': result = text.toLowerCase(); break
    case 'reverse': result = text.split('').reverse().join(''); break
    default: throw new Error('Unknown operation')
  }
  return { result }
}
`,
  })

  // Calculator agent
  await project.createAgent('calculator', {
    yaml: `name: calculator
operation: code
schema:
  input:
    a: number
    b: number
    operation: string
  output:
    result: number
`,
    ts: `export default async function({ input }: { input: any }): Promise<{ result: number }> {
  const { a, b, operation } = input
  let result: number
  switch (operation) {
    case 'add': result = a + b; break
    case 'subtract': result = a - b; break
    case 'multiply': result = a * b; break
    case 'divide': result = b === 0 ? 0 : a / b; break
    default: throw new Error('Unknown operation')
  }
  return { result }
}
`,
  })

  // Data validator agent
  await project.createAgent('data-validator', {
    yaml: `name: data-validator
operation: code
schema:
  input:
    email: string
    age: number
    username: string
  output:
    isValid: boolean
    errors: array
`,
    ts: `export default async function({ input }: { input: any }): Promise<any> {
  const { email, age, username } = input
  const errors = []

  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    errors.push('Invalid email')
  }
  if (age < 0 || age > 150) {
    errors.push('Invalid age')
  }
  if (username.length < 3) {
    errors.push('Username too short')
  }

  return { isValid: errors.length === 0, errors }
}
`,
  })
}

/**
 * Create test ensembles for integration testing
 */
async function createTestEnsembles(project: TestProject): Promise<void> {
  // 1. Sequential text pipeline
  await project.createEnsemble(
    'text-pipeline',
    `name: text-pipeline
description: Sequential text processing (uppercase then reverse)

flow:
  - agent: text-processor
    id: uppercase-step
    input:
      text: \${input.text}
      operation: uppercase

  - agent: text-processor
    id: reverse-step
    input:
      text: \${uppercase-step.output.result}
      operation: reverse

output:
  result: \${reverse-step.output.result}
  steps:
    uppercase: \${uppercase-step.output.result}
    reversed: \${reverse-step.output.result}
`
  )

  // 2. Parallel text analysis
  await project.createEnsemble(
    'text-analysis',
    `name: text-analysis
description: Parallel text analysis and data validation

flow:
  - agent: data-validator
    id: validate
    input:
      email: \${input.email}
      age: \${input.age}
      username: \${input.username}

output:
  wordCount: \${input.text | split(" ") | length}
  textLength: \${input.text | length}
  validation: \${validate.output}
`
  )

  // 3. Math pipeline
  await project.createEnsemble(
    'math-pipeline',
    `name: math-pipeline
description: Sequential math operations

flow:
  - agent: calculator
    id: double
    input:
      a: \${input.number}
      b: 2
      operation: multiply

  - agent: calculator
    id: add-22
    input:
      a: \${double.output.result}
      b: 22
      operation: add

output:
  result: \${add-22.output.result}
  steps:
    doubled: \${double.output.result}
    final: \${add-22.output.result}
`
  )
}
