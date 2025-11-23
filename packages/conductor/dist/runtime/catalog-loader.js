/**
 * Catalog Loader
 *
 * Loads ensemble configurations from various storage backends.
 * Supports KV, D1, R2, and in-memory catalogs.
 */
import { Parser } from './parser.js';
import { createLogger } from '../observability/index.js';
/**
 * Catalog Loader
 *
 * Static utility for loading ensembles from different storage types.
 */
export class CatalogLoader {
    /**
     * Load all ensembles with schedules from available storage
     */
    static async loadScheduledEnsembles(env) {
        // Try loading from different storage types in priority order
        // Option 1: Load from dedicated CATALOG_KV namespace
        if (env.CATALOG_KV) {
            this.logger.info('Loading scheduled ensembles from CATALOG_KV');
            return this.loadFromKV(env.CATALOG_KV, 'ensemble:');
        }
        // Option 2: Load from general KV namespace
        if (env.KV) {
            this.logger.info('Loading scheduled ensembles from KV');
            return this.loadFromKV(env.KV, 'ensemble:');
        }
        // Option 3: Load from D1 database
        if (env.DB) {
            this.logger.info('Loading scheduled ensembles from D1');
            return this.loadFromD1(env.DB);
        }
        // Option 4: Load from R2 bucket
        if (env.CATALOG) {
            this.logger.info('Loading scheduled ensembles from R2');
            return this.loadFromR2(env.CATALOG);
        }
        this.logger.warn('No storage backend configured, returning empty catalog');
        return [];
    }
    /**
     * Load all ensembles from storage (scheduled and non-scheduled)
     */
    static async loadAllEnsembles(env) {
        // Same priority order as scheduled ensembles
        if (env.CATALOG_KV) {
            return this.loadFromKV(env.CATALOG_KV, 'ensemble:', false);
        }
        if (env.KV) {
            return this.loadFromKV(env.KV, 'ensemble:', false);
        }
        if (env.DB) {
            return this.loadFromD1(env.DB, false);
        }
        if (env.CATALOG) {
            return this.loadFromR2(env.CATALOG, false);
        }
        return [];
    }
    /**
     * Load single ensemble by name
     */
    static async loadEnsemble(env, ensembleName) {
        // Try each storage backend
        if (env.CATALOG_KV) {
            const yaml = await env.CATALOG_KV.get(`ensemble:${ensembleName}`, 'text');
            if (yaml) {
                return Parser.parseEnsemble(yaml);
            }
        }
        if (env.KV) {
            const yaml = await env.KV.get(`ensemble:${ensembleName}`, 'text');
            if (yaml) {
                return Parser.parseEnsemble(yaml);
            }
        }
        if (env.DB) {
            const result = (await env.DB.prepare('SELECT yaml FROM ensembles WHERE name = ?')
                .bind(ensembleName)
                .first());
            if (result) {
                return Parser.parseEnsemble(result.yaml);
            }
        }
        if (env.CATALOG) {
            const file = await env.CATALOG.get(`ensembles/${ensembleName}.yaml`);
            if (file) {
                const yaml = await file.text();
                return Parser.parseEnsemble(yaml);
            }
        }
        return null;
    }
    /**
     * Load from KV namespace
     */
    static async loadFromKV(kv, prefix = 'ensemble:', scheduledOnly = true) {
        const ensembles = [];
        try {
            const list = await kv.list({ prefix });
            for (const key of list.keys) {
                try {
                    const yaml = await kv.get(key.name, 'text');
                    if (yaml) {
                        const ensemble = Parser.parseEnsemble(yaml);
                        // Filter by schedules if needed
                        if (scheduledOnly) {
                            if (ensemble.trigger?.filter((t) => t.type === 'cron').length ?? 0 > 0) {
                                ensembles.push(ensemble);
                            }
                        }
                        else {
                            ensembles.push(ensemble);
                        }
                    }
                }
                catch (error) {
                    this.logger.error('Failed to parse ensemble from KV', error instanceof Error ? error : undefined, {
                        key: key.name,
                    });
                }
            }
            this.logger.info('Loaded ensembles from KV', {
                total: list.keys.length,
                loaded: ensembles.length,
                scheduledOnly,
            });
        }
        catch (error) {
            this.logger.error('Failed to load from KV', error instanceof Error ? error : undefined);
        }
        return ensembles;
    }
    /**
     * Load from D1 database
     */
    static async loadFromD1(db, scheduledOnly = true) {
        const ensembles = [];
        try {
            // Query depends on whether we filter by schedules
            const query = scheduledOnly
                ? 'SELECT yaml FROM ensembles WHERE schedules IS NOT NULL AND json_array_length(schedules) > 0'
                : 'SELECT yaml FROM ensembles';
            const result = (await db.prepare(query).all());
            for (const row of result.results) {
                try {
                    const ensemble = Parser.parseEnsemble(row.yaml);
                    // Double-check schedules filter
                    if (scheduledOnly) {
                        if (ensemble.trigger?.filter((t) => t.type === 'cron').length ?? 0 > 0) {
                            ensembles.push(ensemble);
                        }
                    }
                    else {
                        ensembles.push(ensemble);
                    }
                }
                catch (error) {
                    this.logger.error('Failed to parse ensemble from D1', error instanceof Error ? error : undefined);
                }
            }
            this.logger.info('Loaded ensembles from D1', {
                total: result.results.length,
                loaded: ensembles.length,
                scheduledOnly,
            });
        }
        catch (error) {
            this.logger.error('Failed to load from D1', error instanceof Error ? error : undefined);
        }
        return ensembles;
    }
    /**
     * Load from R2 bucket
     */
    static async loadFromR2(r2, scheduledOnly = true) {
        const ensembles = [];
        try {
            const list = await r2.list({ prefix: 'ensembles/' });
            for (const object of list.objects) {
                try {
                    const file = await r2.get(object.key);
                    if (file) {
                        const yaml = await file.text();
                        const ensemble = Parser.parseEnsemble(yaml);
                        // Filter by schedules if needed
                        if (scheduledOnly) {
                            if (ensemble.trigger?.filter((t) => t.type === 'cron').length ?? 0 > 0) {
                                ensembles.push(ensemble);
                            }
                        }
                        else {
                            ensembles.push(ensemble);
                        }
                    }
                }
                catch (error) {
                    this.logger.error('Failed to parse ensemble from R2', error instanceof Error ? error : undefined, {
                        key: object.key,
                    });
                }
            }
            this.logger.info('Loaded ensembles from R2', {
                total: list.objects.length,
                loaded: ensembles.length,
                scheduledOnly,
            });
        }
        catch (error) {
            this.logger.error('Failed to load from R2', error instanceof Error ? error : undefined);
        }
        return ensembles;
    }
    /**
     * Store ensemble in catalog (for testing/development)
     */
    static async storeEnsemble(env, ensemble, yaml) {
        // Store in available backend
        if (env.CATALOG_KV) {
            await env.CATALOG_KV.put(`ensemble:${ensemble.name}`, yaml);
            return;
        }
        if (env.KV) {
            await env.KV.put(`ensemble:${ensemble.name}`, yaml);
            return;
        }
        if (env.DB) {
            const cronTriggers = ensemble.trigger?.filter((t) => t.type === 'cron') || [];
            await env.DB.prepare('INSERT OR REPLACE INTO ensembles (name, yaml, schedules) VALUES (?, ?, ?)')
                .bind(ensemble.name, yaml, JSON.stringify(cronTriggers))
                .run();
            return;
        }
        if (env.CATALOG) {
            await env.CATALOG.put(`ensembles/${ensemble.name}.yaml`, yaml);
            return;
        }
        throw new Error('No storage backend configured');
    }
}
CatalogLoader.logger = createLogger({ serviceName: 'catalog-loader' });
