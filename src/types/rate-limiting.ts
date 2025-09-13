export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (userId: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}
