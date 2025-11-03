/**
 * Session Memory - KV with TTL
 *
 * Stores conversation history and session-specific data.
 * Automatically expires after TTL (default: 1 hour).
 */

import type { ConversationHistory, Message } from './types';
import type { ConductorEnv } from '../../types/env';

export class SessionMemory {
	private readonly defaultTTL = 3600; // 1 hour in seconds

	constructor(
		private readonly env: ConductorEnv,
		private readonly sessionId?: string,
		private readonly ttl: number = 3600
	) {}

	/**
	 * Get the KV key for this session
	 */
	private getKey(): string {
		if (!this.sessionId) {
			throw new Error('Session ID is required for session memory');
		}
		return `session:${this.sessionId}`;
	}

	/**
	 * Get conversation history
	 */
	async get(): Promise<ConversationHistory> {
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
	async add(message: Message): Promise<void> {
		if (!this.sessionId) {
			return;
		}

		const history = await this.get();
		history.messages.push(message);
		history.updatedAt = Date.now();

		const key = this.getKey();
		await this.env.SESSIONS?.put(key, JSON.stringify(history), {
			expirationTtl: this.ttl
		});
	}

	/**
	 * Add multiple messages
	 */
	async addMany(messages: Message[]): Promise<void> {
		if (!this.sessionId) {
			return;
		}

		const history = await this.get();
		history.messages.push(...messages);
		history.updatedAt = Date.now();

		const key = this.getKey();
		await this.env.SESSIONS?.put(key, JSON.stringify(history), {
			expirationTtl: this.ttl
		});
	}

	/**
	 * Replace entire conversation history
	 */
	async replace(history: ConversationHistory): Promise<void> {
		if (!this.sessionId) {
			return;
		}

		history.updatedAt = Date.now();

		const key = this.getKey();
		await this.env.SESSIONS?.put(key, JSON.stringify(history), {
			expirationTtl: this.ttl
		});
	}

	/**
	 * Clear conversation history
	 */
	async clear(): Promise<void> {
		if (!this.sessionId) {
			return;
		}

		const key = this.getKey();
		await this.env.SESSIONS?.delete(key);
	}

	/**
	 * Get last N messages
	 */
	async getLastN(n: number): Promise<Message[]> {
		const history = await this.get();
		return history.messages.slice(-n);
	}

	/**
	 * Get messages since timestamp
	 */
	async getSince(timestamp: number): Promise<Message[]> {
		const history = await this.get();
		return history.messages.filter((m) => m.timestamp >= timestamp);
	}

	/**
	 * Count messages
	 */
	async count(): Promise<number> {
		const history = await this.get();
		return history.messages.length;
	}

	/**
	 * Compress history by summarizing older messages
	 */
	async compress(maxMessages: number): Promise<void> {
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
		const summaryMessage: Message = {
			role: 'system',
			content: summaryText,
			timestamp: olderMessages[olderMessages.length - 1]?.timestamp || Date.now(),
			metadata: { type: 'summary', messageCount: olderMessages.length }
		};

		history.messages = [summaryMessage, ...recentMessages];
		history.updatedAt = Date.now();

		const key = this.getKey();
		await this.env.SESSIONS?.put(key, JSON.stringify(history), {
			expirationTtl: this.ttl
		});
	}

	/**
	 * Extend TTL (reset expiration)
	 */
	async extend(): Promise<void> {
		if (!this.sessionId) {
			return;
		}

		const history = await this.get();
		const key = this.getKey();
		await this.env.SESSIONS?.put(key, JSON.stringify(history), {
			expirationTtl: this.ttl
		});
	}
}
