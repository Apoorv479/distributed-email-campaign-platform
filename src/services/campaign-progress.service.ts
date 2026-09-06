import { prisma } from "../config/database.js";

export interface CampaignProgress {
  campaignId: string;
  campaignStatus: string;
  total: number;
  pending: number;
  queued: number;
  processing: number;
  sent: number;
  failed: number;
}

export async function getCampaignProgress(
  campaignId: string,
): Promise<CampaignProgress> {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const recipientCounts =
    await prisma.recipient.groupBy({
      by: ["status"],
      where: {
        campaignId,
      },
      _count: {
        _all: true,
      },
    });

  const counts = {
    PENDING: 0,
    QUEUED: 0,
    PROCESSING: 0,
    SENT: 0,
    FAILED: 0,
  };

  for (const item of recipientCounts) {
    counts[item.status] = item._count._all;
  }

  return {
    campaignId: campaign.id,
    campaignStatus: campaign.status,
    total:
      counts.PENDING +
      counts.QUEUED +
      counts.PROCESSING +
      counts.SENT +
      counts.FAILED,
    pending: counts.PENDING,
    queued: counts.QUEUED,
    processing: counts.PROCESSING,
    sent: counts.SENT,
    failed: counts.FAILED,
  };
}
export async function updateCampaignCompletion(
  campaignId: string,
): Promise<void> {
  const progress = await getCampaignProgress(
    campaignId,
  );

  if (progress.total === 0) {
    return;
  }

  const completedRecipients =
    progress.sent + progress.failed;

  if (
    completedRecipients === progress.total &&
    (progress.campaignStatus === "RUNNING" ||
      progress.campaignStatus === "SCHEDULED")
  ) {
    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        status: "COMPLETED",
      },
    });

    console.log(
      `Campaign completed: ${campaignId}`,
    );
  }
}