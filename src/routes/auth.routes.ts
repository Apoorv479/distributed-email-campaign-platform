import { Router } from "express";
import {
  githubCallback,
  login,
} from "../controllers/auth.controller.js";
import { env } from "../config/env.js";
import { createOAuthState } from "../services/oauth-state.service.js";

const router = Router();

router.post("/login", login);
router.get("/github", async (_req, res) => {
  const state = await createOAuthState();

  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: "read:user user:email",
    state,
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