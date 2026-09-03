
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";

export async function addRecipient(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id: campaignId } = req.params;

    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({
        message: "email is required",
      });

      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      res.status(404).json({
        message: "Campaign not found",
      });

      return;
    }

    if (campaign.status !== "DRAFT") {
      res.status(409).json({
        message:
          "Recipients can only be added to draft campaigns",
      });

      return;
    }

    const existingRecipient =
      await prisma.recipient.findUnique({
        where: {
          campaignId_email: {
            campaignId,
            email,
          },
        },
      });

    if (existingRecipient) {
      res.status(409).json({
        message:
          "Recipient already exists in this campaign",
      });

      return;
    }

    const recipient = await prisma.recipient.create({
      data: {
        campaignId,
        email,
        name: name ?? null,
      },
    });

    res.status(201).json({
      message: "Recipient added successfully",
      recipient,
    });
  } catch (error) {
    console.error(
      "Add recipient error:",
      error,
    );

    res.status(500).json({
      message: "Failed to add recipient",
    });
  }
}

export async function getCampaignRecipients(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id: campaignId } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      res.status(404).json({
        message: "Campaign not found",
      });

      return;
    }

    const recipients = await prisma.recipient.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      campaignId,
      count: recipients.length,
      recipients,
    });
  } catch (error) {
    console.error(
      "Get campaign recipients error:",
      error,
    );

    res.status(500).json({
      message: "Failed to fetch campaign recipients",
    });
  }
}
