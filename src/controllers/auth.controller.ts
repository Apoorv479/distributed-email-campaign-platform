import type { Request, Response } from "express";
import {
  createAuthToken,
  findOrCreateUser,
} from "../services/auth.service.js";

export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  const { email, name } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({
      message: "Email is required",
    });
    return;
  }

  const user = await findOrCreateUser(
    email,
    typeof name === "string" ? name : undefined,
  );

  const accessToken = createAuthToken({
    id: user.id,
    email: user.email,
  });

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken,
  });
}