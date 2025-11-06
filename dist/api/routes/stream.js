/**
 * Stream Routes
 *
 * Server-Sent Events (SSE) for streaming member execution.
 */
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getBuiltInRegistry } from '../../members/built-in/registry.js';
const stream = new Hono();
/**
 * POST /stream - Execute a member with streaming
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
                    member: body.member,
                    timestamp: Date.now(),
                }),
            });
            // Get built-in registry
            const builtInRegistry = getBuiltInRegistry();
            // Check if member exists
            if (!builtInRegistry.isBuiltIn(body.member)) {
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({
                        error: 'MemberNotFound',
                        message: `Member not found: ${body.member}`,
                        requestId,
                    }),
                });
                return;
            }
            // Get member metadata
            const metadata = builtInRegistry.getMetadata(body.member);
            if (!metadata) {
                await stream.writeSSE({
                    event: 'error',
                    data: JSON.stringify({
                        error: 'MemberNotFound',
                        message: `Member metadata not found: ${body.member}`,
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
                    message: `Executing ${body.member}...`,
                }),
            });
            // Create member instance
            const memberConfig = {
                name: body.member,
                type: metadata.type,
                config: body.config || {},
            };
            const member = builtInRegistry.create(body.member, memberConfig, c.env);
            // Create execution context
            const memberContext = {
                input: body.input,
                env: c.env,
                ctx: c.executionCtx,
            };
            // Execute member
            const result = await member.execute(memberContext);
            // Send data events (for streaming data during execution)
            // This would be used if members support streaming output
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
