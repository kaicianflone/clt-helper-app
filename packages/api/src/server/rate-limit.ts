import { Redis } from "@upstash/redis";

export interface RedisLike {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
}

export const buildRedis = (): RedisLike => Redis.fromEnv();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

const DAILY_LIMIT = 3;
const TTL_SECONDS = 90_000; // 25 hours, slack for UTC rollover

export const checkRateLimit = async (
  deviceId: string,
  redis: RedisLike
): Promise<RateLimitResult> => {
  if (!deviceId) return { ok: false, remaining: 0 };
  const utcDay = new Date().toISOString().slice(0, 10);
  const key = `clt:submit:${deviceId}:${utcDay}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, TTL_SECONDS);
  return {
    ok: count <= DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - count),
  };
};
