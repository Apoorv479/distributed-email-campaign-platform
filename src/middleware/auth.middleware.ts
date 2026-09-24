import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/jwt.services.js";

export interface AuthenticatedRequest
  extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      message: "Authorization header is required",
    });
    return;
  }

  const [scheme, token] =
    authorization.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    res.status(401).json({
      message:
        "Authorization header must use Bearer token",
    });
    return;
  }

  try {
    const payload =
      verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
}