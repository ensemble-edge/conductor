/**
 * Session Memory - KV with TTL
 *
 * Stores conversation history and session-specific data.
 * Automatically expires after TTL (default: 1 hour).
 *
 * Enhanced with:
 * - Per-message TTL filtering (sliding window by age)
 * - Message count limits
 * - Conversation size limits
 * - Model tracking for AI responses
 */
import type { ConversationHistory, Message } from './types.js';
import type { ConductorEnv } from '../../types/env.js';
/** Configuration for session memory behavior */
export interface SessionMemoryConfig {
    /** Time-to-live for the KV key in seconds (default: 3600 = 1 hour) */
    ttl?: number;
    /** Maximum number of messages to keep (default: 50) */
    maxMessages?: number;
    /** Maximum age of individual messages in hours (default: 24) */
    messageMaxAgeHours?: number;
    /** Maximum conversation size in bytes (default: 1MB) */
    maxConversationSize?: number;
}
export declare class SessionMemory {
    private readonly env;
    private readonly sessionId?;
    private readonly defaultTTL;
    private readonly defaultMaxMessages;
    private readonly defaultMessageMaxAgeHours;
    private readonly defaultMaxConversationSize;
    private readonly ttl;
    private readonly maxMessages;
    private readonly messageMaxAgeHours;
    private readonly maxConversationSize;
    constructor(env: ConductorEnv, sessionId?: string | undefined, config?: number | SessionMemoryConfig);
    /**
     * Get the KV key for this session
     */
    private getKey;
    /**
     * Filter messages by age (sliding window memory)
     * Removes messages older than messageMaxAgeHours
     * @private
     */
    private filterByAge;
    /**
     * Enforce message count limit (keeps most recent)
     * @private
     */
    private enforceMaxMessages;
    /**
     * Enforce conversation size limit
     * Progressively removes oldest message pairs until under limit
     * @private
     */
    private enforceMaxSize;
    /**
     * Apply all filters to messages (age, count, size)
     * @private
     */
    private applyFilters;
    /**
     * Get conversation history
     * Automatically filters out old messages and enforces limits
     */
    get(): Promise<ConversationHistory>;
    /**
     * Add a message to conversation history
     * Automatically enforces limits after adding
     */
    add(message: Message): Promise<void>;
    /**
     * Add multiple messages
     * Automatically enforces limits after adding
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
    /**
     * Format messages for AI model consumption
     * Strips metadata, timestamps, model info - returns only role + content
     * Limits to maxContext most recent messages
     *
     * @param maxContext - Maximum messages to include (default: 10 = 5 exchanges)
     */
    formatForAI(maxContext?: number): Promise<Array<{
        role: string;
        content: string;
    }>>;
    /**
     * Get conversation metadata (for debugging/analytics)
     * Returns stats about the conversation without full message content
     */
    getMetadata(): Promise<{
        sessionId: string | undefined;
        messageCount: number;
        modelsUsed: string[];
        firstMessage?: number;
        lastMessage?: number;
        userMessages: number;
        assistantMessages: number;
        totalTokens: {
            input: number;
            output: number;
        };
    } | null>;
}
//# sourceMappingURL=session-memory.d.ts.map