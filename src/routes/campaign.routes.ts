import { Router } from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  cancelCampaign,
  scheduleCampaign,
  executeCampaignController,
  getCampaignProgressController,
} from "../controllers/campaign.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = Router();

router.use(authenticate);

router.post("/", createCampaign);

router.get("/", getCampaigns);

router.get("/:id", getCampaignById);

router.patch("/:id", updateCampaign);

router.delete("/:id", cancelCampaign);

router.post("/:id/schedule", scheduleCampaign);

router.post(
  "/:id/execute",
  executeCampaignController,
);

router.get(
  "/:id/progress",
  getCampaignProgressController,
);

export default router;