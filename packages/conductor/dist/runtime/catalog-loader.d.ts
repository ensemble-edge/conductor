/**
 * Catalog Loader
 *
 * Loads ensemble configurations from various storage backends.
 * Supports KV, D1, R2, and in-memory catalogs.
 */
import type { EnsembleConfig } from './parser.js';
import type { ConductorEnv } from '../types/env.js';
/**
 * Catalog Loader
 *
 * Static utility for loading ensembles from different storage types.
 */
export declare class CatalogLoader {
    private static logger;
    /**
     * Load all ensembles with schedules from available storage
     */
    static loadScheduledEnsembles(env: ConductorEnv): Promise<EnsembleConfig[]>;
    /**
     * Load all ensembles with build triggers from available storage
     */
    static loadBuildEnsembles(env: ConductorEnv): Promise<EnsembleConfig[]>;
    /**
     * Load all ensembles with CLI triggers from available storage
     */
    static loadCLIEnsembles(env: ConductorEnv): Promise<EnsembleConfig[]>;
    /**
     * Load all ensembles from storage (scheduled and non-scheduled)
     */
    static loadAllEnsembles(env: ConductorEnv): Promise<EnsembleConfig[]>;
    /**
     * Load single ensemble by name
     */
    static loadEnsemble(env: ConductorEnv, ensembleName: string): Promise<EnsembleConfig | null>;
    /**
     * Load from KV namespace
     */
    private static loadFromKV;
    /**
     * Load from D1 database
     */
    private static loadFromD1;
    /**
     * Load from R2 bucket
     */
    private static loadFromR2;
    /**
     * Store ensemble in catalog (for testing/development)
     */
    static storeEnsemble(env: ConductorEnv, ensemble: EnsembleConfig, yaml: string): Promise<void>;
}
//# sourceMappingURL=catalog-loader.d.ts.map