import { Router } from "express";
import {
  githubCallback,
  login,
} from "../controllers/auth.controller.js";
import { env } from "../config/env.js";

const router = Router();

router.post("/login", login);

router.get("/github", (_req, res) => {
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: "read:user user:email",
  });

  const githubAuthorizationUrl =
    `https://github.com/login/oauth/authorize?${params.toString()}`;

  res.redirect(githubAuthorizationUrl);
});

router.get(
  "/github/callback",
  githubCallback,
);

export default router;