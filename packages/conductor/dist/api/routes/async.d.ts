/**
 * Async Routes
 *
 * Asynchronous execution with status polling and webhooks.
 */
import { Hono } from 'hono';
import type { ConductorEnv } from '../../types/env.js';
declare const async: Hono<{
    Bindings: ConductorEnv;
}, import("hono/types").BlankSchema, "/">;
export default async;
//# sourceMappingURL=async.d.ts.map