/**
 * Schedule Routes
 *
 * API endpoints for managing scheduled ensemble execution.
 */
import { Hono } from 'hono';
import type { ConductorContext } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
declare const app: Hono<{
    Bindings: ConductorEnv;
    Variables: ConductorContext["var"];
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=schedules.d.ts.map