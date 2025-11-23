import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildAndPackConductor } from '../setup/build-pack.js'
import { TestProject } from '../setup/test-project.js'
import { TestServer } from '../setup/server.js'
import { testJsonEndpoint } from '../helpers/http.js'

/**
 * Phase 4: Custom Agents Testing
 *
 * Creates custom agents in the test project and tests them via API:
 * 1. Create text-processor agent (uppercase, lowercase, reverse)
 * 2. Create calculator agent (add, subtract, multiply, divide)
 * 3. Create data-validator agent (email, age, username validation)
 * 4. Test all agents via /api/v1/agents/{name}/execute
 */
describe('Phase 4: Custom Agents', () => {
	let project: TestProject
	let server: TestServer

	beforeAll(async () => {
		console.log('🏗️  Setting up Phase 4: Custom Agents testing...')

		// Build and pack Conductor
		const tarballPath = await buildAndPackConductor()

		// Create test project
		project = await TestProject.create({ name: 'conductor-custom-agents-test' })

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

		// Create custom test agents
		await createTestAgents(project)

		// Build
		await project.build()

		// Start dev server
		server = new TestServer(project.dir)
		await server.start()

		console.log('✅ Phase 4 setup complete')
	}, 600000) // 10 minutes

	afterAll(async () => {
		if (server) {
			await server.stop()
		}
		if (project) {
			await project.cleanup()
		}
	})

	it('should have created custom agent files', async () => {
		expect(await project.exists('agents/text-processor/agent.yaml')).toBe(true)
		expect(await project.exists('agents/text-processor/index.ts')).toBe(true)
		expect(await project.exists('agents/calculator/agent.yaml')).toBe(true)
		expect(await project.exists('agents/calculator/index.ts')).toBe(true)
		expect(await project.exists('agents/data-validator/agent.yaml')).toBe(true)
		expect(await project.exists('agents/data-validator/index.ts')).toBe(true)
	})

	it('should list custom agents via API', async () => {
		const response = await testJsonEndpoint(server.getUrl('/api/v1/agents'), {
			method: 'GET',
			expectedStatus: 200,
		})

		console.log('Available agents:', response)
		expect(response.agents).toBeDefined()

		// Extract agent names for easier checking
		const agentNames = response.agents.map((a: any) => a.name)
		expect(agentNames).toContain('text-processor')
		expect(agentNames).toContain('calculator')
		expect(agentNames).toContain('data-validator')
	})

	it('should execute text-processor agent - uppercase', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'text-processor',
					input: { text: 'hello world', operation: 'uppercase' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe('HELLO WORLD')
	})

	it('should execute text-processor agent - lowercase', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'text-processor',
					input: { text: 'HELLO WORLD', operation: 'lowercase' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe('hello world')
	})

	it('should execute text-processor agent - reverse', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'text-processor',
					input: { text: 'integration', operation: 'reverse' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe('noitargetni')
	})

	it('should execute calculator agent - addition', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'calculator',
					input: { a: 15, b: 27, operation: 'add' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe(42)
	})

	it('should execute calculator agent - subtraction', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'calculator',
					input: { a: 50, b: 8, operation: 'subtract' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe(42)
	})

	it('should execute calculator agent - multiplication', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'calculator',
					input: { a: 6, b: 7, operation: 'multiply' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe(42)
	})

	it('should execute calculator agent - division', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'calculator',
					input: { a: 84, b: 2, operation: 'divide' },
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.result).toBe(42)
	})

	it('should execute data-validator agent with valid data', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'data-validator',
					input: {
						email: 'test@example.com',
						age: 25,
						username: 'testuser123',
					},
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.isValid).toBe(true)
		expect(response.data.errors).toHaveLength(0)
	})

	it('should execute data-validator agent with invalid email', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'data-validator',
					input: {
						email: 'invalid-email',
						age: 25,
						username: 'testuser',
					},
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.isValid).toBe(false)
		expect(response.data.errors).toContain('Invalid email format')
	})

	it('should execute data-validator agent with invalid age', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'data-validator',
					input: {
						email: 'test@example.com',
						age: -5,
						username: 'testuser',
					},
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.isValid).toBe(false)
		expect(response.data.errors).toContain('Age must be between 0 and 150')
	})

	it('should execute data-validator agent with short username', async () => {
		const response = await testJsonEndpoint(
			server.getUrl('/api/v1/execute'),
			{
				method: 'POST',
				body: {
					agent: 'data-validator',
					input: {
						email: 'test@example.com',
						age: 25,
						username: 'ab',
					},
				},
				expectedStatus: 200,
			}
		)

		expect(response.data.isValid).toBe(false)
		expect(response.data.errors).toContain('Username must be at least 3 characters')
	})
})

/**
 * Create test agents for integration testing
 */
async function createTestAgents(project: TestProject): Promise<void> {
	// 1. Text Processor Agent
	await project.createAgent('text-processor', {
		yaml: `name: text-processor
operation: code
description: Processes text with various operations (uppercase, lowercase, reverse)

schema:
  input:
    text: string
    operation: string
  output:
    result: string
`,
		ts: `export interface TextProcessorInput {
  text: string
  operation: 'uppercase' | 'lowercase' | 'reverse'
}

export default async function textProcessor(
  context: { input: TextProcessorInput }
): Promise<{ result: string }> {
  const { text, operation } = context.input

  let result: string
  switch (operation) {
    case 'uppercase':
      result = text.toUpperCase()
      break
    case 'lowercase':
      result = text.toLowerCase()
      break
    case 'reverse':
      result = text.split('').reverse().join('')
      break
    default:
      throw new Error(\`Unknown operation: \${operation}\`)
  }

  return { result }
}
`,
	})

	// 2. Calculator Agent
	await project.createAgent('calculator', {
		yaml: `name: calculator
operation: code
description: Performs basic arithmetic operations

schema:
  input:
    a: number
    b: number
    operation: string
  output:
    result: number
`,
		ts: `export interface CalculatorInput {
  a: number
  b: number
  operation: 'add' | 'subtract' | 'multiply' | 'divide'
}

export default async function calculator(
  context: { input: CalculatorInput }
): Promise<{ result: number }> {
  const { a, b, operation } = context.input

  let result: number
  switch (operation) {
    case 'add':
      result = a + b
      break
    case 'subtract':
      result = a - b
      break
    case 'multiply':
      result = a * b
      break
    case 'divide':
      if (b === 0) {
        throw new Error('Cannot divide by zero')
      }
      result = a / b
      break
    default:
      throw new Error(\`Unknown operation: \${operation}\`)
  }

  return { result }
}
`,
	})

	// 3. Data Validator Agent
	await project.createAgent('data-validator', {
		yaml: `name: data-validator
operation: code
description: Validates user data (email, age, username)

schema:
  input:
    email: string
    age: number
    username: string
  output:
    isValid: boolean
    errors: array
`,
		ts: `export interface DataValidatorInput {
  email: string
  age: number
  username: string
}

export interface DataValidatorOutput {
  isValid: boolean
  errors: string[]
}

export default async function dataValidator(
  context: { input: DataValidatorInput }
): Promise<DataValidatorOutput> {
  const { email, age, username } = context.input
  const errors: string[] = []

  // Validate email
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format')
  }

  // Validate age
  if (age < 0 || age > 150) {
    errors.push('Age must be between 0 and 150')
  }

  // Validate username
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
`,
	})
}
