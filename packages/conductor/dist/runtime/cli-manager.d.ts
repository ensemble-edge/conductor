/**
 * CLI Manager
 *
 * Manages CLI-triggered ensemble execution.
 * Ensembles with CLI triggers can be invoked via `conductor run <command>`.
 *
 * Use cases:
 * - Generate documentation on demand
 * - Run data migrations
 * - Execute maintenance tasks
 * - Custom development commands
 */
import type { EnsembleConfig } from './parser.js';
import { type Logger } from '../observability/index.js';
/**
 * CLI command option definition
 */
export interface CLIOption {
    name: string;
    type?: 'string' | 'number' | 'boolean';
    default?: string | number | boolean;
    description?: string;
    required?: boolean;
}
/**
 * CLI command metadata
 */
export interface CLICommandMetadata {
    command: string;
    description?: string;
    options: CLIOption[];
    ensembleName: string;
}
/**
 * CLI execution result
 */
export interface CLIExecutionResult {
    command: string;
    ensemble: string;
    success: boolean;
    duration: number;
    output?: unknown;
    error?: string;
}
/**
 * CLI Manager
 *
 * Coordinates CLI-triggered ensemble execution.
 */
export declare class CLIManager {
    private readonly commands;
    private readonly logger;
    constructor(logger?: Logger);
    /**
     * Register ensemble with CLI triggers
     */
    register(ensemble: EnsembleConfig): void;
    /**
     * Register multiple ensembles at once
     */
    registerAll(ensembles: EnsembleConfig[]): void;
    /**
     * Check if a command is registered
     */
    hasCommand(command: string): boolean;
    /**
     * Get command metadata
     */
    getCommandMetadata(command: string): CLICommandMetadata | null;
    /**
     * Run a CLI command
     */
    runCommand(command: string, options: Record<string, string | number | boolean>, env: Env, ctx: ExecutionContext): Promise<CLIExecutionResult>;
    /**
     * Parse and validate command options
     */
    private parseOptions;
    /**
     * List all registered CLI commands
     */
    listCommands(): CLICommandMetadata[];
    /**
     * Get count of registered commands
     */
    getCommandCount(): number;
    /**
     * Clear all registered commands
     */
    clear(): void;
}
/**
 * Get or create the global CLI manager
 */
export declare function getCLIManager(): CLIManager;
/**
 * Reset the global CLI manager (for testing)
 */
export declare function resetCLIManager(): void;
//# sourceMappingURL=cli-manager.d.ts.map