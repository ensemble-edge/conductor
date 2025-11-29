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
export class SessionMemory {
    constructor(env, sessionId, config) {
        this.env = env;
        this.sessionId = sessionId;
        this.defaultTTL = 3600; // 1 hour in seconds
        this.defaultMaxMessages = 50;
        this.defaultMessageMaxAgeHours = 24;
        this.defaultMaxConversationSize = 1024 * 1024; // 1MB
        // Support legacy signature (ttl as number) and new config object
        if (typeof config === 'number') {
            this.ttl = config;
            this.maxMessages = this.defaultMaxMessages;
            this.messageMaxAgeHours = this.defaultMessageMaxAgeHours;
            this.maxConversationSize = this.defaultMaxConversationSize;
        }
        else {
            this.ttl = config?.ttl ?? this.defaultTTL;
            this.maxMessages = config?.maxMessages ?? this.defaultMaxMessages;
            this.messageMaxAgeHours = config?.messageMaxAgeHours ?? this.defaultMessageMaxAgeHours;
            this.maxConversationSize = config?.maxConversationSize ?? this.defaultMaxConversationSize;
        }
    }
    /**
     * Get the KV key for this session
     */
    getKey() {
        if (!this.sessionId) {
            throw new Error('Session ID is required for session memory');
        }
        return `session:${this.sessionId}`;
    }
    /**
     * Filter messages by age (sliding window memory)
     * Removes messages older than messageMaxAgeHours
     * @private
     */
    filterByAge(messages) {
        if (!Array.isArray(messages) || messages.length === 0) {
            return [];
        }
        const cutoffTime = Date.now() - this.messageMaxAgeHours * 60 * 60 * 1000;
        return messages.filter((msg) => {
            // Keep messages without timestamps (shouldn't happen, but be safe)
            if (!msg.timestamp)
                return true;
            return msg.timestamp > cutoffTime;
        });
    }
    /**
     * Enforce message count limit (keeps most recent)
     * @private
     */
    enforceMaxMessages(messages) {
        if (messages.length <= this.maxMessages) {
            return messages;
        }
        // Keep the most recent messages
        const trimmed = messages.slice(-this.maxMessages);
        // If we cut off in the middle of a user/assistant pair, remove orphaned assistant
        if (trimmed.length > 0 && trimmed[0].role === 'assistant') {
            trimmed.shift();
        }
        return trimmed;
    }
    /**
     * Enforce conversation size limit
     * Progressively removes oldest message pairs until under limit
     * @private
     */
    enforceMaxSize(messages) {
        if (!Array.isArray(messages))
            return [];
        let conversationJson = JSON.stringify(messages);
        // Progressively remove oldest pairs (user + assistant)
        while (conversationJson.length > this.maxConversationSize && messages.length > 2) {
            // Remove oldest pair
            messages.splice(0, 2);
            conversationJson = JSON.stringify(messages);
        }
        return messages;
    }
    /**
     * Apply all filters to messages (age, count, size)
     * @private
     */
    applyFilters(messages) {
        // Order matters: filter by age first, then count, then size
        let filtered = this.filterByAge(messages);
        filtered = this.enforceMaxMessages(filtered);
        filtered = this.enforceMaxSize(filtered);
        return filtered;
    }
    /**
     * Get conversation history
     * Automatically filters out old messages and enforces limits
     */
    async get() {
        if (!this.sessionId) {
            return { messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        }
        const key = this.getKey();
        const data = await this.env.SESSIONS?.get(key);
        if (!data) {
            return { messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        }
        const history = JSON.parse(data);
        // Apply filters on read (sliding window)
        history.messages = this.applyFilters(history.messages);
        return history;
    }
    /**
     * Add a message to conversation history
     * Automatically enforces limits after adding
     */
    async add(message) {
        if (!this.sessionId) {
            return;
        }
        const history = await this.get();
        history.messages.push(message);
        // Apply filters to enforce limits
        history.messages = this.applyFilters(history.messages);
        history.updatedAt = Date.now();
        const key = this.getKey();
        await this.env.SESSIONS?.put(key, JSON.stringify(history), {
            expirationTtl: this.ttl,
        });
    }
    /**
     * Add multiple messages
     * Automatically enforces limits after adding
     */
    async addMany(messages) {
        if (!this.sessionId) {
            return;
        }
        const history = await this.get();
        history.messages.push(...messages);
        // Apply filters to enforce limits
        history.messages = this.applyFilters(history.messages);
        history.updatedAt = Date.now();
        const key = this.getKey();
        await this.env.SESSIONS?.put(key, JSON.stringify(history), {
            expirationTtl: this.ttl,
        });
    }
    /**
     * Replace entire conversation history
     */
    async replace(history) {
        if (!this.sessionId) {
            return;
        }
        history.updatedAt = Date.now();
        const key = this.getKey();
        await this.env.SESSIONS?.put(key, JSON.stringify(history), {
            expirationTtl: this.ttl,
        });
    }
    /**
     * Clear conversation history
     */
    async clear() {
        if (!this.sessionId) {
            return;
        }
        const key = this.getKey();
        await this.env.SESSIONS?.delete(key);
    }
    /**
     * Get last N messages
     */
    async getLastN(n) {
        const history = await this.get();
        return history.messages.slice(-n);
    }
    /**
     * Get messages since timestamp
     */
    async getSince(timestamp) {
        const history = await this.get();
        return history.messages.filter((m) => m.timestamp >= timestamp);
    }
    /**
     * Count messages
     */
    async count() {
        const history = await this.get();
        return history.messages.length;
    }
    /**
     * Compress history by summarizing older messages
     */
    async compress(maxMessages) {
        if (!this.sessionId) {
            return;
        }
        const history = await this.get();
        if (history.messages.length <= maxMessages) {
            return;
        }
        // Keep recent messages, create summary of older ones
        const recentMessages = history.messages.slice(-maxMessages);
        const olderMessages = history.messages.slice(0, -maxMessages);
        // Create summary message
        const summaryText = `[Previous conversation summary: ${olderMessages.length} messages]`;
        const summaryMessage = {
            role: 'system',
            content: summaryText,
            timestamp: olderMessages[olderMessages.length - 1]?.timestamp || Date.now(),
            metadata: { type: 'summary', messageCount: olderMessages.length },
        };
        history.messages = [summaryMessage, ...recentMessages];
        history.updatedAt = Date.now();
        const key = this.getKey();
        await this.env.SESSIONS?.put(key, JSON.stringify(history), {
            expirationTtl: this.ttl,
        });
    }
    /**
     * Extend TTL (reset expiration)
     */
    async extend() {
        if (!this.sessionId) {
            return;
        }
        const history = await this.get();
        const key = this.getKey();
        await this.env.SESSIONS?.put(key, JSON.stringify(history), {
            expirationTtl: this.ttl,
        });
    }
    /**
     * Format messages for AI model consumption
     * Strips metadata, timestamps, model info - returns only role + content
     * Limits to maxContext most recent messages
     *
     * @param maxContext - Maximum messages to include (default: 10 = 5 exchanges)
     */
    async formatForAI(maxContext = 10) {
        const history = await this.get();
        if (history.messages.length === 0) {
            return [];
        }
        // Take only the most recent messages
        const recentMessages = history.messages.length > maxContext
            ? history.messages.slice(-maxContext)
            : history.messages;
        return recentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
    }
    /**
     * Get conversation metadata (for debugging/analytics)
     * Returns stats about the conversation without full message content
     */
    async getMetadata() {
        const history = await this.get();
        if (history.messages.length === 0) {
            return null;
        }
        const modelsUsed = [...new Set(history.messages.map((m) => m.model).filter(Boolean))];
        // Sum up token usage
        const totalTokens = history.messages.reduce((acc, msg) => ({
            input: acc.input + (msg.tokens?.input ?? 0),
            output: acc.output + (msg.tokens?.output ?? 0),
        }), { input: 0, output: 0 });
        return {
            sessionId: this.sessionId,
            messageCount: history.messages.length,
            modelsUsed,
            firstMessage: history.messages[0]?.timestamp,
            lastMessage: history.messages[history.messages.length - 1]?.timestamp,
            userMessages: history.messages.filter((m) => m.role === 'user').length,
            assistantMessages: history.messages.filter((m) => m.role === 'assistant').length,
            totalTokens,
        };
    }
}
