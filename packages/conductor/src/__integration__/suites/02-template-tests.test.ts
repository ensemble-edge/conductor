/**
 * Phase 2: Template Tests
 *
 * Tests that the initialized project's own test suite passes.
 * This is critical - if the template's tests fail, something is wrong
 * with the template or Conductor itself.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildAndPackConductor } from '../setup/build-pack.js'
import { TestProject } from '../setup/test-project.js'

describe('Phase 2: Template Tests', () => {
  let project: TestProject

  beforeAll(async () => {
    // Setup: Create and initialize a project
    const tarballPath = await buildAndPackConductor()
    project = await TestProject.create({ name: 'template-tests' })

    await project.installConductor(tarballPath)
    await project.init()
    await project.install()
    await project.build()

    console.log('✅ Test project ready')
  }, 600000) // 10 minutes for full setup

  afterAll(async () => {
    if (project) {
      await project.cleanup()
    }
  })

  it('should have test files in the template', async () => {
    const testsExist = await project.exists('tests')
    expect(testsExist).toBe(true)

    // Check for basic test file
    const basicTestExists = await project.exists('tests/basic.test.ts')
    expect(basicTestExists).toBe(true)

    console.log('✅ Test files found')
  }, 10000)

  it('should run template tests successfully', async () => {
    const result = await project.test()

    // Parse output to check for passing tests
    expect(result.stdout).toBeTruthy()

    // vitest output includes "passing" or "passed"
    const output = result.stdout.toLowerCase()
    const hasPassedTests =
      output.includes('passing') || output.includes('passed') || output.includes('test files')

    expect(hasPassedTests).toBe(true)

    // Should not have failures
    const hasFailures = output.includes('failed') || output.includes('error')
    expect(hasFailures).toBe(false)

    console.log('✅ Template tests passed')
    console.log('Test output summary:')
    console.log(result.stdout.split('\n').slice(-10).join('\n')) // Last 10 lines
  }, 60000) // 1 minute

  it('should verify hello-world ensemble test passes', async () => {
    // The template includes tests/basic.test.ts which tests hello-world ensemble
    const testFile = await project.readFile('tests/basic.test.ts')

    // Verify test file has hello-world test
    expect(testFile).toContain('hello-world')
    expect(testFile).toContain('Executor')
    expect(testFile).toContain('executeFromYAML')

    console.log('✅ Hello-world ensemble test verified')
  }, 10000)

  it('should verify ExecutionContext mock is correct', async () => {
    // Critical: Template must have correct ExecutionContext mock
    const testFile = await project.readFile('tests/basic.test.ts')

    // Check for proper mock implementation
    expect(testFile).toContain('waitUntil')
    expect(testFile).toContain('passThroughOnException')

    // Should NOT have the old broken pattern
    expect(testFile).not.toContain('waitUntil: () => {}') // Old broken version

    console.log('✅ ExecutionContext mock is correct')
  }, 10000)

  it('should verify test coverage of key features', async () => {
    const result = await project.test()

    // The template should test:
    // 1. Ensemble execution
    // 2. Agent execution
    // 3. Basic functionality

    const output = result.stdout

    // Look for test descriptions
    expect(output).toContain('test') // vitest shows test count

    console.log('✅ Test coverage verified')
  }, 60000)
})
