import { describe, it, expect, vi } from 'vitest'
import { FunctionAgent } from '../function-agent'
import type { AgentExecutionContext } from '../base-agent'

describe('FunctionAgent function signature', () => {
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

    const agent = new FunctionAgent(
      {
        name: 'test-modern',
        operation: 'code',
      },
      handler
    )

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

    const agent = new FunctionAgent(
      {
        name: 'test-no-param',
        operation: 'code',
      },
      noParamHandler
    )

    const result = await agent.execute(mockContext)

    expect(result.data).toEqual({ static: 'result' })
  })

  it('should support echo agent pattern with context.input', async () => {
    // Echo agent using modern style with context.input
    interface EchoOutput {
      echo: any
      receivedAt: string
      inputType: string
    }

    const echoHandler = async (ctx: AgentExecutionContext): Promise<EchoOutput> => {
      return {
        echo: ctx.input.data,
        receivedAt: new Date().toISOString(),
        inputType: typeof ctx.input.data,
      }
    }

    const agent = new FunctionAgent(
      {
        name: 'echo',
        operation: 'code',
      },
      echoHandler
    )

    const result = await agent.execute({
      input: { data: { pong: true, message: 'hello' } },
      env: {} as any,
      ctx: { waitUntil: vi.fn() } as any,
    })

    // Verify the echo agent output structure
    expect(result.data).toMatchObject({
      echo: { pong: true, message: 'hello' },
      inputType: 'object',
    })
    expect((result.data as EchoOutput).receivedAt).toBeDefined()
  })
})
