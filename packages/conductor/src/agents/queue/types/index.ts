/**
 * Queue Agent Types
 *
 * Cloudflare Queues integration for async message processing
 */

import type { AgentConfig } from '../../../runtime/parser.js'

/**
 * Queue operation modes
 */
export type QueueMode = 'send' | 'send-batch' | 'consume'

/**
 * Message delivery mode
 */
export type DeliveryMode = 'at-least-once' | 'exactly-once'

/**
 * Queue message
 */
export interface QueueMessage {
  /** Message ID (generated if not provided) */
  id?: string
  /** Message body (any JSON-serializable data) */
  body: unknown
  /** Message metadata */
  metadata?: Record<string, unknown>
  /** Delay before message becomes visible (seconds) */
  delaySeconds?: number
  /** Custom headers */
  headers?: Record<string, string>
}

/**
 * Batch send options
 */
export interface BatchSendOptions {
  /** Messages to send */
  messages: QueueMessage[]
  /** Fail entire batch if any message fails */
  atomic?: boolean
}

/**
 * Consumer configuration
 */
export interface ConsumerConfig {
  /** Maximum number of messages to process in parallel */
  maxConcurrency?: number
  /** Maximum batch size for batch consumers */
  maxBatchSize?: number
  /** Maximum wait time for batch (seconds) */
  maxWaitTime?: number
  /** Message visibility timeout (seconds) */
  visibilityTimeout?: number
  /** Maximum retry attempts */
  maxRetries?: number
  /** Enable exponential backoff for retries */
  exponentialBackoff?: boolean
  /** Dead letter queue name */
  deadLetterQueue?: string
  /** Handler ensemble to process messages */
  handlerEnsemble?: string
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number
  /** Initial retry delay (seconds) */
  initialDelay?: number
  /** Maximum retry delay (seconds) */
  maxDelay?: number
  /** Exponential backoff multiplier */
  backoffMultiplier?: number
  /** Jitter to add to retry delays (0-1) */
  jitter?: number
  /** Enable exponential backoff (default: true) */
  exponentialBackoff?: boolean
}

/**
 * Dead letter queue configuration
 */
export interface DLQConfig {
  /** DLQ queue name */
  queueName: string
  /** Maximum delivery attempts before sending to DLQ */
  maxDeliveryAttempts: number
}

/**
 * Queue agent configuration
 */
export interface QueueAgentConfig extends AgentConfig {
  /** Queue binding name from wrangler.toml */
  queue: string
  /** Operation mode */
  mode?: QueueMode
  /** Delivery mode */
  deliveryMode?: DeliveryMode
  /** Consumer configuration (for consume mode) */
  consumer?: ConsumerConfig
  /** Retry configuration */
  retry?: RetryConfig
  /** Dead letter queue configuration */
  dlq?: DLQConfig
  /** Content type for messages */
  contentType?: string
}

/**
 * Queue agent input
 */
export interface QueueMemberInput {
  /** Operation mode (overrides config) */
  mode?: QueueMode
  /** Single message (for send mode) */
  message?: QueueMessage
  /** Multiple messages (for send-batch mode) */
  messages?: QueueMessage[]
  /** Batch send options */
  batchOptions?: BatchSendOptions
  /** Consumer handler input (for consume mode) */
  consumerInput?: unknown
}

/**
 * Queue agent output
 */
export interface QueueMemberOutput {
  /** Operation mode that was executed */
  mode: QueueMode
  /** Success status */
  success: boolean
  /** Message ID (send mode) */
  messageId?: string
  /** Message IDs (send-batch mode) */
  messageIds?: string[]
  /** Number of messages sent */
  messageCount?: number
  /** Failed messages (send-batch mode) */
  failedMessages?: FailedMessage[]
  /** Consumer results (consume mode) */
  consumerResults?: ConsumerResult[]
  /** Error message if failed */
  error?: string
}

/**
 * Failed message in batch send
 */
export interface FailedMessage {
  /** Message that failed */
  message: QueueMessage
  /** Error message */
  error: string
}

/**
 * Consumer message result
 */
export interface ConsumerResult {
  /** Message ID */
  messageId: string
  /** Processing success */
  success: boolean
  /** Processing output */
  output?: unknown
  /** Error message if failed */
  error?: string
  /** Retry count */
  retryCount?: number
  /** Sent to DLQ */
  sentToDLQ?: boolean
}

/**
 * Received queue message
 */
export interface ReceivedQueueMessage {
  /** Message ID */
  id: string
  /** Message body */
  body: unknown
  /** Timestamp when message was sent */
  timestamp: number
  /** Number of times message has been received */
  attempts: number
  /** Message metadata */
  metadata?: Record<string, unknown>
}

/**
 * Queue statistics
 */
export interface QueueStats {
  /** Queue name */
  queueName: string
  /** Approximate number of messages */
  approximateMessageCount: number
  /** Approximate number of messages in flight */
  approximateInFlightCount: number
  /** Approximate age of oldest message (seconds) */
  approximateAgeOfOldestMessage?: number
}
