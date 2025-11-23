import { R as Result } from "./worker-entry-DMA_3kRC.js";
class MemoryCache {
  constructor(config = {}) {
    this.store = /* @__PURE__ */ new Map();
    this.config = {
      defaultTTL: config.defaultTTL || 3600,
      enabled: config.enabled ?? true,
      keyPrefix: config.keyPrefix || ""
    };
  }
  async get(key) {
    if (!this.config.enabled) {
      return Result.ok(null);
    }
    const cacheKey = this.buildKey(key);
    const cached = this.store.get(cacheKey);
    if (!cached) {
      return Result.ok(null);
    }
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      this.store.delete(cacheKey);
      return Result.ok(null);
    }
    return Result.ok(cached.value);
  }
  async set(key, value, options = {}) {
    if (!this.config.enabled || options.bypass) {
      return Result.ok(void 0);
    }
    const ttl = options.ttl || this.config.defaultTTL;
    const cacheKey = this.buildKey(key);
    this.store.set(cacheKey, {
      value,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl * 1e3,
      tags: options.tags
    });
    return Result.ok(void 0);
  }
  async delete(key) {
    const cacheKey = this.buildKey(key);
    this.store.delete(cacheKey);
    return Result.ok(void 0);
  }
  async has(key) {
    const result = await this.get(key);
    return Result.ok(result.success && result.value !== null);
  }
  async clear() {
    this.store.clear();
    return Result.ok(void 0);
  }
  async invalidateByTag(tag) {
    const keysToDelete = [];
    for (const [key, cached] of this.store.entries()) {
      if (cached.tags && cached.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.store.delete(key);
    }
    return Result.ok(void 0);
  }
  buildKey(key) {
    return `${this.config.keyPrefix}${key}`;
  }
  /**
   * Get cache size (memory only)
   */
  size() {
    return this.store.size;
  }
}
export {
  MemoryCache
};
//# sourceMappingURL=cache-GUugdsHw.js.map
