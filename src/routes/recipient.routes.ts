import { Router } from "express";
import {
  addRecipient,
  getCampaignRecipients,
  previewRecipientsCsv,
  importRecipientsCsv,
} from "../controllers/recipient.controller.js";
import { csvUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/:id/recipients", addRecipient);

router.get(
  "/:id/recipients",
  getCampaignRecipients,
);

router.post(
  "/:id/recipients/upload/preview",
  csvUpload.single("file"),
  previewRecipientsCsv,
);

router.post(
  "/:id/recipients/upload",
  csvUpload.single("file"),
  importRecipientsCsv,
);

export default router;