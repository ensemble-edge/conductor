/**
 * Cloud Sync Endpoint
 *
 * POST /cloud/sync
 *
 * Triggers a sync/refresh operation. This can be called by Cloud
 * to notify the worker of configuration changes pushed via GitHub.
 */
/**
 * Handle sync request
 *
 * This endpoint is called by Ensemble Cloud when:
 * - GitHub push triggers a deploy
 * - Manual refresh is requested
 * - Component versions are updated
 *
 * In production, this might:
 * - Clear caches
 * - Reload configuration
 * - Notify connected clients
 */
export async function handleSync(request, _env) {
    // Only allow POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                Allow: 'POST',
            },
        });
    }
    // TODO: Implement actual sync logic
    // This might include:
    // - Cache invalidation
    // - Configuration reload
    // - Component version refresh
    // - WebSocket notifications to connected clients
    // Parse optional sync parameters from body
    let syncType = 'full';
    try {
        const body = (await request.json());
        syncType = body.type || 'full';
    }
    catch {
        // Empty body is fine, default to full sync
    }
    const response = {
        status: 'ok',
        message: `Sync triggered (type: ${syncType})`,
        timestamp: new Date().toISOString(),
    };
    return Response.json(response);
}
