/**
 * Stream Routes
 *
 * Server-Sent Events (SSE) for streaming agent execution.
 */
import { Hono } from 'hono';
declare const stream: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default stream;
//# sourceMappingURL=stream.d.ts.map