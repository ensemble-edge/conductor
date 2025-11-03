/**
 * Session Memory - KV with TTL
 *
 * Stores conversation history and session-specific data.
 * Automatically expires after TTL (default: 1 hour).
 */
import type { ConversationHistory, Message } from './types';
import type { ConductorEnv } from '../../types/env';
export declare class SessionMemory {
    private readonly env;
    private readonly sessionId?;
    private readonly ttl;
    private readonly defaultTTL;
    constructor(env: ConductorEnv, sessionId?: string | undefined, ttl?: number);
    /**
     * Get the KV key for this session
     */
    private getKey;
    /**
     * Get conversation history
     */
    get(): Promise<ConversationHistory>;
    /**
     * Add a message to conversation history
     */
    add(message: Message): Promise<void>;
    /**
     * Add multiple messages
     */
    addMany(messages: Message[]): Promise<void>;
    /**
     * Replace entire conversation history
     */
    replace(history: ConversationHistory): Promise<void>;
    /**
     * Clear conversation history
     */
    clear(): Promise<void>;
    /**
     * Get last N messages
     */
    getLastN(n: number): Promise<Message[]>;
    /**
     * Get messages since timestamp
     */
    getSince(timestamp: number): Promise<Message[]>;
    /**
     * Count messages
     */
    count(): Promise<number>;
    /**
     * Compress history by summarizing older messages
     */
    compress(maxMessages: number): Promise<void>;
    /**
     * Extend TTL (reset expiration)
     */
    extend(): Promise<void>;
}
//# sourceMappingURL=session-memory.d.ts.map