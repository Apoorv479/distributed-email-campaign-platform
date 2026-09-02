import { Router } from "express";
import { emailQueue } from "../queues/email.queue.js";

const router = Router();

router.post("/test/email", async (_req, res) => {
  const job = await emailQueue.add("send-email", {
    campaignId: "test-campaign",
    recipientId: "test-recipient",
    email: "test@example.com",
    subject: "BullMQ Test Email",
    body: "This is a test email job.",
  });

  res.status(202).json({
    message: "Email job added to queue",
    jobId: job.id,
  });
});

export default router;