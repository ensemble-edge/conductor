/**
 * Schedule Routes
 *
 * API endpoints for managing scheduled ensemble execution.
 */

import { Hono } from 'hono';
import { ScheduleManager } from '../../runtime/schedule-manager.js';
import { CatalogLoader } from '../../runtime/catalog-loader.js';
import { Executor } from '../../runtime/executor.js';

const app = new Hono<{ Bindings: Env }>();

/**
 * List all scheduled ensembles
 * GET /schedules
 */
app.get('/', async (c) => {
	try {
		// Load scheduled ensembles from catalog
		const ensembles = await CatalogLoader.loadScheduledEnsembles(c.env);
		const manager = new ScheduleManager();
		manager.registerAll(ensembles);

		const scheduled = manager.listScheduledEnsembles();
		const crons = manager.getAllCronExpressions();

		return c.json({
			scheduled,
			totalEnsembles: scheduled.length,
			totalSchedules: scheduled.reduce((sum, s) => sum + s.schedules.length, 0),
			crons,
			timestamp: Date.now()
		});
	} catch (error) {
		return c.json({
			error: 'Failed to list scheduled ensembles',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

/**
 * Get schedule for specific ensemble
 * GET /schedules/:ensembleName
 */
app.get('/:ensembleName', async (c) => {
	const ensembleName = c.req.param('ensembleName');

	try {
		// Load ensemble from catalog
		const ensemble = await CatalogLoader.loadEnsemble(c.env, ensembleName);

		if (!ensemble) {
			return c.json({
				error: 'Ensemble not found',
				ensembleName
			}, 404);
		}

		if (!ensemble.schedules || ensemble.schedules.length === 0) {
			return c.json({
				error: 'Ensemble has no schedules configured',
				ensembleName
			}, 404);
		}

		return c.json({
			ensembleName,
			schedules: ensemble.schedules,
			totalSchedules: ensemble.schedules.length,
			crons: ensemble.schedules.map(s => s.cron),
			timestamp: Date.now()
		});
	} catch (error) {
		return c.json({
			error: 'Failed to get ensemble schedules',
			message: error instanceof Error ? error.message : 'Unknown error',
			ensembleName
		}, 500);
	}
});

/**
 * Trigger scheduled execution manually (for testing)
 * POST /schedules/:ensembleName/trigger
 */
app.post('/:ensembleName/trigger', async (c) => {
	const ensembleName = c.req.param('ensembleName');

	try {
		// Load ensemble from catalog
		const ensemble = await CatalogLoader.loadEnsemble(c.env, ensembleName);

		if (!ensemble) {
			return c.json({
				error: 'Ensemble not found',
				ensembleName
			}, 404);
		}

		if (!ensemble.schedules || ensemble.schedules.length === 0) {
			return c.json({
				error: 'Ensemble has no schedules configured',
				ensembleName
			}, 404);
		}

		// Get optional schedule index from query
		const scheduleIndex = parseInt(c.req.query('schedule') || '0', 10);

		if (scheduleIndex < 0 || scheduleIndex >= ensemble.schedules.length) {
			return c.json({
				error: 'Invalid schedule index',
				scheduleIndex,
				available: ensemble.schedules.length
			}, 400);
		}

		const schedule = ensemble.schedules[scheduleIndex];

		// Create execution context
		const ctx = {
			waitUntil: (promise: Promise<unknown>) => {},
			passThroughOnException: () => {}
		} as ExecutionContext;

		const executor = new Executor({ env: c.env, ctx });

		// Prepare input with schedule metadata
		const input = {
			...(schedule.input || {}),
			_schedule: {
				cron: schedule.cron,
				timezone: schedule.timezone,
				scheduledTime: Date.now(),
				triggeredAt: Date.now(),
				triggeredBy: 'manual',
				metadata: schedule.metadata
			}
		};

		// Execute ensemble
		const result = await executor.executeEnsemble(ensemble, input);

		if (!result.success) {
			return c.json({
				error: 'Execution failed',
				ensembleName,
				message: result.error.message,
				schedule: {
					cron: schedule.cron,
					index: scheduleIndex
				}
			}, 500);
		}

		return c.json({
			status: 'completed',
			ensembleName,
			schedule: {
				cron: schedule.cron,
				index: scheduleIndex
			},
			result: result.value.output,
			metrics: result.value.metrics
		});
	} catch (error) {
		return c.json({
			error: 'Failed to trigger scheduled execution',
			message: error instanceof Error ? error.message : 'Unknown error',
			ensembleName
		}, 500);
	}
});

/**
 * Test scheduled event handler
 * POST /schedules/test
 *
 * Simulates a cron trigger for testing
 */
app.post('/test', async (c) => {
	try {
		const { cron } = await c.req.json();

		if (!cron) {
			return c.json({
				error: 'Missing cron expression',
				hint: 'Provide { "cron": "0 9 * * *" } in request body'
			}, 400);
		}

		// Create fake scheduled event
		const event = {
			cron,
			scheduledTime: Date.now()
		};

		// Initialize schedule manager
		const ensembles = await CatalogLoader.loadScheduledEnsembles(c.env);
		const manager = new ScheduleManager();
		manager.registerAll(ensembles);

		// Create execution context
		const ctx = {
			waitUntil: (promise: Promise<unknown>) => {},
			passThroughOnException: () => {}
		} as ExecutionContext;

		// Handle the scheduled event
		const results = await manager.handleScheduled(event, c.env, ctx);

		return c.json({
			message: 'Scheduled execution triggered',
			cron,
			results,
			totalExecutions: results.length,
			successful: results.filter(r => r.success).length,
			failed: results.filter(r => !r.success).length
		});
	} catch (error) {
		return c.json({
			error: 'Failed to test scheduled execution',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

/**
 * Get all registered cron expressions
 * GET /schedules/crons
 */
app.get('/crons/list', async (c) => {
	try {
		const ensembles = await CatalogLoader.loadScheduledEnsembles(c.env);
		const manager = new ScheduleManager();
		manager.registerAll(ensembles);

		const crons = manager.getAllCronExpressions();

		return c.json({
			crons,
			totalCrons: crons.length,
			wranglerConfig: {
				triggers: {
					crons
				}
			}
		});
	} catch (error) {
		return c.json({
			error: 'Failed to list cron expressions',
			message: error instanceof Error ? error.message : 'Unknown error'
		}, 500);
	}
});

export default app;
