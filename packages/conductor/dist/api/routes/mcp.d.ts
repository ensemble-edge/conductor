/**
 * MCP Server Routes
 *
 * Expose Conductor ensembles as MCP (Model Context Protocol) tools.
 *
 * Endpoints:
 * - GET  /mcp/tools            - List all available tools (manifest)
 * - POST /mcp/tools/{name}     - Invoke a tool (execute ensemble)
 */
import { Hono } from 'hono';
import type { ConductorContext } from '../types.js';
import type { ConductorEnv } from '../../types/env.js';
declare const app: Hono<{
    Bindings: ConductorEnv;
    Variables: ConductorContext["var"];
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=mcp.d.ts.map