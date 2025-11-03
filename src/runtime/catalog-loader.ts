/**
 * Catalog Loader
 *
 * Loads ensemble configurations from various storage backends.
 * Supports KV, D1, R2, and in-memory catalogs.
 */

import type { EnsembleConfig } from './parser';
import { Parser } from './parser';
import { createLogger, type Logger } from '../observability';

/**
 * Catalog Loader
 *
 * Static utility for loading ensembles from different storage types.
 */
export class CatalogLoader {
	private static logger: Logger = createLogger({ serviceName: 'catalog-loader' });
	/**
	 * Load all ensembles with schedules from available storage
	 */
	static async loadScheduledEnsembles(env: Env): Promise<EnsembleConfig[]> {
		// Try loading from different storage types in priority order

		// Option 1: Load from dedicated CATALOG_KV namespace
		const catalogKv = (env as any).CATALOG_KV as KVNamespace | undefined;
		if (catalogKv) {
			this.logger.info('Loading scheduled ensembles from CATALOG_KV');
			return this.loadFromKV(catalogKv, 'ensemble:');
		}

		// Option 2: Load from general KV namespace
		const kv = (env as any).KV as KVNamespace | undefined;
		if (kv) {
			this.logger.info('Loading scheduled ensembles from KV');
			return this.loadFromKV(kv, 'ensemble:');
		}

		// Option 3: Load from D1 database
		const db = (env as any).DB;
		if (db) {
			this.logger.info('Loading scheduled ensembles from D1');
			return this.loadFromD1(db);
		}

		// Option 4: Load from R2 bucket
		const r2 = (env as any).CATALOG as R2Bucket | undefined;
		if (r2) {
			this.logger.info('Loading scheduled ensembles from R2');
			return this.loadFromR2(r2);
		}

		this.logger.warn('No storage backend configured, returning empty catalog');
		return [];
	}

	/**
	 * Load all ensembles from storage (scheduled and non-scheduled)
	 */
	static async loadAllEnsembles(env: Env): Promise<EnsembleConfig[]> {
		// Same priority order as scheduled ensembles

		const catalogKv = (env as any).CATALOG_KV as KVNamespace | undefined;
		if (catalogKv) {
			return this.loadFromKV(catalogKv, 'ensemble:', false);
		}

		const kv = (env as any).KV as KVNamespace | undefined;
		if (kv) {
			return this.loadFromKV(kv, 'ensemble:', false);
		}

		const db = (env as any).DB;
		if (db) {
			return this.loadFromD1(db, false);
		}

		const r2 = (env as any).CATALOG as R2Bucket | undefined;
		if (r2) {
			return this.loadFromR2(r2, false);
		}

		return [];
	}

	/**
	 * Load single ensemble by name
	 */
	static async loadEnsemble(env: Env, ensembleName: string): Promise<EnsembleConfig | null> {
		// Try each storage backend

		const catalogKv = (env as any).CATALOG_KV as KVNamespace | undefined;
		if (catalogKv) {
			const yaml = await catalogKv.get(`ensemble:${ensembleName}`, 'text');
			if (yaml) {
				return Parser.parseEnsemble(yaml);
			}
		}

		const kv = (env as any).KV as KVNamespace | undefined;
		if (kv) {
			const yaml = await kv.get(`ensemble:${ensembleName}`, 'text');
			if (yaml) {
				return Parser.parseEnsemble(yaml);
			}
		}

		const db = (env as any).DB;
		if (db) {
			const result = await db
				.prepare('SELECT yaml FROM ensembles WHERE name = ?')
				.bind(ensembleName)
				.first();

			if (result) {
				return Parser.parseEnsemble(result.yaml);
			}
		}

		const r2 = (env as any).CATALOG as R2Bucket | undefined;
		if (r2) {
			const file = await r2.get(`ensembles/${ensembleName}.yaml`);
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
	private static async loadFromKV(
		kv: KVNamespace,
		prefix: string = 'ensemble:',
		scheduledOnly: boolean = true
	): Promise<EnsembleConfig[]> {
		const ensembles: EnsembleConfig[] = [];

		try {
			const list = await kv.list({ prefix });

			for (const key of list.keys) {
				try {
					const yaml = await kv.get(key.name, 'text');
					if (yaml) {
						const ensemble = Parser.parseEnsemble(yaml);

						// Filter by schedules if needed
						if (scheduledOnly) {
							if (ensemble.schedules && ensemble.schedules.length > 0) {
								ensembles.push(ensemble);
							}
						} else {
							ensembles.push(ensemble);
						}
					}
				} catch (error) {
					this.logger.error('Failed to parse ensemble from KV', error instanceof Error ? error : undefined, {
						key: key.name
					});
				}
			}

			this.logger.info('Loaded ensembles from KV', {
				total: list.keys.length,
				loaded: ensembles.length,
				scheduledOnly
			});
		} catch (error) {
			this.logger.error('Failed to load from KV', error instanceof Error ? error : undefined);
		}

		return ensembles;
	}

	/**
	 * Load from D1 database
	 */
	private static async loadFromD1(db: any, scheduledOnly: boolean = true): Promise<EnsembleConfig[]> {
		const ensembles: EnsembleConfig[] = [];

		try {
			// Query depends on whether we filter by schedules
			const query = scheduledOnly
				? 'SELECT yaml FROM ensembles WHERE schedules IS NOT NULL AND json_array_length(schedules) > 0'
				: 'SELECT yaml FROM ensembles';

			const result = await db.prepare(query).all();

			for (const row of result.results) {
				try {
					const ensemble = Parser.parseEnsemble(row.yaml);

					// Double-check schedules filter
					if (scheduledOnly) {
						if (ensemble.schedules && ensemble.schedules.length > 0) {
							ensembles.push(ensemble);
						}
					} else {
						ensembles.push(ensemble);
					}
				} catch (error) {
					this.logger.error('Failed to parse ensemble from D1', error instanceof Error ? error : undefined);
				}
			}

			this.logger.info('Loaded ensembles from D1', {
				total: result.results.length,
				loaded: ensembles.length,
				scheduledOnly
			});
		} catch (error) {
			this.logger.error('Failed to load from D1', error instanceof Error ? error : undefined);
		}

		return ensembles;
	}

	/**
	 * Load from R2 bucket
	 */
	private static async loadFromR2(r2: R2Bucket, scheduledOnly: boolean = true): Promise<EnsembleConfig[]> {
		const ensembles: EnsembleConfig[] = [];

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
							if (ensemble.schedules && ensemble.schedules.length > 0) {
								ensembles.push(ensemble);
							}
						} else {
							ensembles.push(ensemble);
						}
					}
				} catch (error) {
					this.logger.error('Failed to parse ensemble from R2', error instanceof Error ? error : undefined, {
						key: object.key
					});
				}
			}

			this.logger.info('Loaded ensembles from R2', {
				total: list.objects.length,
				loaded: ensembles.length,
				scheduledOnly
			});
		} catch (error) {
			this.logger.error('Failed to load from R2', error instanceof Error ? error : undefined);
		}

		return ensembles;
	}

	/**
	 * Store ensemble in catalog (for testing/development)
	 */
	static async storeEnsemble(env: Env, ensemble: EnsembleConfig, yaml: string): Promise<void> {
		// Store in available backend

		const catalogKv = (env as any).CATALOG_KV as KVNamespace | undefined;
		if (catalogKv) {
			await catalogKv.put(`ensemble:${ensemble.name}`, yaml);
			return;
		}

		const kv = (env as any).KV as KVNamespace | undefined;
		if (kv) {
			await kv.put(`ensemble:${ensemble.name}`, yaml);
			return;
		}

		const db = (env as any).DB;
		if (db) {
			await db
				.prepare('INSERT OR REPLACE INTO ensembles (name, yaml, schedules) VALUES (?, ?, ?)')
				.bind(ensemble.name, yaml, JSON.stringify(ensemble.schedules || []))
				.run();
			return;
		}

		const r2 = (env as any).CATALOG as R2Bucket | undefined;
		if (r2) {
			await r2.put(`ensembles/${ensemble.name}.yaml`, yaml);
			return;
		}

		throw new Error('No storage backend configured');
	}
}
