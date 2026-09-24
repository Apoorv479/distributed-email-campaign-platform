import { Router } from "express";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/test/auth",
  authenticate,
  (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      message: "Authentication successful",
      user: req.user,
    });
  },
);

export default router;