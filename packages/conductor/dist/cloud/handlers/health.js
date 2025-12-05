/**
 * Cloud Health Endpoint
 *
 * GET /cloud/health
 *
 * Returns the health status of the cloud connection.
 */
/**
 * Handle health check request
 */
export async function handleHealth(_request, env) {
    const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: env.CONDUCTOR_VERSION || '1.0.0',
    };
    return Response.json(response);
}
