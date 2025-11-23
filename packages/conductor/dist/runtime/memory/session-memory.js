/**
 * Session Memory - KV with TTL
 *
 * Stores conversation history and session-specific data.
 * Automatically expires after TTL (default: 1 hour).
 */
export class SessionMemory {
    constructor(env, sessionId, ttl = 3600) {
        this.env = env;
        this.sessionId = sessionId;
        this.ttl = ttl;
        this.defaultTTL = 3600; // 1 hour in seconds
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
     * Get conversation history
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
        return JSON.parse(data);
    }
    /**
     * Add a message to conversation history
     */
    async add(message) {
        if (!this.sessionId) {
            return;
        }
        const history = await this.get();
        history.messages.push(message);
        history.updatedAt = Date.now();
        const key = this.getKey();
        await this.env.SESSIONS?.put(key, JSON.stringify(history), {
            expirationTtl: this.ttl,
        });
    }
    /**
     * Add multiple messages
     */
    async addMany(messages) {
        if (!this.sessionId) {
            return;
        }
        const history = await this.get();
        history.messages.push(...messages);
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
}
