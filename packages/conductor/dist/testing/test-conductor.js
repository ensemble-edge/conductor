/**
 * Test Conductor - Testing Helper for Conductor Projects
 */
/**
 * Type guard to check if a flow step is an agent step
 */
function isAgentStep(step) {
    return 'agent' in step && typeof step.agent === 'string';
}
import { Operation } from '../types/constants.js';
import { Executor } from '../runtime/executor.js';
import { Parser } from '../runtime/parser.js';
import { FunctionAgent } from '../agents/function-agent.js';
import { ThinkAgent } from '../agents/think-agent.js';
import { APIAgent } from '../agents/api-agent.js';
import { DataAgent } from '../agents/data-agent.js';
import { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize } from './mocks.js';
import { createLogger } from '../observability/index.js';
import { ProviderRegistry } from '../agents/think-providers/index.js';
/**
 * Test helper for executing and testing Conductor ensembles
 */
export class TestConductor {
    constructor(options = {}) {
        this.executionHistory = [];
        // Create mock environment
        this.env = this.createTestEnv(options.env);
        // Create mock execution context
        this.ctx = this.createTestContext();
        // Initialize mocks
        // Create AI call tracker
        const aiCallTracker = (call) => {
            // Only track if we have an active execution
            if (this.executionHistory.length > 0) {
                this.executionHistory[this.executionHistory.length - 1]?.aiCalls.push({
                    agent: call.agentName || 'unknown',
                    model: call.response.model,
                    prompt: JSON.stringify(call.request.messages),
                    response: call.response.content,
                    duration: 0, // Duration not tracked yet
                });
            }
        };
        this.mocks = {
            ai: options.mocks?.ai
                ? new MockAIProvider(options.mocks.ai, 'mock', undefined, aiCallTracker)
                : new MockAIProvider({}, 'mock', undefined, aiCallTracker),
            database: options.mocks?.database ? new MockDatabase(options.mocks.database) : undefined,
            http: options.mocks?.http ? new MockHTTPClient(options.mocks.http) : undefined,
            vectorize: options.mocks?.vectorize ? new MockVectorize(options.mocks.vectorize) : undefined,
        };
        // Initialize mock provider registry for AI testing
        // Register mock providers under all standard provider names
        // so we intercept all AI calls regardless of configured provider
        this.mockProviderRegistry = new ProviderRegistry();
        if (this.mocks.ai) {
            // Get the shared responses map from the main mock
            const sharedResponses = this.mocks.ai.getResponsesMap();
            // Create mock provider instances for each provider ID,
            // all sharing the same responses map and tracker
            this.mockProviderRegistry.register(new MockAIProvider({}, 'anthropic', sharedResponses, aiCallTracker));
            this.mockProviderRegistry.register(new MockAIProvider({}, 'openai', sharedResponses, aiCallTracker));
            this.mockProviderRegistry.register(new MockAIProvider({}, 'cloudflare', sharedResponses, aiCallTracker));
            this.mockProviderRegistry.register(new MockAIProvider({}, 'custom', sharedResponses, aiCallTracker));
            this.mockProviderRegistry.register(this.mocks.ai);
        }
        // Initialize catalog
        this.catalog = {
            ensembles: new Map(),
            agents: new Map(),
        };
        // Initialize parser and executor
        this.parser = new Parser();
        this.executor = new Executor({
            env: this.env,
            ctx: this.ctx,
            logger: createLogger(),
        });
    }
    /**
     * Create a new test conductor instance
     */
    static async create(options = {}) {
        const conductor = new TestConductor(options);
        // Load catalog if projectPath provided
        if (options.projectPath) {
            await conductor.loadCatalog(options.projectPath);
        }
        return conductor;
    }
    /**
     * Execute an ensemble in test mode
     */
    async executeEnsemble(name, input) {
        const startTime = performance.now();
        const stepsExecuted = [];
        const stateHistory = [];
        const aiCalls = [];
        const databaseQueries = [];
        const httpRequests = [];
        try {
            // Get ensemble config
            const ensemble = this.catalog.ensembles.get(name);
            if (!ensemble) {
                throw new Error(`Ensemble '${name}' not found in catalog`);
            }
            // Record execution before executing (so AI tracker can access it)
            const testResult = {
                success: false,
                executionTime: 0,
                stepsExecuted,
                stateHistory,
                aiCalls,
                databaseQueries,
                httpRequests,
            };
            this.executionHistory.push({
                ...testResult,
                ensemble: name,
                input,
                timestamp: startTime,
            });
            // Execute ensemble
            const result = await this.executor.executeEnsemble(ensemble, input);
            const executionTime = Math.max(0.001, performance.now() - startTime);
            // Basic step tracking - populate with flow steps if execution succeeded
            // TODO: Enhanced tracking requires instrumenting Executor for per-step input/output
            if (result.success && ensemble.flow) {
                for (const step of ensemble.flow) {
                    // Only track agent steps (not control flow steps)
                    if (isAgentStep(step)) {
                        stepsExecuted.push({
                            agent: step.agent,
                            input: {}, // Not tracked yet
                            output: {}, // Not tracked yet
                            duration: 0,
                            success: true,
                        });
                    }
                }
            }
            // Update the test result
            testResult.success = result.success;
            testResult.output = result.success ? result.value.output : undefined;
            testResult.error = result.success ? undefined : result.error;
            testResult.executionTime = executionTime;
            // Update the execution history entry
            const historyEntry = this.executionHistory[this.executionHistory.length - 1];
            if (historyEntry) {
                historyEntry.success = testResult.success;
                historyEntry.output = testResult.output;
                historyEntry.error = testResult.error;
                historyEntry.executionTime = testResult.executionTime;
            }
            return testResult;
        }
        catch (error) {
            const executionTime = Math.max(0.001, performance.now() - startTime);
            const testResult = {
                success: false,
                error: error,
                executionTime,
                stepsExecuted,
                stateHistory,
                aiCalls,
                databaseQueries,
                httpRequests,
            };
            this.executionHistory.push({
                ...testResult,
                ensemble: name,
                input,
                timestamp: startTime,
            });
            return testResult;
        }
    }
    /**
     * Execute a agent directly
     */
    async executeAgent(name, input) {
        const config = this.catalog.agents.get(name);
        if (!config) {
            throw new Error(`Agent '${name}' not found in catalog`);
        }
        const startTime = Date.now();
        try {
            // Instantiate the agent based on its type
            const normalizedType = String(config.operation).charAt(0).toUpperCase() + String(config.operation).slice(1);
            let agent;
            if (normalizedType === Operation.think) {
                agent = new ThinkAgent(config, this.mockProviderRegistry);
            }
            else if (normalizedType === Operation.http) {
                agent = new APIAgent(config);
            }
            else if (normalizedType === Operation.storage) {
                agent = new DataAgent(config);
            }
            else if (normalizedType === Operation.code) {
                throw new Error('Function agents not yet supported in executeAgent');
            }
            else {
                throw new Error(`Unknown agent type: ${config.operation}`);
            }
            // Execute the agent
            const result = await agent.execute({
                input: input,
                env: this.env,
                ctx: this.ctx,
            });
            // If agent execution failed, throw the error
            if (!result.success) {
                throw new Error(result.error || 'Agent execution failed');
            }
            return {
                output: result.data,
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            // Re-throw to let test handle it
            throw error;
        }
    }
    /**
     * Mock AI provider responses
     */
    mockAI(agentName, response) {
        if (!this.mocks.ai) {
            this.mocks.ai = new MockAIProvider({});
            this.mockProviderRegistry.register(this.mocks.ai);
        }
        this.mocks.ai.setResponse(agentName, response);
    }
    /**
     * Mock database responses
     */
    mockDatabase(table, data) {
        if (!this.mocks.database) {
            this.mocks.database = new MockDatabase({});
        }
        this.mocks.database.clear(table);
        for (const record of data) {
            this.mocks.database.insert(table, record);
        }
    }
    /**
     * Mock external API responses
     */
    mockAPI(url, response) {
        if (!this.mocks.http) {
            this.mocks.http = new MockHTTPClient({});
        }
        this.mocks.http.setRoute(url, response);
    }
    /**
     * Get execution history
     */
    getExecutionHistory() {
        return this.executionHistory;
    }
    /**
     * Get AI calls from history
     */
    getAICalls() {
        return this.executionHistory.flatMap((e) => e.aiCalls);
    }
    /**
     * Get database queries from history
     */
    getDatabaseQueries() {
        return this.executionHistory.flatMap((e) => e.databaseQueries);
    }
    /**
     * Add ensemble to catalog programmatically
     */
    addEnsemble(name, config) {
        this.catalog.ensembles.set(name, config);
    }
    /**
     * Add agent to catalog programmatically
     */
    addAgent(name, config) {
        this.catalog.agents.set(name, config);
        // If it's a code agent with an inline handler, register it with the executor
        if (config.operation === 'code') {
            const functionMember = FunctionAgent.fromConfig(config);
            if (functionMember) {
                this.executor.registerAgent(functionMember);
            }
        }
    }
    /**
     * Get ensemble from catalog
     */
    getEnsemble(name) {
        return this.catalog.ensembles.get(name);
    }
    /**
     * Get agent from catalog
     */
    getAgent(name) {
        return this.catalog.agents.get(name);
    }
    /**
     * Create project snapshot
     */
    async snapshot() {
        return {
            catalog: this.catalog,
            state: {},
            mocks: {
                ai: this.mocks.ai,
                database: this.mocks.database,
                http: this.mocks.http,
                vectorize: this.mocks.vectorize,
            },
        };
    }
    /**
     * Cleanup test resources
     */
    async cleanup() {
        this.mocks.database?.clear();
        this.mocks.http?.clearRoutes();
        this.mocks.vectorize?.clear();
        this.executionHistory = [];
    }
    /**
     * Load catalog from project directory
     */
    async loadCatalog(projectPath) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const YAML = await import('yaml');
        // Resolve to absolute path
        const absoluteProjectPath = path.resolve(process.cwd(), projectPath);
        // Load ensembles
        const ensemblesPath = path.join(absoluteProjectPath, 'ensembles');
        try {
            const ensembleFiles = await fs.readdir(ensemblesPath);
            for (const file of ensembleFiles) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const content = await fs.readFile(path.join(ensemblesPath, file), 'utf-8');
                    const config = YAML.parse(content, {
                        mapAsMap: false,
                        logLevel: 'silent',
                    });
                    const name = file.replace(/\.(yaml|yml)$/, '');
                    this.catalog.ensembles.set(name, config);
                }
            }
        }
        catch (error) {
            // Ensembles directory doesn't exist or is empty
        }
        // Load agents (supports nested directories for three-tier organization)
        const membersPath = path.join(absoluteProjectPath, 'agents');
        try {
            await this.loadAgentsRecursive(membersPath, fs, path, YAML);
        }
        catch (error) {
            // Members directory doesn't exist or is empty - silently skip
        }
        // Register loaded agents with the executor
        await this.registerLoadedMembers();
    }
    /**
     * Recursively load agents from directory tree
     * Supports three-tier organization: agents/, agents/docs/, agents/examples/
     */
    async loadAgentsRecursive(dirPath, fs, path, YAML) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                // Case 1: Direct YAML file (e.g., agents/greet.yaml or agents/docs/docs-simple.yaml)
                if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const config = YAML.parse(content, {
                            mapAsMap: false,
                            logLevel: 'silent',
                        });
                        const name = entry.name.replace(/\.(yaml|yml)$/, '');
                        this.catalog.agents.set(name, config);
                    }
                    catch (error) {
                        // Failed to parse agent config, skip it
                    }
                }
                // Case 2: Directory - check for agent.yaml inside or recurse
                else if (entry.isDirectory()) {
                    // First, try to load agent.yaml from this directory
                    const agentYamlPath = path.join(fullPath, 'agent.yaml');
                    const agentYmlPath = path.join(fullPath, 'agent.yml');
                    let configLoaded = false;
                    // Try agent.yaml
                    try {
                        const content = await fs.readFile(agentYamlPath, 'utf-8');
                        const config = YAML.parse(content, {
                            mapAsMap: false,
                            logLevel: 'silent',
                        });
                        this.catalog.agents.set(config.name, config);
                        configLoaded = true;
                    }
                    catch {
                        // Try agent.yml as fallback
                        try {
                            const content = await fs.readFile(agentYmlPath, 'utf-8');
                            const config = YAML.parse(content, {
                                mapAsMap: false,
                                logLevel: 'silent',
                            });
                            this.catalog.agents.set(config.name, config);
                            configLoaded = true;
                        }
                        catch {
                            // No agent config in this directory
                        }
                    }
                    // If no agent config was found, recurse into subdirectories
                    // This allows for organization directories like agents/docs/ or agents/examples/
                    if (!configLoaded) {
                        await this.loadAgentsRecursive(fullPath, fs, path, YAML);
                    }
                }
            }
        }
        catch (error) {
            // Directory doesn't exist or can't be read - silently skip
        }
    }
    /**
     * Register loaded agents with the executor
     */
    async registerLoadedMembers() {
        for (const [name, config] of this.catalog.agents.entries()) {
            try {
                let agent;
                // Instantiate appropriate agent type based on config
                // Normalize type comparison (YAML uses lowercase, enum uses capitalized)
                const normalizedType = String(config.operation).charAt(0).toUpperCase() + String(config.operation).slice(1);
                if (normalizedType === Operation.think) {
                    // Pass mock provider registry to ThinkAgent for testing
                    agent = new ThinkAgent(config, this.mockProviderRegistry);
                }
                else if (normalizedType === Operation.http) {
                    agent = new APIAgent(config);
                }
                else if (normalizedType === Operation.storage) {
                    agent = new DataAgent(config);
                }
                else if (normalizedType === Operation.code) {
                    // For function agents, we'd need to load the actual function
                    // For now, skip registration - function agents need special handling
                    continue;
                }
                else if (normalizedType === Operation.docs) {
                    // Docs agents are configuration-only, skip registration in testing
                    // They work in full runtime but not in isolated agent testing
                    continue;
                }
                else {
                    // Skip unknown types - they might be built-in agents that don't need registration
                    continue;
                }
                // Register with executor
                this.executor.registerAgent(agent);
            }
            catch (error) {
                console.error(`Failed to register agent '${name}':`, error);
            }
        }
    }
    /**
     * Create test environment
     */
    createTestEnv(envOverride) {
        return {
            // Mock Cloudflare bindings
            AI: {},
            ...envOverride,
        };
    }
    /**
     * Create test execution context
     */
    createTestContext() {
        return {
            waitUntil: (promise) => {
                // In tests, we can just await promises immediately
                promise.catch((error) => console.error('waitUntil error:', error));
            },
            passThroughOnException: () => {
                // No-op in tests
            },
        };
    }
}
