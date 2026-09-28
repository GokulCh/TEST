/**
 * Rate limiting utilities for API endpoints
 * Uses in-memory storage (should be replaced with Redis in production)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limits (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the rate limit (IP address, user ID, etc.)
 * @param options - Rate limit configuration
 * @returns Object with { success: boolean, limit: number, remaining: number, reset: number }
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const { windowMs, maxRequests } = options;
  
  // Get or create entry
  let entry = rateLimitStore.get(identifier);
  
  // Reset if window has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }
  
  // Check if limit exceeded
  const success = entry.count < maxRequests;
  
  if (success) {
    entry.count++;
  }
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupExpiredEntries(now);
  }
  
  return {
    success,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string {
  // Try various headers for the real IP
  const headers = req.headers;
  
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a default (this shouldn't happen in production)
  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 * @param req - Next.js request object
 * @param options - Rate limit configuration
 * @throws Error with rate limit information if limit exceeded
 */
export async function applyRateLimit(
  req: Request,
  options: RateLimitOptions
): Promise<void> {
  const ip = getClientIp(req);
  const result = checkRateLimit(ip, options);
  
  if (!result.success) {
    const error = new Error('Rate limit exceeded') as Error & {
      status: number;
      limit: number;
      remaining: number;
      reset: number;
    };
    error.status = 429;
    error.limit = result.limit;
    error.remaining = result.remaining;
    error.reset = result.reset;
    throw error;
  }
}

/**
 * Pre-configured rate limit options for different endpoint types
 */
export const RateLimitPresets = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
  
  // Moderate rate limiting for general API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  
  // Lenient rate limiting for public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },
  
  // Strict rate limiting for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
} as const;
