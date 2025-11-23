/**
 * Execution Routes
 *
 * API endpoints for querying and managing async execution state.
 * Integrates with ExecutionState Durable Object for real-time status.
 */
import { Hono } from 'hono';
import type { ConductorEnv } from '../../types/env.js';
declare const app: Hono<{
    Bindings: ConductorEnv;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=executions.d.ts.map