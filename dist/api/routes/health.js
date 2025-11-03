/**
 * Health Routes
 *
 * Health check and status endpoints.
 */
import { Hono } from 'hono';
const health = new Hono();
/**
 * GET /health - Health check
 */
health.get('/', async (c) => {
    const checks = {};
    // Check database connection
    try {
        if (c.env.DB) {
            await c.env.DB.prepare('SELECT 1').first();
            checks.database = true;
        }
    }
    catch (error) {
        checks.database = false;
    }
    // Check KV (session storage)
    try {
        if (c.env.SESSIONS) {
            await c.env.SESSIONS.get('_health_check');
            checks.cache = true;
        }
    }
    catch (error) {
        checks.cache = false;
    }
    // Determine overall status
    const allHealthy = Object.values(checks).every((check) => check === true);
    const anyHealthy = Object.values(checks).some((check) => check === true);
    let status;
    if (allHealthy) {
        status = 'healthy';
    }
    else if (anyHealthy) {
        status = 'degraded';
    }
    else {
        status = 'unhealthy';
    }
    const response = {
        status,
        timestamp: Date.now(),
        version: '1.0.0',
        checks,
    };
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    return c.json(response, statusCode);
});
/**
 * GET /health/ready - Readiness check
 */
health.get('/ready', async (c) => {
    // Simple readiness check
    return c.json({
        ready: true,
        timestamp: Date.now(),
    });
});
/**
 * GET /health/live - Liveness check
 */
health.get('/live', async (c) => {
    // Simple liveness check
    return c.json({
        alive: true,
        timestamp: Date.now(),
    });
});
export default health;
