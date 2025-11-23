/**
 * Stream Routes
 *
 * Server-Sent Events (SSE) for streaming agent execution.
 */
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getBuiltInRegistry } from '../../agents/built-in/registry.js';
const stream = new Hono();
/**
 * POST /stream - Execute a agent with streaming
 */
stream.post('/', (c) => {
    return streamSSE(c, async (stream) => {
        const body = await c.req.json();
        const requestId = c.get('requestId');
        const startTime = Date.now();
        try {
            // Send start event
            await stream.writeSSE({
                event: 'start',
                data: JSON.stringify({
                    requestId,
                    agent: body.agent,
                    timestamp: Date.now(),
                }),
            });
            // Get built-in registry
            const builtInRegistry = getBuiltInRegistry();
            // Check if agent exists
            if (!builtInRegistry.isBuiltIn(body.agent)) {
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({
                        error: 'MemberNotFound',
                        message: `Agent not found: ${body.agent}`,
                        requestId,
                    }),
                });
                return;
            }
            // Get agent metadata
            const metadata = builtInRegistry.getMetadata(body.agent);
            if (!metadata) {
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({
                        error: 'MemberNotFound',
                        message: `Agent metadata not found: ${body.agent}`,
                        requestId,
                    }),
                });
                return;
            }
            // Send progress event
            await stream.writeSSE({
                event: 'progress',
                data: JSON.stringify({
                    status: 'executing',
                    message: `Executing ${body.agent}...`,
                }),
            });
            // Create agent instance
            const agentConfig = {
                name: body.agent,
                operation: metadata.operation,
                config: body.config || {},
            };
            const agent = builtInRegistry.create(body.agent, agentConfig, c.env);
            // Create execution context
            const memberContext = {
                input: body.input,
                env: c.env,
                ctx: c.executionCtx,
            };
            // Execute agent
            const result = await agent.execute(memberContext);
            // Send data events (for streaming data during execution)
            // This would be used if agents support streaming output
            await stream.writeSSE({
                event: 'data',
                data: JSON.stringify({
                    partial: false,
                    data: result.data,
                }),
            });
            // Send completion event
            if (result.success) {
                await stream.writeSSE({
                    event: 'complete',
                    data: JSON.stringify({
                        success: true,
                        data: result.data,
                        metadata: {
                            executionId: requestId || 'unknown',
                            duration: Date.now() - startTime,
                            timestamp: Date.now(),
                        },
                    }),
                });
            }
            else {
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({
                        error: 'ExecutionError',
                        message: result.error || 'Execution failed',
                        requestId,
                    }),
                });
            }
        }
        catch (error) {
            // Send error event
            await stream.writeSSE({
                event: 'error',
                data: JSON.stringify({
                    error: 'ExecutionError',
                    message: error.message || 'Execution failed',
                    requestId,
                }),
            });
        }
        // Close stream
        await stream.close();
    });
});
export default stream;
