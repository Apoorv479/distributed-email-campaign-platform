import { prisma } from "../config/database.js";
import { emailQueue } from "../queues/email.queue.js";
import { createEmailJob } from "./email-job.service.js";

export async function executeCampaign(
  campaignId: string,
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    include: {
      recipients: {
        where: {
          status: "PENDING",
        },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (
    campaign.status !== "SCHEDULED" &&
    campaign.status !== "RUNNING"
  ) {
    throw new Error(
      `Campaign cannot be executed from status: ${campaign.status}`,
    );
  }

  await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      status: "RUNNING",
    },
  });

  for (const recipient of campaign.recipients) {
    const emailJob = await createEmailJob(
      campaign.id,
      recipient.id,
    );

    await prisma.recipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        status: "QUEUED",
      },
    });

    await prisma.emailJob.update({
      where: {
        id: emailJob.id,
      },
      data: {
        status: "QUEUED",
        provider: "mock",
      },
    });

    await emailQueue.add(
      "send-email",
      {
        campaignId: campaign.id,
        recipientId: recipient.id,
        userId: campaign.userId,
        email: recipient.email,
        subject: campaign.subject,
        body: campaign.body,
        provider: "mock",
      },
      {
        jobId: emailJob.id,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );
  }

  console.log(
    `Campaign ${campaignId} queued ${campaign.recipients.length} recipients`,
  );
}