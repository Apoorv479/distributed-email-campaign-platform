import { Queue } from "bullmq";
import { env } from "../config/env.js";
import type { EmailJobData } from "./email.queue.js";

export interface DeadLetterJobData {
  originalJobId: string;
  failureReason: string;
  failedAt: string;
  data: EmailJobData;
}

export const deadLetterQueue = new Queue<DeadLetterJobData>(
  "email-dlq",
  {
    connection: {
      host: env.redis.host,
      port: env.redis.port,
    },
  },
);