/**
 * TestProject class for managing temporary test projects
 */
export interface TestProjectOptions {
    name?: string;
    preserveOnFailure?: boolean;
}
export interface ExecResult {
    stdout: string;
    stderr: string;
}
/**
 * Manages a temporary test project for integration testing
 */
export declare class TestProject {
    readonly dir: string;
    private options;
    hasFailed: boolean;
    constructor(dir: string, options?: TestProjectOptions);
    /**
     * Create a new test project in a temporary directory
     */
    static create(options?: TestProjectOptions): Promise<TestProject>;
    /**
     * Execute a command in the project directory
     */
    exec(command: string, options?: {
        timeout?: number;
    }): Promise<ExecResult>;
    /**
     * Install Conductor from a local tarball
     */
    installConductor(tarballPath: string): Promise<void>;
    /**
     * Initialize the project with conductor init
     */
    init(): Promise<void>;
    /**
     * Install project dependencies
     */
    install(): Promise<void>;
    /**
     * Build the project
     */
    build(): Promise<ExecResult>;
    /**
     * Run tests
     */
    test(): Promise<ExecResult>;
    /**
     * Check if a file or directory exists
     */
    exists(relativePath: string): Promise<boolean>;
    /**
     * Read a file from the project
     */
    readFile(relativePath: string): Promise<string>;
    /**
     * Write a file to the project
     */
    writeFile(relativePath: string, content: string): Promise<void>;
    /**
     * Create a page
     */
    createPage(name: string, files: {
        yaml: string;
        ts?: string;
    }): Promise<void>;
    /**
     * Create an agent
     */
    createAgent(name: string, files: {
        yaml: string;
        ts?: string;
    }): Promise<void>;
    /**
     * Create an ensemble
     */
    createEnsemble(name: string, yaml: string): Promise<void>;
    /**
     * Clean up the test project
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=test-project.d.ts.map