/**
 * Rate limiter for external API calls
 * Prevents API rate limit violations and implements token bucket algorithm
 * Enhanced for multi-user scenarios with per-user rate limiting
 */

export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;
  private queue: Array<() => void>;
  private userIsolated: boolean;
  private userTokens: Map<string, { tokens: number; lastRefill: number }>;

  constructor(maxTokens: number = 10, refillRate: number = 1, userIsolated: boolean = false) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
    this.queue = [];
    this.userIsolated = userIsolated;
    this.userTokens = new Map();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(userId?: string): void {
    const now = Date.now();
    
    if (this.userIsolated && userId) {
      const userState = this.userTokens.get(userId);
      if (userState) {
        const elapsed = (now - userState.lastRefill) / 1000;
        const tokensToAdd = elapsed * this.refillRate;
        userState.tokens = Math.min(this.maxTokens, userState.tokens + tokensToAdd);
        userState.lastRefill = now;
      } else {
        this.userTokens.set(userId, { tokens: this.maxTokens, lastRefill: now });
      }
    } else {
      const elapsed = (now - this.lastRefill) / 1000;
      const tokensToAdd = elapsed * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Try to consume a token, returns true if successful
   */
  private tryConsume(userId?: string): boolean {
    this.refill(userId);
    
    if (this.userIsolated && userId) {
      const userState = this.userTokens.get(userId);
      if (userState && userState.tokens >= 1) {
        userState.tokens -= 1;
        return true;
      }
      return false;
    }
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>, userId?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (this.tryConsume(userId)) {
        run();
      } else {
        this.queue.push(run);
        // Schedule queue processing
        this.processQueue(userId);
      }
    });
  }

  /**
   * Process the queue when tokens become available
   */
  private processQueue(userId?: string): void {
    if (this.queue.length === 0) return;

    const delay = 1000 / this.refillRate; // Time to get one token
    setTimeout(() => {
      this.refill(userId);
      
      while (this.queue.length > 0 && this.tryConsume(userId)) {
        const next = this.queue.shift();
        if (next) {
          next();
        }
      }
      
      if (this.queue.length > 0) {
        this.processQueue(userId);
      }
    }, delay);
  }

  /**
   * Get current token count
   */
  getTokenCount(userId?: string): number {
    this.refill(userId);
    
    if (this.userIsolated && userId) {
      const userState = this.userTokens.get(userId);
      return userState?.tokens ?? 0;
    }
    
    return this.tokens;
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear user-specific rate limit state (useful for logout/session cleanup)
   */
  clearUser(userId: string): void {
    if (this.userIsolated) {
      this.userTokens.delete(userId);
    }
  }

  /**
   * Get total number of users with active rate limit state
   */
  getUserCount(): number {
    return this.userTokens.size;
  }
}

/**
 * Sliding window rate limiter
 * Limits operations within a time window
 */
export class SlidingWindowRateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[];

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if a request is allowed
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if we're under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return fn();
    }

    // Calculate wait time until oldest request expires
    const oldestRequest = this.requests[0];
    const waitTime = this.windowMs - (now - oldestRequest);
    
    // Wait until we can make the request
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    this.requests.push(Date.now());
    return fn();
  }

  /**
   * Get current request count in window
   */
  getCurrentCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    return this.requests.length;
  }
}

/**
 * Global rate limiters for different API types
 * Discord API uses per-user rate limiting since each user has their own token
 * Database API uses shared rate limiting since it's a shared resource
 */
export const globalRateLimiters = {
  // Discord API: 50 requests per second (per-user)
  discord: new RateLimiter(50, 50, true), // User-isolated
  
  // Database API: 100 requests per second (shared across users)
  database: new RateLimiter(100, 100, false), // Shared
  
  // External APIs: 10 requests per second (per-user)
  external: new RateLimiter(10, 10, true), // User-isolated
  
  // Sliding window for burst protection
  discordBurst: new SlidingWindowRateLimiter(200, 60000), // 200 requests per minute
  databaseBurst: new SlidingWindowRateLimiter(500, 60000), // 500 requests per minute
};