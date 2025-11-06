/**
 * Test Conductor - Testing Helper for Conductor Projects
 */
import { Executor } from '../runtime/executor.js';
import { Parser } from '../runtime/parser.js';
import { FunctionMember } from '../members/function-member.js';
import { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize } from './mocks.js';
import { createLogger } from '../observability/index.js';
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
        this.mocks = {
            ai: options.mocks?.ai ? new MockAIProvider(options.mocks.ai) : undefined,
            database: options.mocks?.database ? new MockDatabase(options.mocks.database) : undefined,
            http: options.mocks?.http ? new MockHTTPClient(options.mocks.http) : undefined,
            vectorize: options.mocks?.vectorize ? new MockVectorize(options.mocks.vectorize) : undefined,
        };
        // Initialize catalog
        this.catalog = {
            ensembles: new Map(),
            members: new Map(),
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
            // Execute ensemble
            const result = await this.executor.executeEnsemble(ensemble, input);
            const executionTime = Math.max(0.001, performance.now() - startTime);
            const testResult = {
                success: result.success,
                output: result.success ? result.value.output : undefined,
                error: result.success ? undefined : result.error,
                executionTime,
                stepsExecuted,
                stateHistory,
                aiCalls,
                databaseQueries,
                httpRequests,
            };
            // Record execution
            this.executionHistory.push({
                ...testResult,
                ensemble: name,
                input,
                timestamp: startTime,
            });
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
     * Execute a member directly
     */
    async executeMember(name, input) {
        const member = this.catalog.members.get(name);
        if (!member) {
            throw new Error(`Member '${name}' not found in catalog`);
        }
        const startTime = Date.now();
        // Create execution context
        const context = {
            input,
            config: member.config,
            env: this.env,
            ctx: this.ctx,
            logger: createLogger(),
        };
        try {
            // Execute member
            // Note: This is simplified - actual implementation would load and execute the member
            const output = { message: 'Mock member execution' };
            return {
                output,
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Mock AI provider responses
     */
    mockAI(memberName, response) {
        if (!this.mocks.ai) {
            this.mocks.ai = new MockAIProvider({});
        }
        this.mocks.ai.setResponse(memberName, response);
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
     * Add member to catalog programmatically
     */
    addMember(name, config) {
        this.catalog.members.set(name, config);
        // If it's a Function member with an inline handler, register it with the executor
        if (config.type === 'Function') {
            const functionMember = FunctionMember.fromConfig(config);
            if (functionMember) {
                this.executor.registerMember(functionMember);
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
     * Get member from catalog
     */
    getMember(name) {
        return this.catalog.members.get(name);
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
                    const config = YAML.parse(content);
                    const name = file.replace(/\.(yaml|yml)$/, '');
                    this.catalog.ensembles.set(name, config);
                }
            }
        }
        catch (error) {
            // Ensembles directory doesn't exist or is empty
        }
        // Load members
        const membersPath = path.join(absoluteProjectPath, 'members');
        try {
            const memberEntries = await fs.readdir(membersPath, { withFileTypes: true });
            for (const entry of memberEntries) {
                // Case 1: Direct YAML file (e.g., members/greet.yaml)
                if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
                    const content = await fs.readFile(path.join(membersPath, entry.name), 'utf-8');
                    const config = YAML.parse(content);
                    const name = entry.name.replace(/\.(yaml|yml)$/, '');
                    this.catalog.members.set(name, config);
                }
                // Case 2: Subdirectory with member.yaml (e.g., members/greet/member.yaml)
                else if (entry.isDirectory()) {
                    const memberFilePath = path.join(membersPath, entry.name, 'member.yaml');
                    try {
                        const content = await fs.readFile(memberFilePath, 'utf-8');
                        const config = YAML.parse(content);
                        // Use the member name from the config, not the directory name
                        this.catalog.members.set(config.name, config);
                    }
                    catch {
                        // Try member.yml as fallback
                        try {
                            const memberFilePathYml = path.join(membersPath, entry.name, 'member.yml');
                            const content = await fs.readFile(memberFilePathYml, 'utf-8');
                            const config = YAML.parse(content);
                            this.catalog.members.set(config.name, config);
                        }
                        catch {
                            // No member.yaml or member.yml in this directory, skip it
                        }
                    }
                }
            }
        }
        catch (error) {
            // Members directory doesn't exist or is empty - silently skip
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
