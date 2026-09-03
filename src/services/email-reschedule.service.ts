import type { Job } from "bullmq";
import { emailQueue } from "../queues/email.queue.js";
import type { EmailJobData } from "../queues/email.queue.js";

export async function rescheduleEmailJob(
  job: Job<EmailJobData>,
  delaySeconds: number,
): Promise<void> {
  const delayMilliseconds =
    Math.max(delaySeconds, 1) * 1000;

  await emailQueue.add(
    "send-email",
    job.data,
    {
      delay: delayMilliseconds,
      attempts: job.opts.attempts ?? 3,
      backoff: job.opts.backoff ?? {
        type: "exponential",
        delay: 1000,
      },
    },
  );

  console.log(
    `Job ${job.id} rescheduled after ${delaySeconds}s`,
  );
}