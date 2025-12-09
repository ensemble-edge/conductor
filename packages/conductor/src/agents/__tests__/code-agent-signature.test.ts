import { describe, it, expect, vi } from 'vitest'
import { CodeAgent } from '../code-agent'
import type { AgentExecutionContext } from '../base-agent'

describe('CodeAgent function signature', () => {
  const mockContext: AgentExecutionContext = {
    input: { data: { pong: true, message: 'test' } },
    env: {} as any,
    ctx: { waitUntil: vi.fn() } as any,
  }

  it('should call handler with full context', async () => {
    // Modern style: handler(context)
    let receivedCtx: any = null

    const handler = async (ctx: AgentExecutionContext) => {
      receivedCtx = ctx
      return { echo: ctx.input.data, received: true }
    }

    const agent = new CodeAgent({
      name: 'test-modern',
      operation: 'code',
      config: { handler },
    })

    const result = await agent.execute(mockContext)

    // Verify the result is correct
    expect(result.data).toEqual({ echo: { pong: true, message: 'test' }, received: true })

    // Verify context was passed with expected properties
    expect(receivedCtx.input).toEqual({ data: { pong: true, message: 'test' } })
    expect(receivedCtx.env).toBeDefined()
  })

  it('should handle 0-param handlers', async () => {
    // No params - will be called with context but ignores it
    const noParamHandler = async () => {
      return { static: 'result' }
    }

    const agent = new CodeAgent({
      name: 'test-no-param',
      operation: 'code',
      config: { handler: noParamHandler },
    })

    const result = await agent.execute(mockContext)

    expect(result.data).toEqual({ static: 'result' })
  })
})
