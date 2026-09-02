import { prisma } from "../config/database.js";

export async function createEmailJob(
  campaignId: string,
  recipientId: string,
) {
  return prisma.emailJob.upsert({
    where: {
      campaignId_recipientId: {
        campaignId,
        recipientId,
      },
    },

    update: {},

    create: {
      campaignId,
      recipientId,
    },
  });
}