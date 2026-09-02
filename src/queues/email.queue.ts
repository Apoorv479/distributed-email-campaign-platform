import { Queue } from "bullmq";
import { env } from "../config/env.js";

export interface EmailJobData {
  campaignId: string;
  recipientId: string;
  email: string;
  subject: string;
  body: string;
}

export const emailQueue = new Queue<EmailJobData>("email-queue", {
  connection: {
    host: env.redis.host,
    port: env.redis.port,
  },
});