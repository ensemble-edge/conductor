/**
 * Hyperdrive with Query Caching Example
 *
 * This example demonstrates:
 * 1. Setting up Hyperdrive with multiple databases
 * 2. Enabling query result caching
 * 3. Executing queries with automatic caching
 * 4. Managing cache and monitoring statistics
 */

import { ConductorClient, createClient } from '@ensemble-edge/conductor';

// Example agent configuration with Hyperdrive
const agentConfig = {
	name: 'analytics-agent',
	version: '1.0.0',
	description: 'Agent with Hyperdrive analytics queries and caching',

	// Memory configuration with analytical tier
	memory: {
		enabled: true,
		layers: {
			working: true,
			session: true,
			longTerm: true,
			semantic: true,
			analytical: true // Enable analytical memory (Hyperdrive)
		},
		analyticalConfig: {
			databases: {
				// Production database (read-only)
				production: {
					binding: 'PRODUCTION_DB', // Hyperdrive binding name
					type: 'postgres',
					readOnly: true,
					timeout: 30000,
					maxRows: 1000
				},
				// Analytics database
				analytics: {
					binding: 'ANALYTICS_DB',
					type: 'postgres',
					timeout: 60000
				},
				// Data warehouse
				warehouse: {
					binding: 'DATA_WAREHOUSE',
					type: 'postgres',
					schema: 'public',
					timeout: 120000
				}
			},
			defaultDatabase: 'production',

			// Enable caching
			enableCache: true,
			cacheTTL: 600, // 10 minutes default
			cacheKV: 'CACHE' // KV namespace binding
		}
	},

	// Workflow with queries agent
	steps: [
		{
			name: 'get-user-analytics',
			agent: 'queries',
			input: {
				queryName: 'user-analytics', // From catalog
				input: {
					startDate: '{{ context.startDate }}',
					endDate: '{{ context.endDate }}',
					planType: '{{ context.planType }}'
				}
			},
			config: {
				database: 'analytics',
				cacheTTL: 3600, // Cache for 1 hour
				readOnly: true,
				transform: 'camelCase'
			}
		},
		{
			name: 'get-active-users',
			agent: 'queries',
			input: {
				sql: 'SELECT id, email, name, last_active_at FROM users WHERE last_active_at >= $1 ORDER BY last_active_at DESC LIMIT $2',
				input: ['{{ context.sinceDate }}', 100]
			},
			config: {
				database: 'production',
				cacheTTL: 300, // Cache for 5 minutes
				readOnly: true
			}
		},
		{
			name: 'federated-query',
			agent: 'queries',
			input: {
				queryName: 'cross-database-report'
			},
			config: {
				// Will query multiple databases
				databases: ['production', 'analytics', 'warehouse']
			}
		}
	]
};

// Example: Using SDK with caching
async function demonstrateCaching() {
	const client = createClient({
		apiUrl: 'https://your-worker.workers.dev',
		apiKey: 'your-api-key'
	});

	console.log('=== Query Caching Demo ===\n');

	// 1. First query - will miss cache
	console.log('1. First query (cache miss expected)...');
	console.time('first-query');
	const result1 = await client.execute('analytics-agent', {
		startDate: '2024-01-01',
		endDate: '2024-01-31',
		planType: 'pro'
	});
	console.timeEnd('first-query');
	console.log(`Rows returned: ${result1.output?.rows?.length || 0}\n`);

	// 2. Second query - should hit cache
	console.log('2. Second query (cache hit expected)...');
	console.time('second-query');
	const result2 = await client.execute('analytics-agent', {
		startDate: '2024-01-01',
		endDate: '2024-01-31',
		planType: 'pro'
	});
	console.timeEnd('second-query');
	console.log(`Rows returned: ${result2.output?.rows?.length || 0}\n`);

	// 3. Different parameters - will miss cache
	console.log('3. Different parameters (cache miss expected)...');
	console.time('third-query');
	const result3 = await client.execute('analytics-agent', {
		startDate: '2024-02-01',
		endDate: '2024-02-29',
		planType: 'pro'
	});
	console.timeEnd('third-query');
	console.log(`Rows returned: ${result3.output?.rows?.length || 0}\n`);
}

// Example: Direct memory usage with caching
async function directMemoryUsage(env: Env) {
	const { MemoryManager } = await import('@ensemble-edge/conductor');

	const memory = new MemoryManager(env, {
		enabled: true,
		layers: {
			analytical: true
		},
		analyticalConfig: {
			databases: {
				production: {
					binding: env.PRODUCTION_DB,
					type: 'postgres',
					readOnly: true
				}
			},
			defaultDatabase: 'production',
			enableCache: true,
			cacheTTL: 600,
			cacheKV: env.CACHE
		}
	});

	// Query with automatic caching
	const users = await memory.queryAnalytical(
		'SELECT * FROM users WHERE active = true LIMIT 100',
		[],
		'production'
	);

	// Get cache statistics
	const stats = memory.getCacheStats();
	if (stats) {
		console.log('Cache Statistics:');
		console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
		console.log(`  Hits: ${stats.hits}`);
		console.log(`  Misses: ${stats.misses}`);
		console.log(`  Sets: ${stats.sets}`);
		console.log(`  Deletes: ${stats.deletes}`);
		console.log(`  Errors: ${stats.errors}`);
	}

	// Clear cache for specific database
	await memory.clearCache('production');
	console.log('Cache cleared for production database');
}

// Example: Cache management in worker
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Cache management endpoints
		if (url.pathname === '/cache/stats') {
			const { MemoryManager } = await import('@ensemble-edge/conductor');
			const memory = new MemoryManager(env, {
				enabled: true,
				layers: { analytical: true },
				analyticalConfig: {
					databases: {
						production: {
							binding: env.PRODUCTION_DB,
							type: 'postgres'
						}
					},
					enableCache: true,
					cacheKV: env.CACHE
				}
			});

			const stats = memory.getCacheStats();
			return Response.json(stats);
		}

		if (url.pathname === '/cache/clear') {
			const { MemoryManager } = await import('@ensemble-edge/conductor');
			const memory = new MemoryManager(env, {
				enabled: true,
				layers: { analytical: true },
				analyticalConfig: {
					databases: {
						production: {
							binding: env.PRODUCTION_DB,
							type: 'postgres'
						}
					},
					enableCache: true,
					cacheKV: env.CACHE
				}
			});

			const database = url.searchParams.get('database') || undefined;
			const cleared = await memory.clearCache(database);

			return Response.json({
				success: true,
				cleared,
				database: database || 'all'
			});
		}

		return new Response('Not found', { status: 404 });
	},

	// Scheduled cache warming
	async scheduled(event: ScheduledEvent, env: Env) {
		const { MemoryManager } = await import('@ensemble-edge/conductor');

		const memory = new MemoryManager(env, {
			enabled: true,
			layers: { analytical: true },
			analyticalConfig: {
				databases: {
					analytics: {
						binding: env.ANALYTICS_DB,
						type: 'postgres'
					}
				},
				enableCache: true,
				cacheTTL: 3600,
				cacheKV: env.CACHE
			}
		});

		// Warm cache with frequently used queries
		const queries = [
			'SELECT COUNT(*) as total_users FROM users',
			'SELECT COUNT(*) as active_users FROM users WHERE active = true',
			'SELECT plan_type, COUNT(*) as count FROM users GROUP BY plan_type'
		];

		for (const sql of queries) {
			try {
				await memory.queryAnalytical(sql, [], 'analytics');
				console.log(`Warmed cache for: ${sql.substring(0, 50)}...`);
			} catch (error) {
				console.error(`Failed to warm cache: ${error}`);
			}
		}

		// Log cache statistics
		const stats = memory.getCacheStats();
		console.log('Cache stats after warming:', stats);
	}
};

// Example: Query catalog with caching
const userAnalyticsQuery = {
	name: 'user-analytics',
	version: '1.0.0',
	description: 'User signup analytics with caching',

	input: {
		startDate: { type: 'string', required: true },
		endDate: { type: 'string', required: true },
		planType: { type: 'string', required: false }
	},

	query: `
    SELECT
      DATE(created_at) as signup_date,
      COUNT(*) as total_signups,
      COUNT(CASE WHEN verified = true THEN 1 END) as verified_users,
      COUNT(CASE WHEN plan_type = :planType THEN 1 END) as plan_users
    FROM users
    WHERE created_at BETWEEN :startDate AND :endDate
      AND (:planType IS NULL OR plan_type = :planType)
    GROUP BY DATE(created_at)
    ORDER BY signup_date DESC
  `,

	config: {
		database: 'analytics',
		cacheTTL: 3600, // Cache for 1 hour - analytics don't change often
		maxRows: 365,
		readOnly: true,
		transform: 'camelCase'
	}
};

// Example: Cache-aware query patterns
async function cacheAwarePatterns(memory: any) {
	// Pattern 1: High-frequency lookup with short TTL
	const getUser = async (userId: number) => {
		return await memory.queryAnalytical(
			'SELECT * FROM users WHERE id = $1',
			[userId],
			'production'
		);
		// Automatically cached for 15 minutes (lookup query)
	};

	// Pattern 2: Analytics with long TTL
	const getDailyStats = async (date: string) => {
		return await memory.queryAnalytical(
			`SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        AVG(score) as avg_score
      FROM events
      WHERE DATE(created_at) = $1
      GROUP BY DATE(created_at)`,
			[date],
			'analytics'
		);
		// Automatically cached for 1 hour (analytics query)
	};

	// Pattern 3: Real-time data - bypass cache
	const getCurrentActiveUsers = async () => {
		// Clear cache first to ensure fresh data
		await memory.clearCache('production');

		return await memory.queryAnalytical(
			`SELECT COUNT(*) as active_count
      FROM sessions
      WHERE last_seen > NOW() - INTERVAL '5 minutes'`,
			[],
			'production'
		);
		// Won't be cached (uses NOW())
	};

	// Pattern 4: Federated query with caching
	const getCombinedReport = async () => {
		const [production, analytics, warehouse] = await Promise.all([
			memory.queryAnalytical('SELECT COUNT(*) FROM users', [], 'production'),
			memory.queryAnalytical('SELECT SUM(revenue) FROM sales', [], 'analytics'),
			memory.queryAnalytical('SELECT COUNT(*) FROM events', [], 'warehouse')
		]);
		// Each query cached independently
		return { production, analytics, warehouse };
	};
}

export { demonstrateCaching, directMemoryUsage, cacheAwarePatterns, userAnalyticsQuery };
