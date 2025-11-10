/**
 * Queue Member
 *
 * Cloudflare Queues integration for async message processing with:
 * - Message sending (single and batch)
 * - Message consumption with retry logic
 * - Dead letter queue support
 * - Exponential backoff
 */
import { BaseMember, type MemberExecutionContext } from '../base-member.js';
import type { MemberConfig } from '../../runtime/parser.js';
import type { QueueMemberOutput } from './types/index.js';
export declare class QueueMember extends BaseMember {
    private queueConfig;
    constructor(config: MemberConfig);
    /**
     * Validate member configuration
     */
    private validateConfig;
    /**
     * Execute queue operation
     */
    protected run(context: MemberExecutionContext): Promise<QueueMemberOutput>;
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
//# sourceMappingURL=queue-member.d.ts.map