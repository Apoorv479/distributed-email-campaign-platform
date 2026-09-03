import { redis } from "../config/redis.js";
import {
  providerQuotas,
  type ProviderQuota,
} from "../config/provider-quota.js";
import {
  defaultUserQuota,
  type UserQuota,
} from "../config/user-quota.js";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function getProviderQuota(
  provider: string,
): ProviderQuota {
  const quota = providerQuotas[provider];

  if (!quota) {
    throw new Error(
      `No rate limit configuration found for provider: ${provider}`,
    );
  }

  return quota;
}

export async function checkProviderRateLimit(
  provider: string,
): Promise<RateLimitResult> {
  const quota = getProviderQuota(provider);

  const key = `rate-limit:provider:${provider}`;

  const currentCount = await redis.incr(key);

  if (currentCount === 1) {
    await redis.expire(
      key,
      quota.windowSeconds,
    );
  }

  if (currentCount <= quota.maxRequests) {
    return {
      allowed: true,
      remaining: quota.maxRequests - currentCount,
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

export async function checkUserRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  const quota: UserQuota = defaultUserQuota;

  const key = `rate-limit:user:${userId}`;

  const currentCount = await redis.incr(key);

  if (currentCount === 1) {
    await redis.expire(
      key,
      quota.windowSeconds,
    );
  }

  if (currentCount <= quota.maxRequests) {
    return {
      allowed: true,
      remaining: quota.maxRequests - currentCount,
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