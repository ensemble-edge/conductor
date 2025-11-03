/**
 * Members Routes
 *
 * Endpoints for listing and discovering members.
 */

import { Hono } from 'hono'
import type { ConductorContext, MemberListResponse, MemberDetailResponse } from '../types'
import { getBuiltInRegistry } from '../../members/built-in/registry'
import { createLogger } from '../../observability'

const members = new Hono<{ Bindings: Env }>()
const logger = createLogger({ serviceName: 'api-members' })

/**
 * GET /members - List all available members
 */
members.get('/', async (c: ConductorContext) => {
  try {
    const builtInRegistry = getBuiltInRegistry()
    const builtInMembers = builtInRegistry.list()

    // Map to response format
    const membersList = builtInMembers.map((metadata) => ({
      name: metadata.name,
      type: metadata.type,
      version: metadata.version,
      description: metadata.description,
      builtIn: true,
    }))

    // TODO: Add user-defined members from database

    const response: MemberListResponse = {
      members: membersList,
      count: membersList.length,
    }

    return c.json(response)
  } catch (error) {
    logger.error('Failed to list members', error instanceof Error ? error : undefined, {
      requestId: c.get('requestId'),
    })

    return c.json(
      {
        error: 'InternalServerError',
        message: 'Failed to list members',
        timestamp: Date.now(),
      },
      500
    )
  }
})

/**
 * GET /members/:name - Get member details
 */
members.get('/:name', async (c: ConductorContext) => {
  const name = c.req.param('name')

  try {
    const builtInRegistry = getBuiltInRegistry()

    // Check if it's a built-in member
    if (builtInRegistry.isBuiltIn(name)) {
      const metadata = builtInRegistry.getMetadata(name)
      if (!metadata) {
        return c.json(
          {
            error: 'NotFound',
            message: `Member not found: ${name}`,
            timestamp: Date.now(),
          },
          404
        )
      }

      const response: MemberDetailResponse = {
        name: metadata.name,
        type: metadata.type,
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

    // TODO: Check user-defined members from database

    return c.json(
      {
        error: 'NotFound',
        message: `Member not found: ${name}`,
        timestamp: Date.now(),
      },
      404
    )
  } catch (error) {
    logger.error('Failed to get member details', error instanceof Error ? error : undefined, {
      requestId: c.get('requestId'),
      memberName: c.req.param('name'),
    })

    return c.json(
      {
        error: 'InternalServerError',
        message: 'Failed to get member details',
        timestamp: Date.now(),
      },
      500
    )
  }
})

export default members
