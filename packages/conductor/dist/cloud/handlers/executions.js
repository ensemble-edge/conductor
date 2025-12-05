/**
 * Cloud Executions Endpoint
 *
 * GET /cloud/executions
 *
 * Returns recent execution history. In production, this would read from
 * D1, KV, or Durable Objects. Currently returns stubbed data.
 */
/**
 * Handle executions list request
 *
 * Query params:
 * - limit: number of records (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 * - ensemble: filter by ensemble name
 * - status: filter by status (success, error, running)
 * - since: ISO timestamp to filter from
 */
export async function handleExecutions(request, _env) {
    const url = new URL(request.url);
    // Parse query parameters
    const query = {
        limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        ensemble: url.searchParams.get('ensemble') || undefined,
        status: url.searchParams.get('status') || undefined,
        since: url.searchParams.get('since') || undefined,
    };
    // TODO: Read from actual execution storage (D1, KV, or Durable Objects)
    // This is a stub returning mock data for now
    //
    // In production, this would:
    // 1. Query the execution history store
    // 2. Apply filters based on query params
    // 3. Return paginated results
    const mockExecutions = [
        {
            id: 'exec_stub_001',
            ensemble: 'hello-world',
            status: 'success',
            duration_ms: 234,
            started_at: new Date(Date.now() - 60000).toISOString(),
            completed_at: new Date(Date.now() - 59766).toISOString(),
        },
        {
            id: 'exec_stub_002',
            ensemble: 'greeting-flow',
            status: 'success',
            duration_ms: 1456,
            started_at: new Date(Date.now() - 120000).toISOString(),
            completed_at: new Date(Date.now() - 118544).toISOString(),
        },
    ];
    // Apply filters (stubbed behavior)
    let filtered = mockExecutions;
    if (query.ensemble) {
        filtered = filtered.filter((e) => e.ensemble === query.ensemble);
    }
    if (query.status) {
        filtered = filtered.filter((e) => e.status === query.status);
    }
    if (query.since) {
        const sinceDate = new Date(query.since);
        filtered = filtered.filter((e) => new Date(e.started_at) >= sinceDate);
    }
    // Apply pagination
    const total = filtered.length;
    const items = filtered.slice(query.offset, query.offset + query.limit);
    const response = {
        total,
        limit: query.limit,
        offset: query.offset,
        items,
    };
    return Response.json(response);
}
