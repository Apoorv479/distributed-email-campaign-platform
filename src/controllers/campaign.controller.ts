
import type { Request, Response } from "express";
import {
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import { prisma } from "../config/database.js";
import { executeCampaign } from "../services/campaign-execution.service.js";
import { getCampaignProgress } from "../services/campaign-progress.service.js";

export async function createCampaign(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const {
      name,
      subject,
      body,
      scheduledAt,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    if (!name || !subject || !body) {
      res.status(400).json({
        message:
          "name, subject and body are required",
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
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
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
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
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
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
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
          id: campaign.id,
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
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
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
          id: campaign.id,
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
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

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

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
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
          id: campaign.id,
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
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id: campaignId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId,
      },
    });

    if (!campaign) {
      res.status(404).json({
        message: "Campaign not found",
      });

      return;
    }

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




export async function getCampaignProgressController(
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const { id: campaignId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!campaign) {
      res.status(404).json({
        message: "Campaign not found",
      });

      return;
    }

    const progress = await getCampaignProgress(
      campaignId,
    );

    res.status(200).json(progress);
  } catch (error) {
    console.error(
      "Get campaign progress error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Campaign not found"
    ) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message: "Failed to get campaign progress",
    });
  }
}