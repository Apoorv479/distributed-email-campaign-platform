import type { Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env.js";
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
    typeof name === "string"
      ? name
      : undefined,
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

export async function githubCallback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { code } = req.query;

    if (typeof code !== "string" || !code) {
      res.status(400).json({
        message:
          "GitHub authorization code is required",
      });

      return;
    }

    const tokenResponse =
      await axios.post<{
        access_token: string;
      }>(
        "https://github.com/login/oauth/access_token",
        {
          client_id: env.github.clientId,
          client_secret: env.github.clientSecret,
          code,
          redirect_uri: env.github.callbackUrl,
        },
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

    const githubAccessToken =
      tokenResponse.data.access_token;

    if (!githubAccessToken) {
      res.status(401).json({
        message:
          "Failed to obtain GitHub access token",
      });

      return;
    }

    const githubUserResponse =
      await axios.get<{
        id: number;
        login: string;
        name: string | null;
        email: string | null;
      }>(
        "https://api.github.com/user",
        {
          headers: {
            Authorization:
              `Bearer ${githubAccessToken}`,
            Accept:
              "application/vnd.github+json",
          },
        },
      );

    const githubUser =
      githubUserResponse.data;

    let email = githubUser.email;

    if (!email) {
      const emailsResponse =
        await axios.get<
          Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }>
        >(
          "https://api.github.com/user/emails",
          {
            headers: {
              Authorization:
                `Bearer ${githubAccessToken}`,
            Accept:
              "application/vnd.github+json",
          },
        },
      );

      const primaryEmail =
        emailsResponse.data.find(
          (item) =>
            item.primary &&
            item.verified,
        );

      email =
        primaryEmail?.email ?? null;
    }

    if (!email) {
      res.status(400).json({
        message:
          "No verified GitHub email found",
      });

      return;
    }

    const user = await findOrCreateUser(
      email,
      githubUser.name ??
        githubUser.login,
      String(githubUser.id),
    );

    const accessToken =
      createAuthToken({
        id: user.id,
        email: user.email,
      });

    res.status(200).json({
      message:
        "GitHub authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
    });
  } catch (error) {
    console.error(
      "GitHub OAuth callback error:",
      error,
    );

    res.status(500).json({
      message:
        "GitHub authentication failed",
    });
  }
}