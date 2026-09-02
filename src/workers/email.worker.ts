import { Job, Worker } from "bullmq";
import { env } from "../config/env.js";
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
  });

  // Temporary email processing simulation.
  // Real provider integration will come in a later phase.
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });

  console.log(`Email processed successfully: ${job.data.email}`);
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