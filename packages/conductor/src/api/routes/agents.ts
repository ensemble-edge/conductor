/**
 * Members Routes
 *
 * Endpoints for listing and discovering agents.
 */

import { Hono } from 'hono'
import type { ConductorContext, MemberListResponse, MemberDetailResponse } from '../types.js'
import { getBuiltInRegistry } from '../../agents/built-in/registry.js'
import { getMemberLoader } from '../auto-discovery.js'
import { createLogger } from '../../observability/index.js'

const agents = new Hono<{ Bindings: Env }>()
const logger = createLogger({ serviceName: 'api-agents' })

/**
 * GET /agents - List all available agents
 */
agents.get('/', async (c: ConductorContext) => {
  try {
    const builtInRegistry = getBuiltInRegistry()
    const builtInMembers = builtInRegistry.list()

    // Map built-in agents to response format
    const membersList = builtInMembers.map((metadata) => ({
      name: metadata.name,
      operation: metadata.operation,
      version: metadata.version,
      description: metadata.description,
      builtIn: true,
    }))

    // Add custom agents from auto-discovery
    const memberLoader = getMemberLoader()
    if (memberLoader) {
      const customAgentNames = memberLoader.getMemberNames()
      for (const name of customAgentNames) {
        const config = memberLoader.getAgentConfig(name)
        if (config) {
          membersList.push({
            name: config.name,
            operation: config.operation,
            version: '1.0.0',
            description: config.description || '',
            builtIn: false,
          })
        }
      }
    }

    const response: MemberListResponse = {
      agents: membersList,
      count: membersList.length,
    }

    return c.json(response)
  } catch (error) {
    logger.error('Failed to list agents', error instanceof Error ? error : undefined, {
      requestId: c.get('requestId'),
    })

    return c.json(
      {
        error: 'InternalServerError',
        message: 'Failed to list agents',
        timestamp: Date.now(),
      },
      500
    )
  }
})

/**
 * GET /agents/:name - Get agent details
 */
agents.get('/:name', async (c: ConductorContext) => {
  const name = c.req.param('name')

  try {
    const builtInRegistry = getBuiltInRegistry()

    // Check if it's a built-in agent
    if (builtInRegistry.isBuiltIn(name)) {
      const metadata = builtInRegistry.getMetadata(name)
      if (!metadata) {
        return c.json(
          {
            error: 'NotFound',
            message: `Agent not found: ${name}`,
            timestamp: Date.now(),
          },
          404
        )
      }

      const response: MemberDetailResponse = {
        name: metadata.name,
        operation: metadata.operation,
        version: metadata.version,
        description: metadata.description,
        builtIn: true,
        config: {
          schema: metadata.configSchema,
          defaults: {},
        },
        input: {
          schema: metadata.inputSchema,
          examples: metadata.examples,
        },
        output: {
          schema: metadata.outputSchema,
        },
      }

      return c.json(response)
    }

    // Check user-defined agents from auto-discovery
    const memberLoader = getMemberLoader()
    if (memberLoader) {
      const config = memberLoader.getAgentConfig(name)
      if (config) {
        const response: MemberDetailResponse = {
          name: config.name,
          operation: config.operation,
          version: '1.0.0',
          description: config.description || '',
          builtIn: false,
          config: {
            schema: undefined, // Agent config schema not available via discovery
            defaults: config.config || {},
          },
          input: {
            schema: config.schema?.input,
            examples: [],
          },
          output: {
            schema: config.schema?.output,
          },
        }

        return c.json(response)
      }
    }

    // Agent not found in either registry
    return c.json(
      {
        error: 'NotFound',
        message: `Agent not found: ${name}`,
        timestamp: Date.now(),
      },
      404
    )
  } catch (error) {
    logger.error('Failed to get agent details', error instanceof Error ? error : undefined, {
      requestId: c.get('requestId'),
      agentName: c.req.param('name'),
    })

    return c.json(
      {
        error: 'InternalServerError',
        message: 'Failed to get agent details',
        timestamp: Date.now(),
      },
      500
    )
  }
})

export default agents
