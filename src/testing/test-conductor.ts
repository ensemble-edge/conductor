/**
 * Test Conductor - Testing Helper for Conductor Projects
 */

import type { ConductorEnv } from '../types/env.js'
import type { EnsembleConfig, AgentConfig } from '../runtime/parser.js'
import { Operation } from '../types/constants.js'
import { Executor } from '../runtime/executor.js'
import { Parser } from '../runtime/parser.js'
import { FunctionAgent } from '../agents/function-agent.js'
import { ThinkAgent } from '../agents/think-agent.js'
import { APIAgent } from '../agents/api-agent.js'
import { DataAgent } from '../agents/data-agent.js'
import type {
  TestConductorOptions,
  TestExecutionResult,
  TestMemberResult,
  ExecutedStep,
  StateSnapshot,
  AICall,
  DatabaseQuery,
  HTTPRequest,
  ExecutionRecord,
  ProjectSnapshot,
} from './types.js'
import { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize } from './mocks.js'
import { createLogger } from '../observability/index.js'
import { ProviderRegistry } from '../agents/think-providers/index.js'

/**
 * Test helper for executing and testing Conductor ensembles
 */
export class TestConductor {
  private env: Partial<ConductorEnv>
  private ctx: ExecutionContext
  private executor: Executor
  private parser: Parser
  private mocks: {
    ai?: MockAIProvider
    database?: MockDatabase
    http?: MockHTTPClient
    vectorize?: MockVectorize
  }
  private mockProviderRegistry: ProviderRegistry
  private executionHistory: ExecutionRecord[] = []
  private catalog: {
    ensembles: Map<string, EnsembleConfig>
    agents: Map<string, AgentConfig>
  }

  private constructor(options: TestConductorOptions = {}) {
    // Create mock environment
    this.env = this.createTestEnv(options.env)

    // Create mock execution context
    this.ctx = this.createTestContext()

    // Initialize mocks
    // Create AI call tracker
    const aiCallTracker = (call: any) => {
      // Only track if we have an active execution
      if (this.executionHistory.length > 0) {
        this.executionHistory[this.executionHistory.length - 1]?.aiCalls.push({
          agent: call.agentName || 'unknown',
          model: call.response.model,
          prompt: JSON.stringify(call.request.messages),
          response: call.response.content,
          duration: 0, // Duration not tracked yet
        })
      }
    }

    this.mocks = {
      ai: options.mocks?.ai
        ? new MockAIProvider(options.mocks.ai, 'mock', undefined, aiCallTracker)
        : new MockAIProvider({}, 'mock', undefined, aiCallTracker),
      database: options.mocks?.database ? new MockDatabase(options.mocks.database) : undefined,
      http: options.mocks?.http ? new MockHTTPClient(options.mocks.http) : undefined,
      vectorize: options.mocks?.vectorize ? new MockVectorize(options.mocks.vectorize) : undefined,
    }

    // Initialize mock provider registry for AI testing
    // Register mock providers under all standard provider names
    // so we intercept all AI calls regardless of configured provider
    this.mockProviderRegistry = new ProviderRegistry()
    if (this.mocks.ai) {
      // Get the shared responses map from the main mock
      const sharedResponses = this.mocks.ai.getResponsesMap()

      // Create mock provider instances for each provider ID,
      // all sharing the same responses map and tracker
      this.mockProviderRegistry.register(
        new MockAIProvider({}, 'anthropic', sharedResponses, aiCallTracker)
      )
      this.mockProviderRegistry.register(
        new MockAIProvider({}, 'openai', sharedResponses, aiCallTracker)
      )
      this.mockProviderRegistry.register(
        new MockAIProvider({}, 'cloudflare', sharedResponses, aiCallTracker)
      )
      this.mockProviderRegistry.register(
        new MockAIProvider({}, 'custom', sharedResponses, aiCallTracker)
      )
      this.mockProviderRegistry.register(this.mocks.ai)
    }

    // Initialize catalog
    this.catalog = {
      ensembles: new Map(),
      agents: new Map(),
    }

    // Initialize parser and executor
    this.parser = new Parser()
    this.executor = new Executor({
      env: this.env as ConductorEnv,
      ctx: this.ctx,
      logger: createLogger(),
    })
  }

  /**
   * Create a new test conductor instance
   */
  static async create(options: TestConductorOptions = {}): Promise<TestConductor> {
    const conductor = new TestConductor(options)

    // Load catalog if projectPath provided
    if (options.projectPath) {
      await conductor.loadCatalog(options.projectPath)
    }

    return conductor
  }

  /**
   * Execute an ensemble in test mode
   */
  async executeEnsemble(
    name: string,
    input: Record<string, unknown>
  ): Promise<TestExecutionResult> {
    const startTime = performance.now()
    const stepsExecuted: ExecutedStep[] = []
    const stateHistory: StateSnapshot[] = []
    const aiCalls: AICall[] = []
    const databaseQueries: DatabaseQuery[] = []
    const httpRequests: HTTPRequest[] = []

    try {
      // Get ensemble config
      const ensemble = this.catalog.ensembles.get(name)
      if (!ensemble) {
        throw new Error(`Ensemble '${name}' not found in catalog`)
      }

      // Record execution before executing (so AI tracker can access it)
      const testResult: TestExecutionResult = {
        success: false,
        executionTime: 0,
        stepsExecuted,
        stateHistory,
        aiCalls,
        databaseQueries,
        httpRequests,
      }

      this.executionHistory.push({
        ...testResult,
        ensemble: name,
        input,
        timestamp: startTime,
      })

      // Execute ensemble
      const result = await this.executor.executeEnsemble(ensemble, input)

      const executionTime = Math.max(0.001, performance.now() - startTime)

      // Basic step tracking - populate with flow steps if execution succeeded
      // TODO: Enhanced tracking requires instrumenting Executor for per-step input/output
      if (result.success && ensemble.flow) {
        for (const step of ensemble.flow) {
          stepsExecuted.push({
            agent: step.agent,
            input: {}, // Not tracked yet
            output: {}, // Not tracked yet
            duration: 0,
            success: true,
          })
        }
      }

      // Update the test result
      testResult.success = result.success
      testResult.output = result.success ? result.value.output : undefined
      testResult.error = result.success ? undefined : (result.error as Error)
      testResult.executionTime = executionTime

      // Update the execution history entry
      const historyEntry = this.executionHistory[this.executionHistory.length - 1]
      if (historyEntry) {
        historyEntry.success = testResult.success
        historyEntry.output = testResult.output
        historyEntry.error = testResult.error
        historyEntry.executionTime = testResult.executionTime
      }

      return testResult
    } catch (error) {
      const executionTime = Math.max(0.001, performance.now() - startTime)

      const testResult: TestExecutionResult = {
        success: false,
        error: error as Error,
        executionTime,
        stepsExecuted,
        stateHistory,
        aiCalls,
        databaseQueries,
        httpRequests,
      }

      this.executionHistory.push({
        ...testResult,
        ensemble: name,
        input,
        timestamp: startTime,
      })

      return testResult
    }
  }

  /**
   * Execute a agent directly
   */
  async executeAgent(name: string, input: unknown): Promise<TestMemberResult> {
    const config = this.catalog.agents.get(name)
    if (!config) {
      throw new Error(`Agent '${name}' not found in catalog`)
    }

    const startTime = Date.now()

    try {
      // Instantiate the agent based on its type
      const normalizedType =
        String(config.operation).charAt(0).toUpperCase() + String(config.operation).slice(1)
      let agent

      if (normalizedType === Operation.think) {
        agent = new ThinkAgent(config, this.mockProviderRegistry)
      } else if (normalizedType === Operation.http) {
        agent = new APIAgent(config)
      } else if (normalizedType === Operation.storage) {
        agent = new DataAgent(config)
      } else if (normalizedType === Operation.code) {
        throw new Error('Function agents not yet supported in executeAgent')
      } else {
        throw new Error(`Unknown agent type: ${config.operation}`)
      }

      // Execute the agent
      const result = await agent.execute({
        input: input as Record<string, unknown>,
        env: this.env as ConductorEnv,
        ctx: this.ctx,
      })

      // If agent execution failed, throw the error
      if (!result.success) {
        throw new Error(result.error || 'Agent execution failed')
      }

      return {
        output: result.data,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      // Re-throw to let test handle it
      throw error
    }
  }

  /**
   * Mock AI provider responses
   */
  mockAI(agentName: string, response: unknown | Error): void {
    if (!this.mocks.ai) {
      this.mocks.ai = new MockAIProvider({})
      this.mockProviderRegistry.register(this.mocks.ai)
    }
    this.mocks.ai.setResponse(agentName, response)
  }

  /**
   * Mock database responses
   */
  mockDatabase(table: string, data: unknown[]): void {
    if (!this.mocks.database) {
      this.mocks.database = new MockDatabase({})
    }
    this.mocks.database.clear(table)
    for (const record of data) {
      this.mocks.database.insert(table, record)
    }
  }

  /**
   * Mock external API responses
   */
  mockAPI(url: string, response: unknown): void {
    if (!this.mocks.http) {
      this.mocks.http = new MockHTTPClient({})
    }
    this.mocks.http.setRoute(url, response)
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionRecord[] {
    return this.executionHistory
  }

  /**
   * Get AI calls from history
   */
  getAICalls(): AICall[] {
    return this.executionHistory.flatMap((e) => e.aiCalls)
  }

  /**
   * Get database queries from history
   */
  getDatabaseQueries(): DatabaseQuery[] {
    return this.executionHistory.flatMap((e) => e.databaseQueries)
  }

  /**
   * Add ensemble to catalog programmatically
   */
  addEnsemble(name: string, config: EnsembleConfig): void {
    this.catalog.ensembles.set(name, config)
  }

  /**
   * Add agent to catalog programmatically
   */
  addAgent(name: string, config: AgentConfig): void {
    this.catalog.agents.set(name, config)

    // If it's a code agent with an inline handler, register it with the executor
    if (config.operation === 'code') {
      const functionMember = FunctionAgent.fromConfig(config)
      if (functionMember) {
        this.executor.registerAgent(functionMember)
      }
    }
  }

  /**
   * Get ensemble from catalog
   */
  getEnsemble(name: string): EnsembleConfig | undefined {
    return this.catalog.ensembles.get(name)
  }

  /**
   * Get agent from catalog
   */
  getAgent(name: string): AgentConfig | undefined {
    return this.catalog.agents.get(name)
  }

  /**
   * Create project snapshot
   */
  async snapshot(): Promise<ProjectSnapshot> {
    return {
      catalog: this.catalog,
      state: {},
      mocks: {
        ai: this.mocks.ai,
        database: this.mocks.database,
        http: this.mocks.http,
        vectorize: this.mocks.vectorize,
      },
    }
  }

  /**
   * Cleanup test resources
   */
  async cleanup(): Promise<void> {
    this.mocks.database?.clear()
    this.mocks.http?.clearRoutes()
    this.mocks.vectorize?.clear()
    this.executionHistory = []
  }

  /**
   * Load catalog from project directory
   */
  private async loadCatalog(projectPath: string): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')
    const YAML = await import('yaml')

    // Resolve to absolute path
    const absoluteProjectPath = path.resolve(process.cwd(), projectPath)

    // Load ensembles
    const ensemblesPath = path.join(absoluteProjectPath, 'ensembles')
    try {
      const ensembleFiles = await fs.readdir(ensemblesPath)
      for (const file of ensembleFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const content = await fs.readFile(path.join(ensemblesPath, file), 'utf-8')
          const config = YAML.parse(content) as EnsembleConfig
          const name = file.replace(/\.(yaml|yml)$/, '')
          this.catalog.ensembles.set(name, config)
        }
      }
    } catch (error) {
      // Ensembles directory doesn't exist or is empty
    }

    // Load agents
    const membersPath = path.join(absoluteProjectPath, 'agents')
    try {
      const memberEntries = await fs.readdir(membersPath, { withFileTypes: true })
      for (const entry of memberEntries) {
        // Case 1: Direct YAML file (e.g., agents/greet.yaml)
        if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          const content = await fs.readFile(path.join(membersPath, entry.name), 'utf-8')
          const config = YAML.parse(content) as AgentConfig
          const name = entry.name.replace(/\.(yaml|yml)$/, '')
          this.catalog.agents.set(name, config)
        }
        // Case 2: Subdirectory with agent.yaml (e.g., agents/greet/agent.yaml)
        else if (entry.isDirectory()) {
          const memberFilePath = path.join(membersPath, entry.name, 'agent.yaml')
          try {
            const content = await fs.readFile(memberFilePath, 'utf-8')
            const config = YAML.parse(content) as AgentConfig
            // Use the agent name from the config, not the directory name
            this.catalog.agents.set(config.name, config)
          } catch {
            // Try agent.yml as fallback
            try {
              const memberFilePathYml = path.join(membersPath, entry.name, 'agent.yml')
              const content = await fs.readFile(memberFilePathYml, 'utf-8')
              const config = YAML.parse(content) as AgentConfig
              this.catalog.agents.set(config.name, config)
            } catch {
              // No agent.yaml or agent.yml in this directory, skip it
            }
          }
        }
      }
    } catch (error) {
      // Members directory doesn't exist or is empty - silently skip
    }

    // Register loaded agents with the executor
    await this.registerLoadedMembers()
  }

  /**
   * Register loaded agents with the executor
   */
  private async registerLoadedMembers(): Promise<void> {
    for (const [name, config] of this.catalog.agents.entries()) {
      try {
        let agent

        // Instantiate appropriate agent type based on config
        // Normalize type comparison (YAML uses lowercase, enum uses capitalized)
        const normalizedType =
          String(config.operation).charAt(0).toUpperCase() + String(config.operation).slice(1)

        if (normalizedType === Operation.think) {
          // Pass mock provider registry to ThinkAgent for testing
          agent = new ThinkAgent(config, this.mockProviderRegistry)
        } else if (normalizedType === Operation.http) {
          agent = new APIAgent(config)
        } else if (normalizedType === Operation.storage) {
          agent = new DataAgent(config)
        } else if (normalizedType === Operation.code) {
          // For function agents, we'd need to load the actual function
          // For now, skip registration - function agents need special handling
          continue
        } else {
          // Skip unknown types - they might be built-in agents that don't need registration
          continue
        }

        // Register with executor
        this.executor.registerAgent(agent)
      } catch (error) {
        console.error(`Failed to register agent '${name}':`, error)
      }
    }
  }

  /**
   * Create test environment
   */
  private createTestEnv(envOverride?: Record<string, unknown>): Partial<ConductorEnv> {
    return {
      // Mock Cloudflare bindings
      AI: {} as ConductorEnv['AI'],
      ...envOverride,
    }
  }

  /**
   * Create test execution context
   */
  private createTestContext(): ExecutionContext {
    return {
      waitUntil: (promise: Promise<unknown>) => {
        // In tests, we can just await promises immediately
        promise.catch((error) => console.error('waitUntil error:', error))
      },
      passThroughOnException: () => {
        // No-op in tests
      },
    } as ExecutionContext
  }
}
