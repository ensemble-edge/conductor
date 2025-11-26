/**
 * Queue Agent Tests
 *
 * Comprehensive tests for Queue agent functionality including:
 * - Single message sending
 * - Batch message sending
 * - Message consumption with retries
 * - Exponential backoff
 * - Dead letter queue (DLQ) support
 * - Delivery guarantees
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueueMember } from '../queue-agent.js'
import type {
  QueueAgentConfig,
  QueueMemberInput,
  QueueMemberOutput,
  QueueMessage,
} from '../types/index.js'
import type { AgentConfig } from '../../../runtime/parser.js'
import type { AgentExecutionContext } from '../../base-agent.js'

// Mock Queue implementation
class MockQueue {
  public messages: any[] = []
  public sendCallCount = 0
  public failOnSend = false
  public sendError: Error | null = null

  async send(body: unknown, options?: any): Promise<void> {
    this.sendCallCount++

    if (this.failOnSend) {
      throw this.sendError || new Error('Queue send failed')
    }

    this.messages.push({
      body,
      options,
      timestamp: Date.now(),
    })
  }

  clear(): void {
    this.messages = []
    this.sendCallCount = 0
    this.failOnSend = false
    this.sendError = null
  }

  getMessages(): any[] {
    return [...this.messages]
  }
}

describe('QueueMember', () => {
  let mockQueue: MockQueue
  let mockDLQ: MockQueue
  let mockContext: AgentExecutionContext

  beforeEach(() => {
    mockQueue = new MockQueue()
    mockDLQ = new MockQueue()

    mockContext = {
      input: {},
      env: {
        MY_QUEUE: mockQueue,
        DLQ: mockDLQ,
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
    } as unknown as AgentExecutionContext
  })

  describe('Configuration Validation', () => {
    it('should throw error if queue binding is missing', () => {
      const config = {
        name: 'test-queue',
        type: 'Queue',
        config: {
          mode: 'send',
        },
      } as AgentConfig

      expect(() => new QueueMember(config)).toThrow('requires queue binding name')
    })

    it('should throw error if retry maxAttempts is invalid', () => {
      const config = {
        name: 'test-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          retry: {
            maxAttempts: 0,
          },
        },
      } as AgentConfig

      expect(() => new QueueMember(config)).toThrow('maxAttempts must be at least 1')
    })

    it('should throw error if DLQ config is incomplete', () => {
      const config = {
        name: 'test-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          dlq: {
            queueName: '',
            maxDeliveryAttempts: 3,
          },
        },
      } as AgentConfig

      expect(() => new QueueMember(config)).toThrow('DLQ configuration requires queueName')
    })

    it('should accept valid configuration', () => {
      const config = {
        name: 'test-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
          retry: {
            maxAttempts: 3,
          },
        },
      } as AgentConfig

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
      expect(agent.name).toBe('test-queue')
    })
  })

  describe('Send Single Message', () => {
    it('should send message successfully', async () => {
      const config: AgentConfig = {
        name: 'send-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: {
          body: { userId: '123', action: 'process' },
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true)
      expect(result.mode).toBe('send')
      expect(result.messageId).toBeDefined()
      expect(result.messageCount).toBe(1)
      expect(mockQueue.sendCallCount).toBe(1)
      expect(mockQueue.messages).toHaveLength(1)
      expect(mockQueue.messages[0].body).toEqual({ userId: '123', action: 'process' })
    })

    it('should send message with metadata', async () => {
      const config: AgentConfig = {
        name: 'send-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: {
          id: 'custom-id-123',
          body: { data: 'test' },
          metadata: { source: 'api', priority: 'high' },
          headers: { 'x-trace-id': 'abc123' },
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('should send message with delay', async () => {
      const config: AgentConfig = {
        name: 'send-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: {
          body: { task: 'delayed' },
          delaySeconds: 300,
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true)
      expect(mockQueue.messages[0].options.delaySeconds).toBe(300)
    })

    it('should handle send failure', async () => {
      mockQueue.failOnSend = true
      mockQueue.sendError = new Error('Queue is full')

      const config: AgentConfig = {
        name: 'send-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: {
          body: { data: 'test' },
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(false)
      expect(result.error).toBe('Queue is full')
    })

    it('should throw error if message is missing', async () => {
      const config: AgentConfig = {
        name: 'send-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {}

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'Send mode requires message in input'
      )
    })

    it('should use custom content type', async () => {
      const config: AgentConfig = {
        name: 'send-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
          contentType: 'application/xml',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: {
          body: '<data>test</data>',
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true)
      expect(mockQueue.messages[0].options.contentType).toBe('application/xml')
    })
  })

  describe('Send Batch Messages', () => {
    it('should send multiple messages successfully', async () => {
      const config: AgentConfig = {
        name: 'batch-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send-batch',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        messages: [
          { body: { id: 1, action: 'process' } },
          { body: { id: 2, action: 'process' } },
          { body: { id: 3, action: 'process' } },
        ],
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true)
      expect(result.mode).toBe('send-batch')
      expect(result.messageIds).toHaveLength(3)
      expect(result.messageCount).toBe(3)
      expect(mockQueue.sendCallCount).toBe(3)
      expect(mockQueue.messages).toHaveLength(3)
    })

    it('should handle partial failures in non-atomic mode', async () => {
      let sendCount = 0
      mockQueue.send = vi.fn(async () => {
        sendCount++
        if (sendCount === 2) {
          throw new Error('Message 2 failed')
        }
      })

      const config: AgentConfig = {
        name: 'batch-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send-batch',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        messages: [{ body: { id: 1 } }, { body: { id: 2 } }, { body: { id: 3 } }],
        batchOptions: {
          messages: [],
          atomic: false,
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true) // Some succeeded
      expect(result.messageIds).toHaveLength(2) // Only 2 succeeded
      expect(result.failedMessages).toHaveLength(1)
      expect(result.failedMessages![0].message.body).toEqual({ id: 2 })
    })

    it('should stop on first failure in atomic mode', async () => {
      let sendCount = 0
      mockQueue.send = vi.fn(async () => {
        sendCount++
        if (sendCount === 2) {
          throw new Error('Atomic failure')
        }
      })

      const config: AgentConfig = {
        name: 'batch-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send-batch',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        messages: [{ body: { id: 1 } }, { body: { id: 2 } }, { body: { id: 3 } }],
        batchOptions: {
          messages: [],
          atomic: true,
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(false)
      expect(result.messageIds).toHaveLength(1) // Only first succeeded before failure
      expect(result.failedMessages).toHaveLength(1)
    })

    it('should throw error if messages array is empty', async () => {
      const config: AgentConfig = {
        name: 'batch-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send-batch',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        messages: [],
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'requires messages array'
      )
    })

    it('should use messages from batchOptions', async () => {
      const config: AgentConfig = {
        name: 'batch-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send-batch',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        batchOptions: {
          messages: [{ body: { id: 1 } }, { body: { id: 2 } }],
          atomic: false,
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(true)
      expect(result.messageCount).toBe(2)
    })
  })

  describe('Message Consumption', () => {
    it('should set up consumer mode', async () => {
      const config: AgentConfig = {
        name: 'consumer-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'consume',
          consumer: {
            maxConcurrency: 10,
            maxBatchSize: 5,
            maxRetries: 3,
          },
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        mode: 'consume',
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.mode).toBe('consume')
      expect(result.success).toBe(true)
    })

    it('should throw error if consumer config is missing', async () => {
      const config: AgentConfig = {
        name: 'consumer-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'consume',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        mode: 'consume',
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'requires consumer configuration'
      )
    })
  })

  describe('Retry Logic', () => {
    it('should configure retry with defaults', () => {
      const config: AgentConfig = {
        name: 'retry-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          retry: {
            maxAttempts: 3,
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should configure retry with custom settings', () => {
      const config: AgentConfig = {
        name: 'retry-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          retry: {
            maxAttempts: 5,
            initialDelay: 2000,
            maxDelay: 120000,
            backoffMultiplier: 3,
            jitter: 0.2,
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should calculate exponential backoff correctly', () => {
      const config: AgentConfig = {
        name: 'retry-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          retry: {
            maxAttempts: 5,
            initialDelay: 1000,
            maxDelay: 60000,
            backoffMultiplier: 2,
            jitter: 0.1,
          },
        },
      }

      const agent = new QueueMember(config)

      // Test private method via agent instance
      const delay0 = agent['calculateBackoff'](0)
      const delay1 = agent['calculateBackoff'](1)
      const delay2 = agent['calculateBackoff'](2)
      const delay3 = agent['calculateBackoff'](3)

      // With jitter of 0.1 (10%), values should be within 10% of expected
      expect(delay0).toBeGreaterThanOrEqual(900) // 1000 * 2^0 +/- 10%
      expect(delay0).toBeLessThanOrEqual(1100)
      expect(delay1).toBeGreaterThanOrEqual(1800) // 1000 * 2^1 +/- 10%
      expect(delay1).toBeLessThanOrEqual(2200)
      expect(delay2).toBeGreaterThanOrEqual(3600) // 1000 * 2^2 +/- 10%
      expect(delay2).toBeLessThanOrEqual(4400)
      expect(delay3).toBeGreaterThanOrEqual(7200) // 1000 * 2^3 +/- 10%
      expect(delay3).toBeLessThanOrEqual(8800)
    })

    it('should respect max delay', () => {
      const config: AgentConfig = {
        name: 'retry-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          retry: {
            maxAttempts: 10,
            initialDelay: 1000,
            maxDelay: 5000,
            backoffMultiplier: 2,
            jitter: 0.1,
          },
        },
      }

      const agent = new QueueMember(config)

      const delay5 = agent['calculateBackoff'](5) // Would be 32000 without cap
      // With jitter, should be around 5000 +/- 10%
      expect(delay5).toBeGreaterThanOrEqual(4500)
      expect(delay5).toBeLessThanOrEqual(5500)
    })

    it('should add jitter to backoff', () => {
      const config: AgentConfig = {
        name: 'retry-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          retry: {
            maxAttempts: 3,
            initialDelay: 1000,
            backoffMultiplier: 2,
            jitter: 0.1,
          },
        },
      }

      const agent = new QueueMember(config)

      // With jitter, delays should vary
      const delays = Array.from({ length: 10 }, () => agent['calculateBackoff'](1))
      const uniqueDelays = new Set(delays)

      // Should have some variation due to jitter
      expect(uniqueDelays.size).toBeGreaterThan(1)

      // But all should be within reasonable range (2000 +/- 10%)
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(1800)
        expect(delay).toBeLessThanOrEqual(2200)
      })
    })
  })

  describe('Dead Letter Queue (DLQ)', () => {
    it('should configure DLQ', () => {
      const config: AgentConfig = {
        name: 'dlq-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          dlq: {
            queueName: 'DLQ',
            maxDeliveryAttempts: 3,
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should throw error if DLQ maxDeliveryAttempts is invalid', () => {
      const config: AgentConfig = {
        name: 'dlq-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          dlq: {
            queueName: 'DLQ',
            maxDeliveryAttempts: 0,
          },
        },
      }

      expect(() => new QueueMember(config)).toThrow('maxDeliveryAttempts must be at least 1')
    })
  })

  describe('Delivery Modes', () => {
    it('should configure at-least-once delivery', () => {
      const config: AgentConfig = {
        name: 'delivery-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          deliveryMode: 'at-least-once',
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should configure exactly-once delivery', () => {
      const config: AgentConfig = {
        name: 'delivery-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          deliveryMode: 'exactly-once',
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })
  })

  describe('Queue Binding', () => {
    it('should throw error if queue binding not found', async () => {
      const config: AgentConfig = {
        name: 'missing-queue',
        type: 'Queue',
        config: {
          queue: 'NONEXISTENT_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: { body: { data: 'test' } },
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow(
        'Queue binding "NONEXISTENT_QUEUE" not found'
      )
    })

    it('should use correct queue binding', async () => {
      const secondQueue = new MockQueue()
      mockContext.env.SECOND_QUEUE = secondQueue as any

      const config: AgentConfig = {
        name: 'second-queue',
        type: 'Queue',
        config: {
          queue: 'SECOND_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: { body: { data: 'test' } },
      }

      await agent['run']({ ...mockContext, input })

      expect(secondQueue.sendCallCount).toBe(1)
      expect(mockQueue.sendCallCount).toBe(0) // Original queue not used
    })
  })

  describe('Message ID Generation', () => {
    it('should generate unique message IDs', async () => {
      const config: AgentConfig = {
        name: 'id-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const messageIds = new Set<string>()

      for (let i = 0; i < 10; i++) {
        const input: QueueMemberInput = {
          message: { body: { index: i } },
        }

        const result = (await agent['run']({
          ...mockContext,
          input,
        })) as QueueMemberOutput

        messageIds.add(result.messageId!)
      }

      expect(messageIds.size).toBe(10) // All IDs unique
    })

    it('should use custom message ID when provided', async () => {
      const config: AgentConfig = {
        name: 'custom-id-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const customId = 'my-custom-id-123'
      const input: QueueMemberInput = {
        message: {
          id: customId,
          body: { data: 'test' },
        },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.messageId).toBe(customId)
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown mode gracefully', async () => {
      const config: AgentConfig = {
        name: 'error-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        mode: 'invalid-mode' as any,
      }

      await expect(agent['run']({ ...mockContext, input })).rejects.toThrow('Unknown queue mode')
    })

    it('should provide detailed error messages', async () => {
      mockQueue.failOnSend = true
      mockQueue.sendError = new Error('Network timeout after 30s')

      const config: AgentConfig = {
        name: 'error-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          mode: 'send',
        },
      }

      const agent = new QueueMember(config)
      const input: QueueMemberInput = {
        message: { body: { data: 'test' } },
      }

      const result = (await agent['run']({
        ...mockContext,
        input,
      })) as QueueMemberOutput

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network timeout after 30s')
    })
  })

  describe('Consumer Configuration', () => {
    it('should configure max concurrency', () => {
      const config: AgentConfig = {
        name: 'concurrent-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          consumer: {
            maxConcurrency: 50,
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should configure batch processing', () => {
      const config: AgentConfig = {
        name: 'batch-consumer-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          consumer: {
            maxBatchSize: 10,
            maxWaitTime: 5,
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should configure visibility timeout', () => {
      const config: AgentConfig = {
        name: 'timeout-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          consumer: {
            visibilityTimeout: 300,
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })

    it('should configure handler ensemble', () => {
      const config: AgentConfig = {
        name: 'handler-queue',
        type: 'Queue',
        config: {
          queue: 'MY_QUEUE',
          consumer: {
            handlerEnsemble: 'process-messages',
          },
        },
      }

      const agent = new QueueMember(config)
      expect(agent).toBeDefined()
    })
  })
})
