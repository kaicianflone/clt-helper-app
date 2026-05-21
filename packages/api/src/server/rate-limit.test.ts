import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkRateLimit, type RedisLike } from "./rate-limit";

const makeRedis = (incrResult: number): RedisLike => ({
  incr: vi.fn().mockResolvedValue(incrResult),
  expire: vi.fn().mockResolvedValue(1),
});

describe("checkRateLimit", () => {
  it("returns ok when count is at-or-below limit", async () => {
    const r = await checkRateLimit("dev-1", makeRedis(1));
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
  });
  it("returns ok at the limit (3)", async () => {
    const r = await checkRateLimit("dev-1", makeRedis(3));
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(0);
  });
  it("returns over-limit at 4", async () => {
    const r = await checkRateLimit("dev-1", makeRedis(4));
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
  });
  it("rejects empty deviceId without calling redis", async () => {
    const redis = makeRedis(0);
    const r = await checkRateLimit("", redis);
    expect(r.ok).toBe(false);
    expect(redis.incr).not.toHaveBeenCalled();
  });
  it("sets expire on first hit (incr=1) only", async () => {
    const redis = makeRedis(1);
    await checkRateLimit("dev-1", redis);
    expect(redis.expire).toHaveBeenCalledOnce();
  });
  it("does not set expire on subsequent hits (incr>1)", async () => {
    const redis = makeRedis(2);
    await checkRateLimit("dev-1", redis);
    expect(redis.expire).not.toHaveBeenCalled();
  });
});
