import express from "express";
import cors from "cors";
import helmet from "helmet";
import { checkRedisConnection } from "./config/redis.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res) => {
  const redisHealthy = await checkRedisConnection();

  const overallHealthy = redisHealthy;

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? "ok" : "degraded",
    service: "email-campaign-api",

    dependencies: {
      redis: redisHealthy ? "up" : "down",
    },
  });
});

export default app;