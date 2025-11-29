/**
 * Queue Agent
 *
 * Cloudflare Queues integration for async message processing with:
 * - Message sending (single and batch)
 * - Message consumption with retry logic
 * - Dead letter queue support
 * - Exponential backoff
 */

import { BaseAgent, type AgentExecutionContext } from '../base-agent.js'
import type { AgentConfig } from '../../runtime/parser.js'
import type {
  QueueAgentConfig,
  QueueMemberInput,
  QueueMemberOutput,
  QueueMessage,
  QueueMode,
  ConsumerResult,
  FailedMessage,
  ReceivedQueueMessage,
} from './types/index.js'

export class QueueMember extends BaseAgent {
  private queueConfig: QueueAgentConfig

  constructor(config: AgentConfig) {
    super(config)
    // Extract nested config (config.config contains the agent-specific settings)
    this.queueConfig = (config.config || {}) as unknown as QueueAgentConfig

    // Validate configuration
    this.validateConfig()
  }

  /**
   * Validate agent configuration
   */
  private validateConfig(): void {
    if (!this.queueConfig.queue) {
      throw new Error('Queue agent requires queue binding name')
    }

    if (this.queueConfig.retry) {
      if (this.queueConfig.retry.maxAttempts < 1) {
        throw new Error('Retry maxAttempts must be at least 1')
      }
    }

    if (this.queueConfig.dlq) {
      if (!this.queueConfig.dlq.queueName) {
        throw new Error('DLQ configuration requires queueName')
      }
      if (this.queueConfig.dlq.maxDeliveryAttempts < 1) {
        throw new Error('DLQ maxDeliveryAttempts must be at least 1')
      }
    }
  }

  /**
   * Execute queue operation
   */
  protected async run(context: AgentExecutionContext): Promise<QueueMemberOutput> {
    const input = context.input as QueueMemberInput
    const mode = input.mode || this.queueConfig.mode || 'send'

    switch (mode) {
      case 'send':
        return this.sendMessage(input, context)

      case 'send-batch':
        return this.sendBatch(input, context)

      case 'consume':
        return this.consumeMessages(input, context)

      default:
        throw new Error(`Unknown queue mode: ${mode}`)
    }
  }

  /**
   * Send single message
   */
  private async sendMessage(
    input: QueueMemberInput,
    context: AgentExecutionContext
  ): Promise<QueueMemberOutput> {
    if (!input.message) {
      throw new Error('Send mode requires message in input')
    }

    const queue = this.getQueue(context)
    const message = this.prepareMessage(input.message)

    try {
      // In Cloudflare Queues, we use the send method
      await queue.send(message.body, {
        contentType: this.queueConfig.contentType || 'json',
        delaySeconds: message.delaySeconds,
      })

      return {
        mode: 'send',
        success: true,
        messageId: message.id || this.generateMessageId(),
        messageCount: 1,
      }
    } catch (error) {
      return {
        mode: 'send',
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Send batch of messages
   */
  private async sendBatch(
    input: QueueMemberInput,
    context: AgentExecutionContext
  ): Promise<QueueMemberOutput> {
    const messages = input.messages || input.batchOptions?.messages

    if (!messages || messages.length === 0) {
      throw new Error('Send-batch mode requires messages array')
    }

    const queue = this.getQueue(context)
    const atomic = input.batchOptions?.atomic || false
    const messageIds: string[] = []
    const failedMessages: FailedMessage[] = []

    for (const msg of messages) {
      try {
        const preparedMsg = this.prepareMessage(msg)
        await queue.send(preparedMsg.body, {
          contentType: this.queueConfig.contentType || 'json',
          delaySeconds: preparedMsg.delaySeconds,
        })

        const msgId = preparedMsg.id || this.generateMessageId()
        messageIds.push(msgId)
      } catch (error) {
        failedMessages.push({
          message: msg,
          error: (error as Error).message,
        })

        // If atomic, stop on first failure
        if (atomic) {
          break
        }
      }
    }

    const success = atomic ? failedMessages.length === 0 : messageIds.length > 0

    return {
      mode: 'send-batch',
      success,
      messageIds,
      messageCount: messageIds.length,
      failedMessages: failedMessages.length > 0 ? failedMessages : undefined,
      error: !success ? 'Some messages failed to send' : undefined,
    }
  }

  /**
   * Consume messages (called by Cloudflare Queue consumer)
   */
  private async consumeMessages(
    input: QueueMemberInput,
    context: AgentExecutionContext
  ): Promise<QueueMemberOutput> {
    // This would be called by the queue consumer handler
    // For testing purposes, we simulate message consumption

    const consumerConfig = this.queueConfig.consumer
    if (!consumerConfig) {
      throw new Error('Consume mode requires consumer configuration')
    }

    // In production, messages would come from the queue
    // For now, return a placeholder
    const results: ConsumerResult[] = []

    return {
      mode: 'consume',
      success: true,
      consumerResults: results,
    }
  }

  /**
   * Process a single message with retry logic
   */
  private async processMessage(
    message: ReceivedQueueMessage,
    context: AgentExecutionContext
  ): Promise<ConsumerResult> {
    const maxRetries = this.queueConfig.retry?.maxAttempts || 3
    const exponentialBackoff = this.queueConfig.retry?.exponentialBackoff !== false

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Call handler ensemble if configured
        const output = await this.executeHandler(message, context)

        return {
          messageId: message.id,
          success: true,
          output,
          retryCount: attempt,
        }
      } catch (error) {
        lastError = error as Error

        // Calculate backoff delay
        if (attempt < maxRetries && exponentialBackoff) {
          const delay = this.calculateBackoff(attempt)
          await this.sleep(delay)
        }
      }
    }

    // All retries exhausted - check if we should send to DLQ
    const shouldSendToDLQ =
      this.queueConfig.dlq && message.attempts >= this.queueConfig.dlq.maxDeliveryAttempts

    if (shouldSendToDLQ) {
      await this.sendToDLQ(message, context)
    }

    return {
      messageId: message.id,
      success: false,
      error: lastError?.message || 'Unknown error',
      retryCount: maxRetries,
      sentToDLQ: shouldSendToDLQ,
    }
  }

  /**
   * Execute handler ensemble for message
   */
  private async executeHandler(
    message: ReceivedQueueMessage,
    context: AgentExecutionContext
  ): Promise<unknown> {
    // In production, this would call the configured handler ensemble
    // For now, return the message body
    return message.body
  }

  /**
   * Send message to dead letter queue
   */
  private async sendToDLQ(
    message: ReceivedQueueMessage,
    context: AgentExecutionContext
  ): Promise<void> {
    if (!this.queueConfig.dlq) return

    const dlqName = this.queueConfig.dlq.queueName
    const dlqBinding = context.env[dlqName as keyof typeof context.env]

    if (dlqBinding && typeof dlqBinding === 'object' && 'send' in dlqBinding) {
      // Type-safe queue send - Cloudflare Queue binding
      const queue = dlqBinding as { send: (message: unknown) => Promise<void> }
      await queue.send({
        originalMessage: message,
        failedAt: new Date().toISOString(),
        attempts: message.attempts,
      })
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    const initialDelay = this.queueConfig.retry?.initialDelay || 1000 // 1 second
    const maxDelay = this.queueConfig.retry?.maxDelay || 60000 // 60 seconds
    const multiplier = this.queueConfig.retry?.backoffMultiplier || 2
    const jitter = this.queueConfig.retry?.jitter || 0.1

    // Calculate base delay
    let delay = initialDelay * Math.pow(multiplier, attempt)
    delay = Math.min(delay, maxDelay)

    // Add jitter
    const jitterAmount = delay * jitter * (Math.random() * 2 - 1)
    delay += jitterAmount

    return Math.max(0, Math.floor(delay))
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get queue binding from environment
   */
  private getQueue(context: AgentExecutionContext): any {
    const queueName = this.queueConfig.queue
    const queue = context.env[queueName as keyof typeof context.env]

    if (!queue) {
      throw new Error(`Queue binding "${queueName}" not found. Add it to wrangler.toml`)
    }

    return queue
  }

  /**
   * Prepare message for sending
   */
  private prepareMessage(message: QueueMessage): QueueMessage {
    return {
      id: message.id || this.generateMessageId(),
      body: message.body,
      metadata: message.metadata,
      delaySeconds: message.delaySeconds,
      headers: message.headers,
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
