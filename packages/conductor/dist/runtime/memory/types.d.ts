/**
 * Memory System - Type Definitions
 *
 * Hierarchical memory with 5 layers:
 * 1. Working - Current execution context (in-memory)
 * 2. Session - Conversation history (KV with TTL)
 * 3. Long-Term - Persistent user data (D1)
 * 4. Semantic - Vector-based retrieval (Vectorize)
 * 5. Analytical - Structured data via Hyperdrive (SQL databases)
 */
import type { AnalyticalMemoryConfig } from './analytical-memory.js';
export interface MemoryConfig {
    enabled: boolean;
    layers: {
        working?: boolean;
        session?: boolean;
        longTerm?: boolean;
        semantic?: boolean;
        analytical?: boolean;
    };
    sessionTTL?: number;
    /** Maximum number of messages to keep in session memory (default: 50) */
    maxMessages?: number;
    /** Maximum age of individual messages in hours (default: 24) */
    messageMaxAgeHours?: number;
    /** Maximum conversation size in bytes (default: 1MB) */
    maxConversationSize?: number;
    semanticModel?: string;
    analyticalConfig?: AnalyticalMemoryConfig;
}
/**
 * Message in conversation history
 *
 * Enhanced from reference implementation with:
 * - Model tracking (which AI model generated this)
 * - Token usage tracking for cost analytics
 */
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    /** Which AI model generated this message (e.g., "openai:gpt-4", "anthropic:claude-3") */
    model?: string;
    /** Token usage for this message (for cost tracking) */
    tokens?: {
        input?: number;
        output?: number;
    };
    metadata?: Record<string, unknown>;
}
export interface ConversationHistory {
    messages: Message[];
    createdAt: number;
    updatedAt: number;
    metadata?: Record<string, unknown>;
}
export interface Memory {
    id: string;
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
    score?: number;
}
export interface SearchOptions {
    topK?: number;
    filter?: Record<string, unknown>;
    minScore?: number;
}
export interface MemorySnapshot {
    working: Record<string, unknown>;
    session?: ConversationHistory;
    longTerm?: Record<string, unknown>;
    semantic?: Memory[];
}
//# sourceMappingURL=types.d.ts.map