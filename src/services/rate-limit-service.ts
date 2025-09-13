import type { RateLimitConfig, RateLimitResult, RateLimitEntry } from 'src/types/rate-limiting';
import { logger } from 'src/utils/logger';

export class RateLimitService {
  private requests = new Map<string, RateLimitEntry>();
  private configs = new Map<string, RateLimitConfig>();

  constructor() {
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  addConfig(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config);
  }

  isAllowed(endpoint: string, userId: string, customConfig?: RateLimitConfig): RateLimitResult {
    const config = customConfig || this.configs.get(endpoint);

    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: Date.now() + 60000,
      };
    }

    const key = config.keyGenerator ? config.keyGenerator(userId) : `${endpoint}:${userId}`;
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.requests.set(key, newEntry);

      logger.debug('Rate limit: New entry created', {
        endpoint,
        userId,
        key,
        remaining: config.maxRequests - 1,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      logger.warn('Rate limit exceeded', {
        endpoint,
        userId,
        key,
        count: entry.count,
        maxRequests: config.maxRequests,
        retryAfter,
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }

    // Increment counter
    entry.count++;
    this.requests.set(key, entry);

    logger.debug('Rate limit: Request allowed', {
      endpoint,
      userId,
      key,
      count: entry.count,
      remaining: config.maxRequests - entry.count,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Rate limit cleanup', {
        cleanedEntries: cleanedCount,
        remainingEntries: this.requests.size,
      });
    }
  }

  getStats(): { totalEntries: number; configs: string[] } {
    return {
      totalEntries: this.requests.size,
      configs: Array.from(this.configs.keys()),
    };
  }
}

// Create singleton instance
export const rateLimitService = new RateLimitService();

// Configure default rate limits
rateLimitService.addConfig('auth:signin', {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

rateLimitService.addConfig('auth:signup', {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
});

rateLimitService.addConfig('events:create', {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

rateLimitService.addConfig('events:rsvp', {
  maxRequests: 50,
  windowMs: 60 * 60 * 1000, // 1 hour
});

rateLimitService.addConfig('messages:send', {
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
});

rateLimitService.addConfig('games:search', {
  maxRequests: 200,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export default rateLimitService;
