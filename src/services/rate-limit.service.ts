import { redis } from "../config/redis.js";

const WINDOW_SIZE_SECONDS = 10;
const MAX_REQUESTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function checkRateLimit(
  key: string,
): Promise<RateLimitResult> {
  const currentCount = await redis.incr(key);

  if (currentCount === 1) {
    await redis.expire(
      key,
      WINDOW_SIZE_SECONDS,
    );
  }

  if (currentCount <= MAX_REQUESTS) {
    return {
      allowed: true,
      remaining: MAX_REQUESTS - currentCount,
      retryAfterSeconds: 0,
    };
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.max(ttl, 0),
  };
}