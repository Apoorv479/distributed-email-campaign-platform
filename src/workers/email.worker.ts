import { Job, Worker } from "bullmq";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
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

  // Mark the email job as processing.
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

  // Simulate a transient email provider failure.
  // The first two attempts will fail.
  // The third attempt will succeed.
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

  // Mark the email job as successfully sent.
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

worker.on("failed", (job, error) => {
  console.error(
    `Job failed: ${job?.id}`,
    error.message,
  );
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

console.log("Email worker started");