/**
 * Local File Loader
 *
 * Loads ensembles and agents from the local filesystem for CLI commands.
 * This is used by `conductor build` and `conductor run` commands.
 */
import type { EnsembleConfig, AgentConfig } from '../runtime/parser.js';
/**
 * Default directories for Conductor projects
 */
export declare const DEFAULT_DIRS: {
    readonly ensembles: "catalog/ensembles";
    readonly agents: "catalog/agents";
};
/**
 * Local ensemble loader for CLI operations
 */
export declare class LocalLoader {
    private readonly projectRoot;
    private readonly ensemblesDir;
    private readonly agentsDir;
    constructor(projectRoot?: string);
    /**
     * Load all ensembles with build triggers
     */
    loadBuildEnsembles(): Promise<EnsembleConfig[]>;
    /**
     * Load all ensembles with CLI triggers
     */
    loadCLIEnsembles(): Promise<EnsembleConfig[]>;
    /**
     * Load all ensembles with cron/schedule triggers
     */
    loadScheduledEnsembles(): Promise<EnsembleConfig[]>;
    /**
     * Load all ensembles from the local catalog
     */
    loadAllEnsembles(): Promise<EnsembleConfig[]>;
    /**
     * Load a specific ensemble by name
     */
    loadEnsemble(name: string): Promise<EnsembleConfig | null>;
    /**
     * Load all agents from the local catalog
     */
    loadAllAgents(): Promise<AgentConfig[]>;
    /**
     * Load a specific agent by name
     */
    loadAgent(name: string): Promise<AgentConfig | null>;
    /**
     * Find all YAML files in a directory recursively
     */
    private findYamlFiles;
    /**
     * Check if a directory exists
     */
    directoryExists(dir: string): Promise<boolean>;
    /**
     * Get the project root path
     */
    getProjectRoot(): string;
    /**
     * Get the ensembles directory path
     */
    getEnsemblesDir(): string;
    /**
     * Get the agents directory path
     */
    getAgentsDir(): string;
}
//# sourceMappingURL=local-loader.d.ts.map