import crypto from "node:crypto";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
});

const STATE_TTL_SECONDS = 10 * 60;

function getStateKey(state: string): string {
  return `oauth:github:state:${state}`;
}

export async function createOAuthState(): Promise<string> {
  const state = crypto.randomBytes(32).toString("hex");

  await redis.set(
    getStateKey(state),
    "1",
    "EX",
    STATE_TTL_SECONDS,
  );

  return state;
}

export async function consumeOAuthState(
  state: string,
): Promise<boolean> {
  const key = getStateKey(state);

  const value = await redis.get(key);

  if (!value) {
    return false;
  }

  await redis.del(key);

  return true;
}