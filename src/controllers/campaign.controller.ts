
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { executeCampaign } from "../services/campaign-execution.service.js";

export async function createCampaign(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      userId,
      name,
      subject,
      body,
      scheduledAt,
    } = req.body;

    if (!userId || !name || !subject || !body) {
      res.status(400).json({
        message:
          "userId, name, subject and body are required",
      });

      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });

      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name,
        subject,
        body,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt)
          : null,
        status: scheduledAt
          ? "SCHEDULED"
          : "DRAFT",
      },
    });

    res.status(201).json({
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error(
      "Create campaign error:",
      error,
    );

    res.status(500).json({
      message: "Failed to create campaign",
    });
  }
}

export async function getCampaigns(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.query.userId;

    if (typeof userId !== "string" || !userId) {
      res.status(400).json({
        message: "userId query parameter is required",
      });

      return;
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      campaigns,
    });
  } catch (error) {
    console.error(
      "Get campaigns error:",
      error,
    );

    res.status(500).json({
      message: "Failed to fetch campaigns",
    });
  }
}

export async function getCampaignById(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
      },
      include: {
        recipients: true,
      },
    });

    if (!campaign) {
      res.status(404).json({
        message: "Campaign not found",
      });

      return;
    }

    res.status(200).json({
      campaign,
    });
  } catch (error) {
    console.error(
      "Get campaign error:",
      error,
    );

    res.status(500).json({
      message: "Failed to fetch campaign",
    });
  }
}

export async function updateCampaign(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
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
          "Only draft campaigns can be updated",
      });

      return;
    }

    const {
      name,
      subject,
      body,
      scheduledAt,
    } = req.body;

    if (
      name === undefined &&
      subject === undefined &&
      body === undefined &&
      scheduledAt === undefined
    ) {
      res.status(400).json({
        message:
          "At least one field is required to update",
      });

      return;
    }

    const updatedCampaign =
      await prisma.campaign.update({
        where: {
          id,
        },
        data: {
          ...(name !== undefined && { name }),
          ...(subject !== undefined && { subject }),
          ...(body !== undefined && { body }),
          ...(scheduledAt !== undefined && {
            scheduledAt: scheduledAt
              ? new Date(scheduledAt)
              : null,
            status: scheduledAt
              ? "SCHEDULED"
              : "DRAFT",
          }),
        },
      });

    res.status(200).json({
      message: "Campaign updated successfully",
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error(
      "Update campaign error:",
      error,
    );

    res.status(500).json({
      message: "Failed to update campaign",
    });
  }
}

export async function cancelCampaign(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
      },
    });

    if (!campaign) {
      res.status(404).json({
        message: "Campaign not found",
      });

      return;
    }

    if (campaign.status === "CANCELLED") {
      res.status(409).json({
        message: "Campaign is already cancelled",
      });

      return;
    }

    if (
      campaign.status === "COMPLETED" ||
      campaign.status === "RUNNING"
    ) {
      res.status(409).json({
        message:
          "Running or completed campaigns cannot be cancelled",
      });

      return;
    }

    const cancelledCampaign =
      await prisma.campaign.update({
        where: {
          id,
        },
        data: {
          status: "CANCELLED",
        },
      });

    res.status(200).json({
      message: "Campaign cancelled successfully",
      campaign: cancelledCampaign,
    });
  } catch (error) {
    console.error(
      "Cancel campaign error:",
      error,
    );

    res.status(500).json({
      message: "Failed to cancel campaign",
    });
  }
}

export async function scheduleCampaign(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;

    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      res.status(400).json({
        message: "scheduledAt is required",
      });

      return;
    }

    const parsedScheduledAt = new Date(scheduledAt);

    if (Number.isNaN(parsedScheduledAt.getTime())) {
      res.status(400).json({
        message: "Invalid scheduledAt date",
      });

      return;
    }

    if (parsedScheduledAt <= new Date()) {
      res.status(400).json({
        message:
          "scheduledAt must be a future date",
      });

      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: {
        id,
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
          "Only draft campaigns can be scheduled",
      });

      return;
    }

    const scheduledCampaign =
      await prisma.campaign.update({
        where: {
          id,
        },
        data: {
          scheduledAt: parsedScheduledAt,
          status: "SCHEDULED",
        },
      });

    res.status(200).json({
      message: "Campaign scheduled successfully",
      campaign: scheduledCampaign,
    });
  } catch (error) {
    console.error(
      "Schedule campaign error:",
      error,
    );

    res.status(500).json({
      message: "Failed to schedule campaign",
    });
  }
}


export async function executeCampaignController(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id: campaignId } = req.params;

    await executeCampaign(campaignId);

    res.status(200).json({
      message: "Campaign execution started",
      campaignId,
    });
  } catch (error) {
    console.error(
      "Execute campaign error:",
      error,
    );

    if (error instanceof Error) {
      if (error.message === "Campaign not found") {
        res.status(404).json({
          message: error.message,
        });
        return;
      }

      res.status(409).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message: "Failed to execute campaign",
    });
  }
}




