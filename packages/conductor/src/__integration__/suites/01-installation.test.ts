/**
 * Phase 1: Installation Testing
 *
 * Tests the complete installation flow:
 * 1. Build and pack Conductor locally
 * 2. Create new test project
 * 3. Install Conductor from tarball
 * 4. Initialize project with conductor init
 * 5. Install dependencies
 * 6. Verify project structure
 * 7. Build project
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildAndPackConductor } from '../setup/build-pack.js'
import { TestProject } from '../setup/test-project.js'

describe('Phase 1: Installation', () => {
  let tarballPath: string
  let project: TestProject

  beforeAll(async () => {
    // Build and pack Conductor (cached if already done)
    tarballPath = await buildAndPackConductor()
    expect(tarballPath).toBeTruthy()
    console.log('📦 Using tarball:', tarballPath)
  }, 120000) // 2 minutes for build

  afterAll(async () => {
    if (project) {
      await project.cleanup()
    }
  })

  it('should create a test project', async () => {
    project = await TestProject.create({ name: 'installation' })
    expect(project.dir).toBeTruthy()
  }, 10000)

  it('should install Conductor from local tarball', async () => {
    await project.installConductor(tarballPath)

    // Verify installation
    const pkgJsonExists = await project.exists('node_modules/@ensemble-edge/conductor/package.json')
    expect(pkgJsonExists).toBe(true)

    const pkgJson = await project.readFile('node_modules/@ensemble-edge/conductor/package.json')
    const pkg = JSON.parse(pkgJson)
    expect(pkg.name).toBe('@ensemble-edge/conductor')
    expect(pkg.version).toBeTruthy()

    console.log(`✅ Installed: ${pkg.name}@${pkg.version}`)
  }, 180000) // 3 minutes for npm install

  it('should initialize project with conductor init', async () => {
    await project.init()

    // Verify key directories exist (pages deprecated, functionality moved to ensembles)
    expect(await project.exists('agents')).toBe(true)
    expect(await project.exists('ensembles')).toBe(true)
    expect(await project.exists('tests')).toBe(true)

    // Verify key files exist
    expect(await project.exists('wrangler.toml')).toBe(true)
    expect(await project.exists('package.json')).toBe(true)
    expect(await project.exists('vite.config.ts')).toBe(true)
    expect(await project.exists('tsconfig.json')).toBe(true)
    expect(await project.exists('src/index.ts')).toBe(true)

    console.log('✅ Project structure verified')
  }, 60000) // 1 minute

  it('should have correct package.json configuration', async () => {
    const pkgJson = await project.readFile('package.json')
    const pkg = JSON.parse(pkgJson)

    // Check scripts
    expect(pkg.scripts).toBeDefined()
    expect(pkg.scripts.build).toBeDefined()
    expect(pkg.scripts.dev).toBeDefined()
    expect(pkg.scripts.test).toBeDefined()

    // Check dependencies
    expect(pkg.dependencies).toBeDefined()
    expect(pkg.dependencies['@ensemble-edge/conductor']).toBeTruthy()

    console.log('✅ package.json validated')
  }, 10000)

  it('should have correct wrangler.toml configuration', async () => {
    const wranglerToml = await project.readFile('wrangler.toml')

    // Check key settings
    expect(wranglerToml).toContain('main = "dist/index.mjs"')
    expect(wranglerToml).toContain('compatibility_date')
    expect(wranglerToml).toContain('compatibility_flags')

    console.log('✅ wrangler.toml validated')
  }, 10000)

  it('should install project dependencies', async () => {
    await project.install()

    // Verify node_modules exists and has content
    expect(await project.exists('node_modules')).toBe(true)
    expect(await project.exists('node_modules/hono')).toBe(true)
    expect(await project.exists('node_modules/vitest')).toBe(true)

    console.log('✅ Dependencies installed')
  }, 180000) // 3 minutes for npm install

  it('should build successfully', async () => {
    const result = await project.build()

    // Check build output
    expect(result.stdout).toBeTruthy()

    // Verify dist directory
    expect(await project.exists('dist')).toBe(true)
    expect(await project.exists('dist/index.mjs')).toBe(true)

    console.log('✅ Build completed')
  }, 60000) // 1 minute

  it('should have examples in the template', async () => {
    // Check for example ensembles (pages deprecated, functionality moved to ensembles)
    expect(await project.exists('ensembles/examples')).toBe(true)

    // Check for example agents
    expect(await project.exists('agents/examples/hello')).toBe(true)

    // Check for hello-world ensemble
    expect(await project.exists('ensembles/hello-world.yaml')).toBe(true)

    console.log('✅ Template examples verified')
  }, 10000)
})
