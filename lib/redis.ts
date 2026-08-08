import { Redis } from "@upstash/redis";

// Check if Redis environment variables are available
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRedisConfigured = Boolean(url && token);

let redisInstance: Redis | null = null;

if (isRedisConfigured) {
  try {
    redisInstance = new Redis({
      url: url!,
      token: token!,
    });
  } catch (error) {
    console.warn("⚠️ Failed to initialize Redis client:", error);
    redisInstance = null;
  }
}

export const redis = redisInstance;

/**
 * Safely retrieve a cached value from Redis.
 * Returns `null` if Redis is not configured or if the key does not exist.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.warn(`⚠️ Redis getCache error for key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set a cached value in Redis with an optional TTL (in seconds).
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<boolean> {
  if (!redis) return false;
  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (error) {
    console.warn(`⚠️ Redis setCache error for key "${key}":`, error);
    return false;
  }
}

/**
 * Safely delete a cached key from Redis.
 */
export async function delCache(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn(`⚠️ Redis delCache error for key "${key}":`, error);
    return false;
  }
}
