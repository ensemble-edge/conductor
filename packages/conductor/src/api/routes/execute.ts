/**
 * Execute Routes
 *
 * Endpoints for executing agents and ensembles synchronously.
 *
 * Route structure:
 * - POST /ensemble/:name - Execute ensemble by name (URL-based, preferred)
 * - POST /agent/:name - Execute agent by name (URL-based, if allowed)
 * - POST / - Execute by body { agent: "name" } or { ensemble: "name" } (legacy)
 * - POST /:name - Execute ensemble by name (legacy, for backward compat)
 */

import { Hono } from 'hono'
import type { ConductorContext, ExecuteRequest, ExecuteResponse } from '../types.js'
import { getBuiltInRegistry } from '../../agents/built-in/registry.js'
import { getMemberLoader, getEnsembleLoader } from '../auto-discovery.js'
import type { AgentExecutionContext } from '../../agents/base-agent.js'
import { Executor } from '../../runtime/executor.js'
import { createLogger } from '../../observability/index.js'
import {
  getSecurityConfig,
  isDirectAgentExecutionAllowed,
  getRequiredPermission,
} from '../../config/security.js'
import { hasPermission } from '../../auth/permissions.js'

const execute = new Hono<{ Bindings: Env }>()
const logger = createLogger({ serviceName: 'api-execute' })

/**
 * Check if user has required permission for resource
 * Returns error response if permission check fails, null if allowed
 */
function checkPermission(
  c: ConductorContext,
  resourceType: 'ensemble' | 'agent',
  resourceName: string,
  requestId: string | undefined
): Response | null {
  const requiredPerm = getRequiredPermission(resourceType, resourceName)

  // No auto-permissions configured
  if (!requiredPerm) {
    return null
  }

  // Get user permissions from auth context
  const auth = c.get('auth')
  const userPermissions = auth?.user?.permissions || []

  // Check permission
  if (!hasPermission(userPermissions, requiredPerm)) {
    return c.json(
      {
        error: 'Forbidden',
        message: `Missing required permission: ${requiredPerm}`,
        timestamp: Date.now(),
        requestId,
      },
      403
    ) as unknown as Response
  }

  return null
}

/**
 * Helper function to execute an ensemble
 * Shared logic between all ensemble execution routes
 */
async function executeEnsemble(
  c: ConductorContext,
  ensembleName: string,
  input: any,
  startTime: number,
  requestId: string | undefined,
  routePath: string
) {
  // Check permission
  const permError = checkPermission(c, 'ensemble', ensembleName, requestId)
  if (permError) return permError

  try {
    // Get ensemble loader
    const ensembleLoader = getEnsembleLoader()

    if (!ensembleLoader) {
      return c.json(
        {
          error: 'NotInitialized',
          message: 'Ensemble loader not initialized',
          timestamp: Date.now(),
          requestId,
        },
        503
      )
    }

    // Check if ensemble exists
    const ensemble = ensembleLoader.getEnsemble(ensembleName)
    if (!ensemble) {
      return c.json(
        {
          error: 'NotFound',
          message: `Ensemble not found: ${ensembleName}`,
          path: routePath,
          timestamp: Date.now(),
          requestId,
        },
        404
      )
    }

    // Create executor
    const executor = new Executor({
      env: c.env,
      ctx: c.executionCtx,
    })

    // Register all agents from memberLoader
    const memberLoader = getMemberLoader()
    if (memberLoader) {
      for (const agent of memberLoader.getAllMembers()) {
        executor.registerAgent(agent)
      }
    }

    // Execute ensemble
    const result = await executor.executeEnsemble(ensemble, input)

    // Handle Result type - unwrap or return error
    if (!result.success) {
      return c.json(
        {
          error: 'ExecutionError',
          message: result.error.message,
          code: result.error.code,
          timestamp: Date.now(),
          requestId,
        },
        500
      )
    }

    // Return response
    return c.json({
      success: true,
      output: result.value.output,
      metadata: {
        executionId: requestId || 'unknown',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      },
    })
  } catch (error) {
    logger.error('Ensemble execution failed', error instanceof Error ? error : undefined, {
      requestId,
      ensembleName,
    })

    return c.json(
      {
        error: 'ExecutionError',
        message: (error as Error).message || 'Execution failed',
        timestamp: Date.now(),
        requestId,
      },
      500
    )
  }
}

/**
 * Helper function to execute an agent
 * Shared logic between all agent execution routes
 */
async function executeAgent(
  c: ConductorContext,
  agentName: string,
  input: any,
  config: any,
  startTime: number,
  requestId: string | undefined,
  routePath: string
): Promise<Response> {
  // Check if direct agent execution is allowed
  if (!isDirectAgentExecutionAllowed()) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'Direct agent execution is disabled. Use ensembles instead.',
        timestamp: Date.now(),
        requestId,
      },
      403
    ) as unknown as Response
  }

  // Check permission
  const permError = checkPermission(c, 'agent', agentName, requestId)
  if (permError) return permError

  try {
    // Get built-in registry
    const builtInRegistry = getBuiltInRegistry()

    // Get member loader for custom agents
    const memberLoader = getMemberLoader()

    // Check if agent exists (built-in or custom)
    const isBuiltIn = builtInRegistry.isBuiltIn(agentName)
    const isCustom = memberLoader?.hasMember(agentName) || false

    if (!isBuiltIn && !isCustom) {
      return c.json(
        {
          error: 'NotFound',
          message: `Agent not found: ${agentName}`,
          path: routePath,
          timestamp: Date.now(),
          requestId,
        },
        404
      ) as unknown as Response
    }

    // Get agent instance
    let agent
    if (isBuiltIn) {
      // Get agent metadata
      const metadata = builtInRegistry.getMetadata(agentName)
      if (!metadata) {
        return c.json(
          {
            error: 'NotFound',
            message: `Agent metadata not found: ${agentName}`,
            timestamp: Date.now(),
            requestId,
          },
          404
        ) as unknown as Response
      }

      // Create agent instance from built-in registry
      const agentConfig = {
        name: agentName,
        operation: metadata.operation,
        config: config || {},
      }

      agent = await builtInRegistry.create(agentName, agentConfig, c.env)
    } else {
      // Get custom agent from member loader
      agent = memberLoader!.getAgent(agentName)
      if (!agent) {
        return c.json(
          {
            error: 'NotFound',
            message: `Agent instance not found: ${agentName}`,
            timestamp: Date.now(),
            requestId,
          },
          404
        ) as unknown as Response
      }
    }

    // Create execution context
    const memberContext: AgentExecutionContext = {
      input,
      env: c.env,
      ctx: c.executionCtx,
    }

    // Execute agent
    const result = await agent.execute(memberContext)

    // Check if execution was successful
    if (!result.success) {
      return c.json(
        {
          error: 'ExecutionError',
          message: result.error || 'Execution failed',
          timestamp: Date.now(),
          requestId,
        },
        500
      ) as unknown as Response
    }

    // Return success response
    const response: ExecuteResponse = {
      success: true,
      data: result.data,
      metadata: {
        executionId: requestId || 'unknown',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      },
    }

    return c.json(response) as unknown as Response
  } catch (error) {
    logger.error('Agent execution failed', error instanceof Error ? error : undefined, {
      requestId,
      agentName,
    })

    return c.json(
      {
        error: 'ExecutionError',
        message: (error as Error).message || 'Execution failed',
        timestamp: Date.now(),
        requestId,
      },
      500
    ) as unknown as Response
  }
}

// ============================================================================
// NEW ROUTES (Preferred)
// ============================================================================

/**
 * POST /ensemble/:name - Execute an ensemble by name (URL-based)
 *
 * This is the preferred way to execute ensembles.
 * Example: POST /api/v1/execute/ensemble/invoice-pdf
 */
execute.post('/ensemble/:name', async (c: ConductorContext) => {
  const startTime = Date.now()
  const requestId = c.get('requestId')
  const ensembleName = c.req.param('name')

  // Parse request body (input is optional for some ensembles)
  let input = {}
  try {
    const body = await c.req.json<{ input?: any }>()
    input = body.input || {}
  } catch {
    // Empty body is OK
  }

  return executeEnsemble(
    c,
    ensembleName,
    input,
    startTime,
    requestId,
    `/api/v1/execute/ensemble/${ensembleName}`
  )
})

/**
 * POST /agent/:name - Execute an agent by name (URL-based)
 *
 * Only available if allowDirectAgentExecution is true (default).
 * Example: POST /api/v1/execute/agent/http
 */
execute.post('/agent/:name', async (c: ConductorContext) => {
  const startTime = Date.now()
  const requestId = c.get('requestId')
  const agentName = c.req.param('name')

  // Parse request body
  const body = await c.req.json<{ input?: any; config?: any }>()

  if (!body.input) {
    return c.json(
      {
        error: 'ValidationError',
        message: 'Input is required',
        timestamp: Date.now(),
        requestId,
      },
      400
    )
  }

  return executeAgent(
    c,
    agentName,
    body.input,
    body.config,
    startTime,
    requestId,
    `/api/v1/execute/agent/${agentName}`
  )
})

// ============================================================================
// LEGACY ROUTES (Backward Compatibility)
// ============================================================================

/**
 * POST / - Execute by body (legacy, for backward compatibility)
 *
 * Supports two modes:
 * - Agent execution: { agent: "agent-name", input: {...} }
 * - Ensemble execution: { ensemble: "ensemble-name", input: {...} }
 */
execute.post('/', async (c: ConductorContext) => {
  const startTime = Date.now()
  const requestId = c.get('requestId')

  // Parse request body - extend ExecuteRequest to support ensemble
  const body = await c.req.json<ExecuteRequest & { ensemble?: string }>()

  // Validate request - either agent or ensemble must be provided
  if (!body.agent && !body.ensemble) {
    return c.json(
      {
        error: 'ValidationError',
        message: 'Either agent or ensemble name is required',
        timestamp: Date.now(),
        requestId,
      },
      400
    )
  }

  // If ensemble is provided, delegate to ensemble execution
  if (body.ensemble) {
    return executeEnsemble(
      c,
      body.ensemble,
      body.input || {},
      startTime,
      requestId,
      '/api/v1/execute'
    )
  }

  // Agent execution
  if (!body.input) {
    return c.json(
      {
        error: 'ValidationError',
        message: 'Input is required',
        timestamp: Date.now(),
        requestId,
      },
      400
    )
  }

  return executeAgent(
    c,
    body.agent!,
    body.input,
    body.config,
    startTime,
    requestId,
    '/api/v1/execute'
  )
})

/**
 * POST /:ensembleName - Execute ensemble by name (legacy URL pattern)
 *
 * This route is kept for backward compatibility.
 * Prefer using POST /ensemble/:name instead.
 *
 * Note: This must be registered AFTER the /ensemble/:name and /agent/:name routes
 * to avoid conflicting with them.
 */
execute.post('/:ensembleName', async (c: ConductorContext) => {
  const startTime = Date.now()
  const requestId = c.get('requestId')
  const ensembleName = c.req.param('ensembleName')

  // Skip if this matches our new route patterns
  if (ensembleName === 'ensemble' || ensembleName === 'agent') {
    return c.json(
      {
        error: 'ValidationError',
        message: 'Invalid ensemble name',
        timestamp: Date.now(),
        requestId,
      },
      400
    )
  }

  // Parse request body
  let input = {}
  try {
    const body = await c.req.json<{ input?: any }>()
    input = body.input || {}
  } catch {
    // Empty body is OK
  }

  return executeEnsemble(
    c,
    ensembleName,
    input,
    startTime,
    requestId,
    `/api/v1/execute/${ensembleName}`
  )
})

export default execute
