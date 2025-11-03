/**
 * Test Conductor - Testing Helper for Conductor Projects
 */

import type { ConductorEnv } from '../types/env';
import type { EnsembleConfig, MemberConfig } from '../runtime/parser';
import { Executor } from '../runtime/executor';
import { Parser } from '../runtime/parser';
import { FunctionMember } from '../members/function-member';
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
	ProjectSnapshot
} from './types';
import { MockAIProvider, MockDatabase, MockHTTPClient, MockVectorize } from './mocks';
import { createLogger } from '../observability';

/**
 * Test helper for executing and testing Conductor ensembles
 */
export class TestConductor {
	private env: Partial<ConductorEnv>;
	private ctx: ExecutionContext;
	private executor: Executor;
	private parser: Parser;
	private mocks: {
		ai?: MockAIProvider;
		database?: MockDatabase;
		http?: MockHTTPClient;
		vectorize?: MockVectorize;
	};
	private executionHistory: ExecutionRecord[] = [];
	private catalog: {
		ensembles: Map<string, EnsembleConfig>;
		members: Map<string, MemberConfig>;
	};

	private constructor(options: TestConductorOptions = {}) {
		// Create mock environment
		this.env = this.createTestEnv(options.env);

		// Create mock execution context
		this.ctx = this.createTestContext();

		// Initialize mocks
		this.mocks = {
			ai: options.mocks?.ai ? new MockAIProvider(options.mocks.ai) : undefined,
			database: options.mocks?.database ? new MockDatabase(options.mocks.database) : undefined,
			http: options.mocks?.http ? new MockHTTPClient(options.mocks.http) : undefined,
			vectorize: options.mocks?.vectorize ? new MockVectorize(options.mocks.vectorize) : undefined
		};

		// Initialize catalog
		this.catalog = {
			ensembles: new Map(),
			members: new Map()
		};

		// Initialize parser and executor
		this.parser = new Parser();
		this.executor = new Executor({
			env: this.env as ConductorEnv,
			ctx: this.ctx,
			logger: createLogger()
		});
	}

	/**
	 * Create a new test conductor instance
	 */
	static async create(options: TestConductorOptions = {}): Promise<TestConductor> {
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
	async executeEnsemble(
		name: string,
		input: Record<string, unknown>
	): Promise<TestExecutionResult> {
		const startTime = performance.now();
		const stepsExecuted: ExecutedStep[] = [];
		const stateHistory: StateSnapshot[] = [];
		const aiCalls: AICall[] = [];
		const databaseQueries: DatabaseQuery[] = [];
		const httpRequests: HTTPRequest[] = [];

		try {
			// Get ensemble config
			const ensemble = this.catalog.ensembles.get(name);
			if (!ensemble) {
				throw new Error(`Ensemble '${name}' not found in catalog`);
			}

			// Execute ensemble
			const result = await this.executor.executeEnsemble(ensemble, input);

			const executionTime = Math.max(0.001, performance.now() - startTime);

			const testResult: TestExecutionResult = {
				success: result.success,
				output: result.success ? result.value.output : undefined,
				error: result.success ? undefined : result.error as Error,
				executionTime,
				stepsExecuted,
				stateHistory,
				aiCalls,
				databaseQueries,
				httpRequests
			};

			// Record execution
			this.executionHistory.push({
				...testResult,
				ensemble: name,
				input,
				timestamp: startTime
			});

			return testResult;
		} catch (error) {
			const executionTime = Math.max(0.001, performance.now() - startTime);

			const testResult: TestExecutionResult = {
				success: false,
				error: error as Error,
				executionTime,
				stepsExecuted,
				stateHistory,
				aiCalls,
				databaseQueries,
				httpRequests
			};

			this.executionHistory.push({
				...testResult,
				ensemble: name,
				input,
				timestamp: startTime
			});

			return testResult;
		}
	}

	/**
	 * Execute a member directly
	 */
	async executeMember(name: string, input: unknown): Promise<TestMemberResult> {
		const member = this.catalog.members.get(name);
		if (!member) {
			throw new Error(`Member '${name}' not found in catalog`);
		}

		const startTime = Date.now();

		// Create execution context
		const context = {
			input,
			config: member.config,
			env: this.env as ConductorEnv,
			ctx: this.ctx,
			logger: createLogger()
		};

		try {
			// Execute member
			// Note: This is simplified - actual implementation would load and execute the member
			const output = { message: 'Mock member execution' };

			return {
				output,
				executionTime: Date.now() - startTime
			};
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Mock AI provider responses
	 */
	mockAI(memberName: string, response: unknown | Error): void {
		if (!this.mocks.ai) {
			this.mocks.ai = new MockAIProvider({});
		}
		this.mocks.ai.setResponse(memberName, response);
	}

	/**
	 * Mock database responses
	 */
	mockDatabase(table: string, data: unknown[]): void {
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
	mockAPI(url: string, response: unknown): void {
		if (!this.mocks.http) {
			this.mocks.http = new MockHTTPClient({});
		}
		this.mocks.http.setRoute(url, response);
	}

	/**
	 * Get execution history
	 */
	getExecutionHistory(): ExecutionRecord[] {
		return this.executionHistory;
	}

	/**
	 * Get AI calls from history
	 */
	getAICalls(): AICall[] {
		return this.executionHistory.flatMap(e => e.aiCalls);
	}

	/**
	 * Get database queries from history
	 */
	getDatabaseQueries(): DatabaseQuery[] {
		return this.executionHistory.flatMap(e => e.databaseQueries);
	}

	/**
	 * Add ensemble to catalog programmatically
	 */
	addEnsemble(name: string, config: EnsembleConfig): void {
		this.catalog.ensembles.set(name, config);
	}

	/**
	 * Add member to catalog programmatically
	 */
	addMember(name: string, config: MemberConfig): void {
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
	getEnsemble(name: string): EnsembleConfig | undefined {
		return this.catalog.ensembles.get(name);
	}

	/**
	 * Get member from catalog
	 */
	getMember(name: string): MemberConfig | undefined {
		return this.catalog.members.get(name);
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
				vectorize: this.mocks.vectorize
			}
		};
	}

	/**
	 * Cleanup test resources
	 */
	async cleanup(): Promise<void> {
		this.mocks.database?.clear();
		this.mocks.http?.clearRoutes();
		this.mocks.vectorize?.clear();
		this.executionHistory = [];
	}

	/**
	 * Load catalog from project directory
	 */
	private async loadCatalog(projectPath: string): Promise<void> {
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
					const config = YAML.parse(content) as EnsembleConfig;
					const name = file.replace(/\.(yaml|yml)$/, '');
					this.catalog.ensembles.set(name, config);
				}
			}
		} catch (error) {
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
					const config = YAML.parse(content) as MemberConfig;
					const name = entry.name.replace(/\.(yaml|yml)$/, '');
					this.catalog.members.set(name, config);
				}
				// Case 2: Subdirectory with member.yaml (e.g., members/greet/member.yaml)
				else if (entry.isDirectory()) {
					const memberFilePath = path.join(membersPath, entry.name, 'member.yaml');
					try {
						const content = await fs.readFile(memberFilePath, 'utf-8');
						const config = YAML.parse(content) as MemberConfig;
						// Use the member name from the config, not the directory name
						this.catalog.members.set(config.name, config);
					} catch {
						// Try member.yml as fallback
						try {
							const memberFilePathYml = path.join(membersPath, entry.name, 'member.yml');
							const content = await fs.readFile(memberFilePathYml, 'utf-8');
							const config = YAML.parse(content) as MemberConfig;
							this.catalog.members.set(config.name, config);
						} catch {
							// No member.yaml or member.yml in this directory, skip it
						}
					}
				}
			}
		} catch (error) {
			// Members directory doesn't exist or is empty - silently skip
		}
	}

	/**
	 * Create test environment
	 */
	private createTestEnv(envOverride?: Record<string, unknown>): Partial<ConductorEnv> {
		return {
			// Mock Cloudflare bindings
			AI: {} as ConductorEnv['AI'],
			...envOverride
		};
	}

	/**
	 * Create test execution context
	 */
	private createTestContext(): ExecutionContext {
		return {
			waitUntil: (promise: Promise<unknown>) => {
				// In tests, we can just await promises immediately
				promise.catch(error => console.error('waitUntil error:', error));
			},
			passThroughOnException: () => {
				// No-op in tests
			}
		} as ExecutionContext;
	}
}
