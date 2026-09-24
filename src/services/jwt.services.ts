import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(
  payload: JwtPayload,
): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as StringValue,
  });
}

export function verifyAccessToken(
  token: string,
): JwtPayload {
  return jwt.verify(
    token,
    env.jwt.secret,
  ) as JwtPayload;
}