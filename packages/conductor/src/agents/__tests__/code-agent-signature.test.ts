import { describe, it, expect, vi } from 'vitest'
import { CodeAgent } from '../code-agent'
import type { AgentExecutionContext } from '../base-agent'

describe('CodeAgent function signature detection', () => {
  const mockContext: AgentExecutionContext = {
    input: { data: { pong: true, message: 'test' } },
    env: {} as any,
    ctx: { waitUntil: vi.fn() } as any,
  }

  it('should call legacy 2-param handler with (input, context)', async () => {
    // Legacy style: handler(input, ctx)
    let receivedInput: any = null
    let receivedCtx: any = null

    const legacyHandler = async (input: any, ctx: any) => {
      receivedInput = input
      receivedCtx = ctx
      return { echo: input.data, received: true }
    }

    // Verify handler has 2 parameters
    expect(legacyHandler.length).toBe(2)

    const agent = new CodeAgent({
      name: 'test-legacy',
      operation: 'code',
      config: { handler: legacyHandler },
    })

    const result = await agent.execute(mockContext)

    // Verify the result is correct
    expect(result.data).toEqual({ echo: { pong: true, message: 'test' }, received: true })

    // Verify input was passed correctly (first param)
    expect(receivedInput).toEqual({ data: { pong: true, message: 'test' } })

    // Verify context was passed (second param) and has expected properties
    expect(receivedCtx.input).toEqual({ data: { pong: true, message: 'test' } })
    expect(receivedCtx.env).toBeDefined()
  })

  it('should call modern 1-param handler with (context)', async () => {
    // Modern style: handler(context)
    let receivedCtx: any = null

    const modernHandler = async (ctx: any) => {
      receivedCtx = ctx
      return { echo: ctx.input.data, received: true }
    }

    // Verify handler has 1 parameter
    expect(modernHandler.length).toBe(1)

    const agent = new CodeAgent({
      name: 'test-modern',
      operation: 'code',
      config: { handler: modernHandler },
    })

    const result = await agent.execute(mockContext)

    // Verify the result is correct
    expect(result.data).toEqual({ echo: { pong: true, message: 'test' }, received: true })

    // Verify context was passed with expected properties
    expect(receivedCtx.input).toEqual({ data: { pong: true, message: 'test' } })
    expect(receivedCtx.env).toBeDefined()
  })

  it('should handle 0-param handlers as modern style', async () => {
    // No params - will be called with context but ignores it
    const noParamHandler = async () => {
      return { static: 'result' }
    }

    expect(noParamHandler.length).toBe(0)

    const agent = new CodeAgent({
      name: 'test-no-param',
      operation: 'code',
      config: { handler: noParamHandler },
    })

    const result = await agent.execute(mockContext)

    expect(result.data).toEqual({ static: 'result' })
  })
})
