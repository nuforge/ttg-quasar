import { logger } from 'src/utils/logger';

export interface CacheEntry<T = unknown> {
  data: T;
  expiry: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  defaultTtl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalAccesses: number;
  oldestEntry: number;
  newestEntry: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalAccesses: 0,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanup();
  }

  // Set a value in the cache
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiry = now + (ttl || this.config.defaultTtl);

    const entry: CacheEntry<T> = {
      data,
      expiry,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.cache.set(key, entry);

    // Remove oldest entries if cache is full
    if (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }

    logger.debug('Cache entry set', {
      key,
      ttl: ttl || this.config.defaultTtl,
      size: this.cache.size,
    });
  }

  // Get a value from the cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    this.stats.totalAccesses++;

    if (!entry) {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
      return null;
    }

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug('Cache entry expired', { key, expiry: entry.expiry, now });
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    logger.debug('Cache hit', { key, accessCount: entry.accessCount });
    return entry.data as T;
  }

  // Check if a key exists in the cache
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete a specific key from the cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache entry deleted', { key });
    }
    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { previousSize: size });
  }

  // Get cache statistics
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    const validEntries = entries.filter((entry) => now <= entry.expiry);
    const timestamps = validEntries.map((entry) => entry.createdAt);

    return {
      size: validEntries.length,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.totalAccesses > 0 ? this.stats.hits / this.stats.totalAccesses : 0,
      totalAccesses: this.stats.totalAccesses,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  // Get all cache keys
  keys(): string[] {
    const now = Date.now();
    return Array.from(this.cache.entries())
      .filter(([, entry]) => now <= entry.expiry)
      .map(([key]) => key);
  }

  // Get cache size
  size(): number {
    const now = Date.now();
    return Array.from(this.cache.values()).filter((entry) => now <= entry.expiry).length;
  }

  // Private methods
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', {
        cleanedEntries: cleanedCount,
        remainingEntries: this.cache.size,
      });
    }
  }

  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    if (entries.length === 0) return;

    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove the oldest entry
    const [oldestKey] = entries[0] as [string, CacheEntry<unknown>];
    this.cache.delete(oldestKey);

    logger.debug('Cache eviction', { evictedKey: oldestKey, remainingSize: this.cache.size });
  }

  // Destroy the cache service
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Create default cache instances
export const defaultCache = new CacheService({
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 minute
});

export const longTermCache = new CacheService({
  defaultTtl: 60 * 60 * 1000, // 1 hour
  maxSize: 500,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
});

export const shortTermCache = new CacheService({
  defaultTtl: 30 * 1000, // 30 seconds
  maxSize: 200,
  cleanupInterval: 30 * 1000, // 30 seconds
});

// Cache decorator for functions
export function cached<T extends (...args: unknown[]) => unknown>(
  cache: CacheService,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number,
) {
  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator(...args);
    const cached = cache.get<ReturnType<T>>(key);

    if (cached !== null) {
      return cached;
    }

    const result = (this as { __originalMethod?: T }).__originalMethod
      ? (this as { __originalMethod: T }).__originalMethod.apply(this, args)
      : (this as T).apply(this, args);

    cache.set(key, result, ttl);
    return result as ReturnType<T>;
  };
}

// Cache utility functions
export const cacheUtils = {
  // Generate cache key from object
  generateKey: (prefix: string, data: Record<string, unknown>): string => {
    const sortedKeys = Object.keys(data).sort();
    const keyData = sortedKeys.map((key) => `${key}:${String(data[key])}`).join('|');
    return `${prefix}:${keyData}`;
  },

  // Generate cache key from array
  generateArrayKey: (prefix: string, items: unknown[]): string => {
    return `${prefix}:${items.join('|')}`;
  },

  // Generate cache key from function arguments
  generateArgsKey: (prefix: string, args: unknown[]): string => {
    return `${prefix}:${args.map((arg) => JSON.stringify(arg)).join('|')}`;
  },
};

export default defaultCache;
