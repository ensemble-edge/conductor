/**
 * Queue Member
 *
 * Cloudflare Queues integration for async message processing with:
 * - Message sending (single and batch)
 * - Message consumption with retry logic
 * - Dead letter queue support
 * - Exponential backoff
 */
import { BaseMember } from '../base-member.js';
export class QueueMember extends BaseMember {
    constructor(config) {
        super(config);
        this.queueConfig = config;
        // Validate configuration
        this.validateConfig();
    }
    /**
     * Validate member configuration
     */
    validateConfig() {
        if (!this.queueConfig.queue) {
            throw new Error('Queue member requires queue binding name');
        }
        if (this.queueConfig.retry) {
            if (this.queueConfig.retry.maxAttempts < 1) {
                throw new Error('Retry maxAttempts must be at least 1');
            }
        }
        if (this.queueConfig.dlq) {
            if (!this.queueConfig.dlq.queueName) {
                throw new Error('DLQ configuration requires queueName');
            }
            if (this.queueConfig.dlq.maxDeliveryAttempts < 1) {
                throw new Error('DLQ maxDeliveryAttempts must be at least 1');
            }
        }
    }
    /**
     * Execute queue operation
     */
    async run(context) {
        const input = context.input;
        const mode = input.mode || this.queueConfig.mode || 'send';
        switch (mode) {
            case 'send':
                return this.sendMessage(input, context);
            case 'send-batch':
                return this.sendBatch(input, context);
            case 'consume':
                return this.consumeMessages(input, context);
            default:
                throw new Error(`Unknown queue mode: ${mode}`);
        }
    }
    /**
     * Send single message
     */
    async sendMessage(input, context) {
        if (!input.message) {
            throw new Error('Send mode requires message in input');
        }
        const queue = this.getQueue(context);
        const message = this.prepareMessage(input.message);
        try {
            // In Cloudflare Queues, we use the send method
            await queue.send(message.body, {
                contentType: this.queueConfig.contentType || 'json',
                delaySeconds: message.delaySeconds
            });
            return {
                mode: 'send',
                success: true,
                messageId: message.id || this.generateMessageId(),
                messageCount: 1
            };
        }
        catch (error) {
            return {
                mode: 'send',
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Send batch of messages
     */
    async sendBatch(input, context) {
        const messages = input.messages || input.batchOptions?.messages;
        if (!messages || messages.length === 0) {
            throw new Error('Send-batch mode requires messages array');
        }
        const queue = this.getQueue(context);
        const atomic = input.batchOptions?.atomic || false;
        const messageIds = [];
        const failedMessages = [];
        for (const msg of messages) {
            try {
                const preparedMsg = this.prepareMessage(msg);
                await queue.send(preparedMsg.body, {
                    contentType: this.queueConfig.contentType || 'json',
                    delaySeconds: preparedMsg.delaySeconds
                });
                const msgId = preparedMsg.id || this.generateMessageId();
                messageIds.push(msgId);
            }
            catch (error) {
                failedMessages.push({
                    message: msg,
                    error: error.message
                });
                // If atomic, stop on first failure
                if (atomic) {
                    break;
                }
            }
        }
        const success = atomic ? failedMessages.length === 0 : messageIds.length > 0;
        return {
            mode: 'send-batch',
            success,
            messageIds,
            messageCount: messageIds.length,
            failedMessages: failedMessages.length > 0 ? failedMessages : undefined,
            error: !success ? 'Some messages failed to send' : undefined
        };
    }
    /**
     * Consume messages (called by Cloudflare Queue consumer)
     */
    async consumeMessages(input, context) {
        // This would be called by the queue consumer handler
        // For testing purposes, we simulate message consumption
        const consumerConfig = this.queueConfig.consumer;
        if (!consumerConfig) {
            throw new Error('Consume mode requires consumer configuration');
        }
        // In production, messages would come from the queue
        // For now, return a placeholder
        const results = [];
        return {
            mode: 'consume',
            success: true,
            consumerResults: results
        };
    }
    /**
     * Process a single message with retry logic
     */
    async processMessage(message, context) {
        const maxRetries = this.queueConfig.retry?.maxAttempts || 3;
        const exponentialBackoff = this.queueConfig.retry?.exponentialBackoff !== false;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Call handler ensemble if configured
                const output = await this.executeHandler(message, context);
                return {
                    messageId: message.id,
                    success: true,
                    output,
                    retryCount: attempt
                };
            }
            catch (error) {
                lastError = error;
                // Calculate backoff delay
                if (attempt < maxRetries && exponentialBackoff) {
                    const delay = this.calculateBackoff(attempt);
                    await this.sleep(delay);
                }
            }
        }
        // All retries exhausted - check if we should send to DLQ
        const shouldSendToDLQ = this.queueConfig.dlq &&
            message.attempts >= this.queueConfig.dlq.maxDeliveryAttempts;
        if (shouldSendToDLQ) {
            await this.sendToDLQ(message, context);
        }
        return {
            messageId: message.id,
            success: false,
            error: lastError?.message || 'Unknown error',
            retryCount: maxRetries,
            sentToDLQ: shouldSendToDLQ
        };
    }
    /**
     * Execute handler ensemble for message
     */
    async executeHandler(message, context) {
        // In production, this would call the configured handler ensemble
        // For now, return the message body
        return message.body;
    }
    /**
     * Send message to dead letter queue
     */
    async sendToDLQ(message, context) {
        if (!this.queueConfig.dlq)
            return;
        const dlqName = this.queueConfig.dlq.queueName;
        const dlqBinding = context.env[dlqName];
        if (dlqBinding && typeof dlqBinding === 'object' && 'send' in dlqBinding) {
            await dlqBinding.send({
                originalMessage: message,
                failedAt: new Date().toISOString(),
                attempts: message.attempts
            });
        }
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(attempt) {
        const initialDelay = this.queueConfig.retry?.initialDelay || 1000; // 1 second
        const maxDelay = this.queueConfig.retry?.maxDelay || 60000; // 60 seconds
        const multiplier = this.queueConfig.retry?.backoffMultiplier || 2;
        const jitter = this.queueConfig.retry?.jitter || 0.1;
        // Calculate base delay
        let delay = initialDelay * Math.pow(multiplier, attempt);
        delay = Math.min(delay, maxDelay);
        // Add jitter
        const jitterAmount = delay * jitter * (Math.random() * 2 - 1);
        delay += jitterAmount;
        return Math.max(0, Math.floor(delay));
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get queue binding from environment
     */
    getQueue(context) {
        const queueName = this.queueConfig.queue;
        const queue = context.env[queueName];
        if (!queue) {
            throw new Error(`Queue binding "${queueName}" not found. Add it to wrangler.toml`);
        }
        return queue;
    }
    /**
     * Prepare message for sending
     */
    prepareMessage(message) {
        return {
            id: message.id || this.generateMessageId(),
            body: message.body,
            metadata: message.metadata,
            delaySeconds: message.delaySeconds,
            headers: message.headers
        };
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
