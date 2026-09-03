import { Router } from "express";
import {
  addRecipient,
  getCampaignRecipients,
} from "../controllers/recipient.controller.js";

const router = Router();

router.post("/:id/recipients", addRecipient);
router.get("/:id/recipients", getCampaignRecipients);

export default router;