import { Job, Worker } from "bullmq";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { deadLetterQueue } from "../queues/dlq.queue.js";
import type { EmailJobData } from "../queues/email.queue.js";

async function processEmailJob(
  job: Job<EmailJobData>,
): Promise<void> {
  console.log("Processing email job...");

  console.log({
    jobId: job.id,
    campaignId: job.data.campaignId,
    recipientId: job.data.recipientId,
    email: job.data.email,
    subject: job.data.subject,
    attempt: job.attemptsMade + 1,
  });

  const emailJob = await prisma.emailJob.findUnique({
    where: {
      campaignId_recipientId: {
        campaignId: job.data.campaignId,
        recipientId: job.data.recipientId,
      },
    },
  });

  if (emailJob?.status === "SENT") {
    console.log(
      `Email already sent. Skipping duplicate job: ${job.id}`,
    );

    return;
  }

  if (emailJob) {
    await prisma.emailJob.update({
      where: {
        id: emailJob.id,
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
      },
    });
  }

  // Temporary permanent failure simulation for DLQ testing.
  if (job.data.email === "dlq-test@example.com") {
    console.log(
      `Simulating permanent failure. Attempt: ${
        job.attemptsMade + 1
      }`,
    );

    if (emailJob) {
      await prisma.emailJob.update({
        where: {
          id: emailJob.id,
        },
        data: {
          status: "FAILED",
          lastError: "Simulated permanent email provider failure",
        },
      });
    }

    throw new Error(
      "Simulated permanent email provider failure",
    );
  }

  // Temporary transient failure simulation.
  // First two attempts fail; third attempt succeeds.
  if (
    job.data.email === "retry-test@example.com" &&
    job.attemptsMade < 2
  ) {
    console.log(
      `Simulating transient failure. Attempt: ${
        job.attemptsMade + 1
      }`,
    );

    if (emailJob) {
      await prisma.emailJob.update({
        where: {
          id: emailJob.id,
        },
        data: {
          status: "FAILED",
          lastError: "Simulated transient email provider failure",
        },
      });
    }

    throw new Error(
      "Simulated transient email provider failure",
    );
  }

  // Temporary email processing simulation.
  // Real provider integration will come in a later phase.
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  if (emailJob) {
    await prisma.emailJob.update({
      where: {
        id: emailJob.id,
      },
      data: {
        status: "SENT",
        sentAt: new Date(),
        lastError: null,
      },
    });
  }

  console.log(
    `Email processed successfully: ${job.data.email}`,
  );
}

const worker = new Worker<EmailJobData>(
  "email-queue",
  processEmailJob,
  {
    connection: {
      host: env.redis.host,
      port: env.redis.port,
    },
    concurrency: 4,
  },
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", async (job, error) => {
  if (!job) {
    return;
  }

  console.error(
    `Job failed: ${job.id}`,
    error.message,
  );

  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await deadLetterQueue.add("dead-letter-email", {
      originalJobId: job.id ?? "unknown",
      failureReason: error.message,
      failedAt: new Date().toISOString(),
      data: job.data,
    });

    console.error(
      `Job moved to DLQ: ${job.id}`,
    );
  }
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

console.log("Email worker started");