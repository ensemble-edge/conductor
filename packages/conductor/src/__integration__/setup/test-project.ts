/**
 * TestProject class for managing temporary test projects
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, rm, readFile, writeFile, access, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const execAsync = promisify(exec)

export interface TestProjectOptions {
  name?: string
  preserveOnFailure?: boolean
}

export interface ExecResult {
  stdout: string
  stderr: string
}

/**
 * Manages a temporary test project for integration testing
 */
export class TestProject {
  public hasFailed = false

  constructor(
    public readonly dir: string,
    private options: TestProjectOptions = {}
  ) {}

  /**
   * Create a new test project in a temporary directory
   */
  static async create(options: TestProjectOptions = {}): Promise<TestProject> {
    const prefix = options.name ? `conductor-test-${options.name}-` : 'conductor-test-'
    const testDir = await mkdtemp(join(tmpdir(), prefix))
    console.log(`📁 Created test project: ${testDir}`)
    return new TestProject(testDir, options)
  }

  /**
   * Execute a command in the project directory
   */
  async exec(command: string, options?: { timeout?: number }): Promise<ExecResult> {
    try {
      const result = await execAsync(command, {
        cwd: this.dir,
        timeout: options?.timeout || 120000, // 2 minutes default
        env: { ...process.env, CI: 'true' },
      })
      return result
    } catch (error: any) {
      this.hasFailed = true
      throw error
    }
  }

  /**
   * Install Conductor from a local tarball
   */
  async installConductor(tarballPath: string): Promise<void> {
    console.log(`📦 Installing Conductor from ${tarballPath}...`)
    await this.exec(`npm install ${tarballPath}`, { timeout: 180000 })
    console.log('✅ Conductor installed')
  }

  /**
   * Initialize the project with conductor init
   */
  async init(): Promise<void> {
    console.log('🎬 Running conductor init...')
    await this.exec('npx conductor init . --force', { timeout: 60000 })
    console.log('✅ Project initialized')
  }

  /**
   * Install project dependencies
   */
  async install(): Promise<void> {
    console.log('📦 Installing project dependencies...')
    // Remove package-lock.json to avoid conflicts (template has it)
    await this.exec('rm -f package-lock.json && npm install', { timeout: 180000 })
    console.log('✅ Dependencies installed')
  }

  /**
   * Build the project
   */
  async build(): Promise<ExecResult> {
    console.log('🔨 Building project...')
    const result = await this.exec('npm run build', { timeout: 60000 })
    console.log('✅ Build completed')
    return result
  }

  /**
   * Run tests
   */
  async test(): Promise<ExecResult> {
    console.log('🧪 Running tests...')
    const result = await this.exec('npm test', { timeout: 60000 })
    console.log('✅ Tests completed')
    return result
  }

  /**
   * Check if a file or directory exists
   */
  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(join(this.dir, relativePath))
      return true
    } catch {
      return false
    }
  }

  /**
   * Read a file from the project
   */
  async readFile(relativePath: string): Promise<string> {
    return readFile(join(this.dir, relativePath), 'utf-8')
  }

  /**
   * Write a file to the project
   */
  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = join(this.dir, relativePath)
    // Create parent directories if needed
    const dir = join(fullPath, '..')
    await mkdir(dir, { recursive: true })
    await writeFile(fullPath, content, 'utf-8')
  }

  /**
   * Create a page
   */
  async createPage(name: string, files: { yaml: string; ts?: string }): Promise<void> {
    const pageDir = join('pages', name)
    await mkdir(join(this.dir, pageDir), { recursive: true })

    await this.writeFile(join(pageDir, 'page.yaml'), files.yaml)

    if (files.ts) {
      await this.writeFile(join(pageDir, 'handler.ts'), files.ts)
    }

    console.log(`✅ Created page: ${name}`)
  }

  /**
   * Create an agent
   */
  async createAgent(name: string, files: { yaml: string; ts?: string }): Promise<void> {
    const agentDir = join('agents', name)
    await mkdir(join(this.dir, agentDir), { recursive: true })

    await this.writeFile(join(agentDir, 'agent.yaml'), files.yaml)

    if (files.ts) {
      await this.writeFile(join(agentDir, 'index.ts'), files.ts)
    }

    console.log(`✅ Created agent: ${name}`)
  }

  /**
   * Create an ensemble
   */
  async createEnsemble(name: string, yaml: string): Promise<void> {
    await this.writeFile(join('ensembles', `${name}.yaml`), yaml)
    console.log(`✅ Created ensemble: ${name}`)
  }

  /**
   * Clean up the test project
   */
  async cleanup(): Promise<void> {
    if (this.options.preserveOnFailure && this.hasFailed) {
      console.log(`⚠️  Preserving failed test project: ${this.dir}`)
      return
    }

    try {
      await rm(this.dir, { recursive: true, force: true })
      console.log(`🗑️  Cleaned up test project: ${this.dir}`)
    } catch (error) {
      console.warn(`⚠️  Failed to cleanup ${this.dir}:`, error)
    }
  }
}
