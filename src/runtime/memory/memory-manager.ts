/**
 * Memory Manager - Hierarchical Memory System
 *
 * Orchestrates 5 memory layers:
 * 1. Working - Current execution context (in-memory)
 * 2. Session - Conversation history (KV with TTL)
 * 3. Long-Term - Persistent user data (D1)
 * 4. Semantic - Vector-based retrieval (Vectorize)
 * 5. Analytical - Structured data via Hyperdrive (SQL databases)
 *
 * Provides a unified interface for memory operations across all layers.
 */

import { WorkingMemory } from './working-memory.js'
import { SessionMemory } from './session-memory.js'
import { LongTermMemory } from './long-term-memory.js'
import { SemanticMemory } from './semantic-memory.js'
import { AnalyticalMemory } from './analytical-memory.js'
import type { MemoryConfig, Message, Memory, SearchOptions, MemorySnapshot } from './types.js'
import type { ConductorEnv } from '../../types/env'

export class MemoryManager {
  private workingMemory: WorkingMemory
  private sessionMemory: SessionMemory | null = null
  private longTermMemory: LongTermMemory | null = null
  private semanticMemory: SemanticMemory | null = null
  private analyticalMemory: AnalyticalMemory | null = null

  constructor(
    private readonly env: ConductorEnv,
    private readonly config: MemoryConfig,
    private readonly userId?: string,
    private readonly sessionId?: string
  ) {
    // Always create working memory
    this.workingMemory = new WorkingMemory()

    // Create other layers based on config
    if (config.layers.session && sessionId) {
      this.sessionMemory = new SessionMemory(env, sessionId, config.sessionTTL)
    }

    if (config.layers.longTerm && userId) {
      this.longTermMemory = new LongTermMemory(env, userId)
    }

    if (config.layers.semantic && userId) {
      this.semanticMemory = new SemanticMemory(env, userId)
    }

    if (config.layers.analytical && config.analyticalConfig) {
      this.analyticalMemory = new AnalyticalMemory(env, config.analyticalConfig)
    }
  }

  // ==================== Working Memory ====================

  /**
   * Set a value in working memory
   */
  setWorking(key: string, value: unknown): void {
    this.workingMemory.set(key, value)
  }

  /**
   * Get a value from working memory
   */
  getWorking(key: string): unknown {
    return this.workingMemory.get(key)
  }

  /**
   * Get all working memory
   */
  getWorkingAll(): Record<string, unknown> {
    return this.workingMemory.getAll()
  }

  /**
   * Clear working memory
   */
  clearWorking(): void {
    this.workingMemory.clear()
  }

  // ==================== Session Memory ====================

  /**
   * Add a message to session memory
   */
  async addMessage(message: Message): Promise<void> {
    if (!this.sessionMemory) {
      return
    }
    await this.sessionMemory.add(message)
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<Message[]> {
    if (!this.sessionMemory) {
      return []
    }
    const history = await this.sessionMemory.get()
    return history.messages
  }

  /**
   * Get last N messages
   */
  async getLastMessages(n: number): Promise<Message[]> {
    if (!this.sessionMemory) {
      return []
    }
    return await this.sessionMemory.getLastN(n)
  }

  /**
   * Clear session memory
   */
  async clearSession(): Promise<void> {
    if (!this.sessionMemory) {
      return
    }
    await this.sessionMemory.clear()
  }

  /**
   * Compress session memory
   */
  async compressSession(maxMessages: number): Promise<void> {
    if (!this.sessionMemory) {
      return
    }
    await this.sessionMemory.compress(maxMessages)
  }

  // ==================== Long-Term Memory ====================

  /**
   * Set a value in long-term memory
   */
  async setLongTerm(key: string, value: unknown): Promise<void> {
    if (!this.longTermMemory) {
      return
    }
    await this.longTermMemory.set(key, value)
  }

  /**
   * Get a value from long-term memory
   */
  async getLongTerm(key: string): Promise<unknown> {
    if (!this.longTermMemory) {
      return null
    }
    return await this.longTermMemory.get(key)
  }

  /**
   * Get all long-term memory
   */
  async getLongTermAll(): Promise<Record<string, unknown>> {
    if (!this.longTermMemory) {
      return {}
    }
    return await this.longTermMemory.getAll()
  }

  /**
   * Delete from long-term memory
   */
  async deleteLongTerm(key: string): Promise<void> {
    if (!this.longTermMemory) {
      return
    }
    await this.longTermMemory.delete(key)
  }

  /**
   * Clear long-term memory
   */
  async clearLongTerm(): Promise<void> {
    if (!this.longTermMemory) {
      return
    }
    await this.longTermMemory.clear()
  }

  // ==================== Semantic Memory ====================

  /**
   * Add a memory to semantic storage
   */
  async addSemantic(content: string, metadata?: Record<string, unknown>): Promise<string> {
    if (!this.semanticMemory) {
      return ''
    }
    return await this.semanticMemory.add(content, metadata)
  }

  /**
   * Search semantic memory
   */
  async searchSemantic(query: string, options?: SearchOptions): Promise<Memory[]> {
    if (!this.semanticMemory) {
      return []
    }
    return await this.semanticMemory.search(query, options)
  }

  /**
   * Delete from semantic memory
   */
  async deleteSemantic(id: string): Promise<void> {
    if (!this.semanticMemory) {
      return
    }
    await this.semanticMemory.delete(id)
  }

  /**
   * Clear semantic memory
   */
  async clearSemantic(): Promise<void> {
    if (!this.semanticMemory) {
      return
    }
    await this.semanticMemory.clear()
  }

  // ==================== Unified Operations ====================

  /**
   * Create a complete memory snapshot
   */
  async snapshot(): Promise<MemorySnapshot> {
    const snapshot: MemorySnapshot = {
      working: this.workingMemory.getAll(),
    }

    if (this.sessionMemory) {
      snapshot.session = await this.sessionMemory.get()
    }

    if (this.longTermMemory) {
      snapshot.longTerm = await this.longTermMemory.getAll()
    }

    if (this.semanticMemory) {
      // Note: Can't snapshot all semantic memories efficiently
      // This would require tracking all memory IDs
      snapshot.semantic = []
    }

    return snapshot
  }

  /**
   * Clear all memory layers
   */
  async clearAll(): Promise<void> {
    this.clearWorking()
    await this.clearSession()
    await this.clearLongTerm()
    await this.clearSemantic()
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    working: { size: number }
    session?: { messageCount: number }
    longTerm?: { keyCount: number }
    semantic?: { note: string }
    analytical?: { databases: string[]; databaseCount: number }
  }> {
    const stats: {
      working: { size: number }
      session?: { messageCount: number }
      longTerm?: { keyCount: number }
      semantic?: { note: string }
      analytical?: { databases: string[]; databaseCount: number }
    } = {
      working: { size: this.workingMemory.size() },
    }

    if (this.sessionMemory) {
      stats.session = {
        messageCount: await this.sessionMemory.count(),
      }
    }

    if (this.longTermMemory) {
      stats.longTerm = {
        keyCount: await this.longTermMemory.count(),
      }
    }

    if (this.semanticMemory) {
      stats.semantic = {
        note: 'Semantic memory count not available via Vectorize API',
      }
    }

    if (this.analyticalMemory) {
      stats.analytical = {
        databases: this.analyticalMemory.getDatabases(),
        databaseCount: this.analyticalMemory.getDatabases().length,
      }
    }

    return stats
  }

  /**
   * Check if a memory layer is enabled
   */
  isLayerEnabled(layer: 'working' | 'session' | 'longTerm' | 'semantic' | 'analytical'): boolean {
    switch (layer) {
      case 'working':
        return true // Always enabled
      case 'session':
        return !!this.sessionMemory
      case 'longTerm':
        return !!this.longTermMemory
      case 'semantic':
        return !!this.semanticMemory
      case 'analytical':
        return !!this.analyticalMemory
      default:
        return false
    }
  }

  // ==================== Analytical Memory ====================

  /**
   * Query analytical database
   */
  async queryAnalytical<T = unknown>(
    sql: string,
    params?: unknown[],
    database?: string
  ): Promise<T[]> {
    if (!this.analyticalMemory) {
      return []
    }
    return await this.analyticalMemory.query<T>(sql, params, database)
  }

  /**
   * Query analytical database with named parameters
   */
  async queryAnalyticalNamed<T = unknown>(
    sql: string,
    params: Record<string, unknown>,
    database?: string
  ): Promise<T[]> {
    if (!this.analyticalMemory) {
      return []
    }
    return await this.analyticalMemory.queryNamed<T>(sql, params, database)
  }

  /**
   * Execute write query on analytical database
   */
  async executeAnalytical(sql: string, params?: unknown[], database?: string): Promise<number> {
    if (!this.analyticalMemory) {
      return 0
    }
    return await this.analyticalMemory.execute(sql, params, database)
  }

  /**
   * Execute federated query across multiple databases
   */
  async queryMultiple(
    queries: Array<{ database: string; sql: string; params?: unknown[] }>
  ): Promise<Map<string, unknown[]>> {
    if (!this.analyticalMemory) {
      return new Map()
    }
    return await this.analyticalMemory.queryMultiple(queries)
  }

  /**
   * Get available analytical databases
   */
  getAnalyticalDatabases(): string[] {
    if (!this.analyticalMemory) {
      return []
    }
    return this.analyticalMemory.getDatabases()
  }

  /**
   * Check if analytical database exists
   */
  hasAnalyticalDatabase(alias: string): boolean {
    if (!this.analyticalMemory) {
      return false
    }
    return this.analyticalMemory.hasDatabase(alias)
  }

  /**
   * List tables in analytical database
   */
  async listAnalyticalTables(database?: string): Promise<string[]> {
    if (!this.analyticalMemory) {
      return []
    }
    return await this.analyticalMemory.listTables(database)
  }

  /**
   * Get analytical memory instance (for advanced usage)
   */
  getAnalyticalMemory(): AnalyticalMemory | null {
    return this.analyticalMemory
  }
}
