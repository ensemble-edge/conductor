/**
 * Ensembles Routes
 *
 * Endpoints for listing and discovering ensembles.
 */

import { Hono } from 'hono'
import type { ConductorContext } from '../types.js'
import { getEnsembleLoader } from '../auto-discovery.js'
import { createLogger } from '../../observability/index.js'

const ensembles = new Hono<{ Bindings: Env }>()
const logger = createLogger({ serviceName: 'api-ensembles' })

/**
 * Ensemble list item response
 */
interface EnsembleListItem {
  name: string
  description?: string
  version?: string
  source: 'yaml' | 'typescript'
  triggers?: Array<{
    type: string
    path?: string
    cron?: string
  }>
  agentCount: number
  stepCount: number
}

/**
 * Ensemble list response
 */
interface EnsembleListResponse {
  ensembles: EnsembleListItem[]
  count: number
}

/**
 * Ensemble detail response
 */
interface EnsembleDetailResponse {
  name: string
  description?: string
  version?: string
  source: 'yaml' | 'typescript'
  triggers?: Array<{
    type: string
    path?: string
    method?: string
    cron?: string
  }>
  input?: {
    schema?: Record<string, unknown>
  }
  output?: {
    schema?: Record<string, unknown>
  }
  agents?: Array<{
    name: string
    operation: string
  }>
  flow: Array<{
    type: string
    agent?: string
    [key: string]: unknown
  }>
}

/**
 * GET /ensembles - List all available ensembles
 */
ensembles.get('/', async (c: ConductorContext) => {
  try {
    const ensembleLoader = getEnsembleLoader()

    if (!ensembleLoader) {
      return c.json({
        ensembles: [],
        count: 0,
      } as EnsembleListResponse)
    }

    const loadedEnsembles = ensembleLoader.getAllLoadedEnsembles()

    const ensemblesList: EnsembleListItem[] = loadedEnsembles.map((loaded) => {
      const config = loaded.config

      // Extract trigger info
      const triggers = config.trigger?.map((t: any) => ({
        type: t.type,
        path: t.path,
        cron: t.cron,
      }))

      // Count steps in flow
      const stepCount = Array.isArray(config.flow) ? config.flow.length : 0

      // Count inline agents
      const agentCount = Array.isArray(config.agents) ? config.agents.length : 0

      return {
        name: config.name,
        description: config.description,
        version: '1.0.0', // Version not stored in config schema
        source: loaded.source,
        triggers,
        agentCount,
        stepCount,
      }
    })

    const response: EnsembleListResponse = {
      ensembles: ensemblesList,
      count: ensemblesList.length,
    }

    return c.json(response)
  } catch (error) {
    logger.error('Failed to list ensembles', error instanceof Error ? error : undefined, {
      requestId: c.get('requestId'),
    })

    return c.json(
      {
        error: 'InternalServerError',
        message: 'Failed to list ensembles',
        timestamp: Date.now(),
      },
      500
    )
  }
})

/**
 * GET /ensembles/:name - Get ensemble details
 */
ensembles.get('/:name', async (c: ConductorContext) => {
  const name = c.req.param('name')

  try {
    const ensembleLoader = getEnsembleLoader()

    if (!ensembleLoader) {
      return c.json(
        {
          error: 'NotFound',
          message: `Ensemble not found: ${name}`,
          timestamp: Date.now(),
        },
        404
      )
    }

    const loaded = ensembleLoader.getLoadedEnsemble(name)

    if (!loaded) {
      return c.json(
        {
          error: 'NotFound',
          message: `Ensemble not found: ${name}`,
          timestamp: Date.now(),
        },
        404
      )
    }

    const config = loaded.config

    // Extract trigger info with full details
    const triggers = config.trigger?.map((t: any) => ({
      type: t.type,
      path: t.path,
      method: t.method,
      cron: t.cron,
    }))

    // Extract inline agent info
    const agents = config.agents?.map((a: any) => ({
      name: a.name,
      operation: a.operation,
    }))

    // Map flow steps
    const flow = Array.isArray(config.flow)
      ? config.flow.map((step: any) => {
          if (step.agent) {
            return {
              type: 'agent',
              agent: step.agent,
              input: step.input,
              when: step.when,
              retry: step.retry,
              timeout: step.timeout,
            }
          }
          if (step.type) {
            return {
              type: step.type,
              ...step,
            }
          }
          return step
        })
      : []

    const response: EnsembleDetailResponse = {
      name: config.name,
      description: config.description,
      version: '1.0.0', // Version not stored in config schema
      source: loaded.source,
      triggers,
      input: config.inputs
        ? {
            schema: config.inputs,
          }
        : undefined,
      output: config.output
        ? {
            schema: config.output,
          }
        : undefined,
      agents,
      flow,
    }

    return c.json(response)
  } catch (error) {
    logger.error('Failed to get ensemble details', error instanceof Error ? error : undefined, {
      requestId: c.get('requestId'),
      ensembleName: name,
    })

    return c.json(
      {
        error: 'InternalServerError',
        message: 'Failed to get ensemble details',
        timestamp: Date.now(),
      },
      500
    )
  }
})

export default ensembles
