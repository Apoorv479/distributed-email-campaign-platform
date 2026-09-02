import { Router } from "express";
import { emailQueue } from "../queues/email.queue.js";
import { prisma } from "../config/database.js";
import { createEmailJob } from "../services/email-job.service.js";

const router = Router();

router.post("/test/email", async (_req, res) => {
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
      id: "test-campaign",
    },
    update: {},
    create: {
      id: "test-campaign",
      userId: user.id,
      name: "Test Campaign",
      subject: "BullMQ Test Email",
      body: "This is a test email job.",
    },
  });

  const recipient = await prisma.recipient.upsert({
    where: {
      campaignId_email: {
        campaignId: campaign.id,
        email: "retry-test@example.com",
      },
    },
    update: {},
    create: {
      campaignId: campaign.id,
      email: "retry-test@example.com",
      name: "Retry Test Recipient",
    },
  });

  const emailJob = await createEmailJob(
    campaign.id,
    recipient.id,
  );

  const job = await emailQueue.add(
    "send-email",
    {
      campaignId: campaign.id,
      recipientId: recipient.id,
      email: recipient.email,
      subject: campaign.subject,
      body: campaign.body,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  );

  res.status(202).json({
    message: "Email job added to queue",
    jobId: job.id,
    emailJobId: emailJob.id,
    campaignId: campaign.id,
    recipientId: recipient.id,
  });
});

export default router;