/**
 * Async Routes
 *
 * Asynchronous execution with status polling and webhooks.
 */
import { Hono } from 'hono';
declare const async: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default async;
//# sourceMappingURL=async.d.ts.map