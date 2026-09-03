import { Router } from "express";
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  cancelCampaign,
  scheduleCampaign,
  executeCampaignController,
} from "../controllers/campaign.controller.js";
const router = Router();

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
export default router;