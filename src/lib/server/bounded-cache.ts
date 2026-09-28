/**
 * Bounded in-memory cache with LRU eviction and TTL support
 * Prevents memory leaks and unbounded growth
 * Enhanced for multi-user scenarios with user isolation
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  userId?: string; // For user-specific cache entries
}

export class BoundedCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null;
  private userIsolated: boolean; // Whether cache keys should include user ID
  private loading = new Map<string, Promise<T>>(); // loads in flight, see remember()

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000, userIsolated: boolean = false) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;
    this.userIsolated = userIsolated;
    
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // Cleanup every minute
    this.cleanupInterval.unref?.(); // never keep the process (or a dev reload) alive for it
  }

  /**
   * Generate a cache key with optional user isolation
   */
  private generateKey(key: string, userId?: string): string {
    if (this.userIsolated && userId) {
      return `${userId}:${key}`;
    }
    return key;
  }

  /**
   * Get a value from the cache
   * Returns null if the key doesn't exist or the entry has expired
   */
  get(key: string, userId?: string): T | null {
    const cacheKey = this.generateKey(key, userId);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // For user-isolated caches, verify the entry belongs to the requesting user
    if (this.userIsolated && entry.userId && entry.userId !== userId) {
      return null; // User isolation violation
    }

    // Move to end to mark as recently used (LRU)
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, entry);
    
    return entry.value;
  }

  /**
   * Set a value in the cache
   * If the cache is full, removes the least recently used entry
   */
  set(key: string, value: T, ttl?: number, userId?: string): void {
    const cacheKey = this.generateKey(key, userId);
    
    // Remove existing entry if it exists
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
    }

    // Evict LRU entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
      userId: this.userIsolated ? userId : undefined,
    });
  }

  /**
   * The cached value for `key`, or what `load()` returns, stored under it.
   * Callers that ask while a load is running share it, so a burst of requests
   * costs one load. A failed load is not cached and rejects for every waiter.
   */
  remember(key: string, load: () => Promise<T>, ttl?: number): Promise<T> {
    const hit = this.get(key);
    if (hit !== null) return Promise.resolve(hit);
    let pending = this.loading.get(key);
    if (!pending) {
      pending = load()
        .then((value) => {
          this.set(key, value, ttl);
          return value;
        })
        .finally(() => this.loading.delete(key));
      this.loading.set(key, pending);
    }
    return pending;
  }

  /**
   * Check if a key exists in the cache and hasn't expired
   */
  has(key: string, userId?: string): boolean {
    return this.get(key, userId) !== null;
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string, userId?: string): boolean {
    const cacheKey = this.generateKey(key, userId);
    return this.cache.delete(cacheKey);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries from the cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clean up the cache and stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }

  /**
   * Clear all entries for a specific user (useful for logout/session cleanup)
   */
  clearUser(userId: string): void {
    if (!this.userIsolated) return;
    
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get the size for a specific user
   */
  sizeForUser(userId: string): number {
    if (!this.userIsolated) return this.cache.size;
    
    let count = 0;
    for (const entry of this.cache.values()) {
      if (entry.userId === userId) {
        count++;
      }
    }
    return count;
  }
}

// User-isolated cache for guild permissions (each user has their own permission cache)
export const guildPermissionCache = new BoundedCache<{ manageableGuilds: string[] }>(500, 5 * 60 * 1000, true);