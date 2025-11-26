/**
 * Callbacks Routes
 *
 * Handles callback URLs for workflow resumption (HITL, async continuations).
 * These endpoints use token-based authentication (the token IS the auth).
 *
 * Simplified design (mounted at configurable base path, default "/callback"):
 * - POST /callback/:token - Resume with body data { approved: true/false, ... }
 * - GET  /callback/:token - Get token metadata
 *
 * Configure base path via APIConfig.hitl.resumeBasePath
 *
 * @see https://docs.ensemble.ai/conductor/agents/hitl
 */

import { Hono } from 'hono'
import { ResumptionManager } from '../../runtime/resumption-manager.js'
import { Executor } from '../../runtime/executor.js'
import { createLogger } from '../../observability/index.js'

const app = new Hono<{ Bindings: Env }>()
const logger = createLogger({ serviceName: 'api-callbacks' })

/**
 * Resume suspended execution
 * POST /callback/:token (base path is configurable)
 *
 * Resume a suspended workflow using a one-time resumption token.
 * The token itself serves as authentication (like a password reset link).
 *
 * Body:
 * - approved: boolean (required) - Whether to approve or reject
 * - feedback?: string - Optional feedback from approver
 * - reason?: string - Optional reason (for rejections)
 * - approver?: string - Optional approver identifier
 *
 * Security model:
 * - Token is cryptographically generated (crypto.randomUUID())
 * - Token is one-time use (deleted after successful resumption)
 * - Token has expiration (configured via HITL timeout)
 * - Token is delivered via secure channel (notification to authorized user)
 */
app.post('/:token', async (c) => {
  const token = c.req.param('token')
  const env = c.env

  try {
    // Get resume data from body
    const resumeData = await c.req.json().catch(() => ({}))

    // Get HITLState DO namespace
    const namespace = (env as unknown as Record<string, unknown>).HITL_STATE as
      | DurableObjectNamespace
      | undefined
    if (!namespace) {
      return c.json(
        {
          error: 'HITLState Durable Object not configured',
          message: 'Resumption requires HITL_STATE binding in wrangler.toml',
        },
        500
      )
    }

    // Create resumption manager
    const resumptionManager = new ResumptionManager(namespace)

    // Load suspended state
    const stateResult = await resumptionManager.resume(token)
    if (!stateResult.success) {
      return c.json(
        {
          error: 'Failed to load resumption state',
          message: stateResult.error.message,
          token,
        },
        404
      )
    }

    const suspendedState = stateResult.value

    // Create execution context
    const ctx = {
      waitUntil: (_promise: Promise<unknown>) => {},
      passThroughOnException: () => {},
    } as ExecutionContext

    // Create executor
    const executor = new Executor({ env, ctx })

    // Resume execution with the provided data
    const result = await executor.resumeExecution(suspendedState, resumeData)

    if (!result.success) {
      return c.json(
        {
          error: 'Execution failed after resumption',
          message: result.error.message,
          token,
        },
        500
      )
    }

    // Delete the resumption token (one-time use)
    await resumptionManager.cancel(token)

    const status = resumeData.approved === false ? 'rejected' : 'approved'
    logger.info(`Workflow ${status}`, {
      token: token.substring(0, 8) + '...',
      ensemble: suspendedState.ensemble?.name,
      approved: resumeData.approved,
    })

    return c.json({
      status,
      token,
      result: result.value,
      message: `Execution ${status} and completed`,
    })
  } catch (error) {
    logger.error('Resumption failed', error instanceof Error ? error : undefined, {
      token: token.substring(0, 8) + '...',
    })

    return c.json(
      {
        error: 'Resumption failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        token,
      },
      500
    )
  }
})

/**
 * Get resumption token metadata
 * GET /callback/:token (base path is configurable)
 *
 * Retrieve metadata about a resumption token without consuming it.
 * Useful for displaying approval context in a UI.
 */
app.get('/:token', async (c) => {
  const token = c.req.param('token')
  const env = c.env

  try {
    // Get HITLState DO namespace
    const namespace = (env as unknown as Record<string, unknown>).HITL_STATE as
      | DurableObjectNamespace
      | undefined
    if (!namespace) {
      return c.json(
        {
          error: 'HITLState Durable Object not configured',
          message: 'Resumption requires HITL_STATE binding in wrangler.toml',
        },
        500
      )
    }

    // Create resumption manager
    const resumptionManager = new ResumptionManager(namespace)

    // Get metadata
    const metadataResult = await resumptionManager.getMetadata(token)
    if (!metadataResult.success) {
      return c.json(
        {
          error: 'Token not found',
          message: metadataResult.error.message,
          token,
        },
        404
      )
    }

    return c.json({
      token,
      metadata: metadataResult.value,
      status: 'suspended',
    })
  } catch (error) {
    return c.json(
      {
        error: 'Failed to get token metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default app
