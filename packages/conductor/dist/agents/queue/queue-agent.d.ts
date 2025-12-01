/**
 * Queue Agent
 *
 * Cloudflare Queues integration for async message processing with:
 * - Message sending (single and batch)
 * - Message consumption with retry logic
 * - Dead letter queue support
 * - Exponential backoff
 */
import { BaseAgent, type AgentExecutionContext } from '../base-agent.js';
import type { AgentConfig } from '../../runtime/parser.js';
import type { QueueAgentInput, QueueAgentOutput } from './types/index.js';
export declare class QueueAgent extends BaseAgent {
    private queueConfig;
    constructor(config: AgentConfig);
    /**
     * Validate agent configuration
     */
    private validateConfig;
    /**
     * Execute queue operation
     */
    protected run(context: AgentExecutionContext): Promise<QueueAgentOutput>;
    /**
     * Send single message
     */
    private sendMessage;
    /**
     * Send batch of messages
     */
    private sendBatch;
    /**
     * Consume messages (called by Cloudflare Queue consumer)
     */
    private consumeMessages;
    /**
     * Process a single message with retry logic
     */
    private processMessage;
    /**
     * Execute handler ensemble for message
     */
    private executeHandler;
    /**
     * Send message to dead letter queue
     */
    private sendToDLQ;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoff;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Get queue binding from environment
     */
    private getQueue;
    /**
     * Prepare message for sending
     */
    private prepareMessage;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
}
export declare const QueueMember: typeof QueueAgent;
export type QueueMemberInput = QueueAgentInput;
export type QueueMemberOutput = QueueAgentOutput;
//# sourceMappingURL=queue-agent.d.ts.map