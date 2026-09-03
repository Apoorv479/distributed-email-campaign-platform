import { Router } from "express";
import { emailQueue } from "../queues/email.queue.js";
import { prisma } from "../config/database.js";
import { createEmailJob } from "../services/email-job.service.js";

const router = Router();

router.post("/test/email", async (req, res) => {
  const campaignId = "test-campaign";

  const recipientEmail =
    req.body.email ?? "scheduled-test@example.com";

  const provider =
    req.body.provider ?? "smtp";

  const scheduledAt = req.body.scheduledAt
    ? new Date(req.body.scheduledAt)
    : null;

  const user = await prisma.user.upsert({
    where: {
      email: "test-user@example.com",
    },
    update: {},
    create: {
      email: "test-user@example.com",
      name: "Test User",
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: {
      id: campaignId,
    },
    update: {
      scheduledAt,
    },
    create: {
      id: campaignId,
      userId: user.id,
      name: "Test Campaign",
      subject: "BullMQ Test Email",
      body: "This is a test email job.",
      scheduledAt,
    },
  });

  const recipient = await prisma.recipient.upsert({
    where: {
      campaignId_email: {
        campaignId: campaign.id,
        email: recipientEmail,
      },
    },
    update: {},
    create: {
      campaignId: campaign.id,
      email: recipientEmail,
      name: "Test Recipient",
    },
  });

  const emailJob = await createEmailJob(
    campaign.id,
    recipient.id,
  );

  const delay = scheduledAt
    ? Math.max(
        scheduledAt.getTime() - Date.now(),
        0,
      )
    : 0;

  const job = await emailQueue.add(
  "send-email",
  {
    campaignId: campaign.id,
    recipientId: recipient.id,
    userId: user.id,
    email: recipient.email,
    subject: campaign.subject,
    body: campaign.body,
    provider,
  },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      delay,
    },
  );

  res.status(202).json({
    message: scheduledAt
      ? "Email job scheduled"
      : "Email job added to queue",
    jobId: job.id,
    emailJobId: emailJob.id,
    campaignId: campaign.id,
    recipientId: recipient.id,
    provider,
    scheduledAt,
    delay,
  });
});

export default router;