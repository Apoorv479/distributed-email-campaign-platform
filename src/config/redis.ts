import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,

  maxRetriesPerRequest: null,

  retryStrategy: (times: number) => {
    const delay = Math.min(times * 100, 3000);

    console.log(
      `Redis reconnect attempt ${times}. Retrying in ${delay}ms...`,
    );

    return delay;
  },
});

redis.on("connect", () => {
  console.log("Redis connection established");
});

redis.on("ready", () => {
  console.log("Redis connection ready");
});

redis.on("error", (error: Error) => {
  console.error("Redis connection error:", error.message);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();

    return result === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);

    return false;
  }
}