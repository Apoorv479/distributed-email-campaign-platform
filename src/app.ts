import express from "express";
import cors from "cors";
import helmet from "helmet";
import { checkRedisConnection } from "./config/redis.js";
import { checkDatabaseConnection } from "./config/database.js";
import testQueueRoutes from "./routes/test.queue.routes.js";

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

app.use("/api", testQueueRoutes);

app.get("/health", async (_req, res) => {
  const [redisHealthy, databaseHealthy] = await Promise.all([
    checkRedisConnection(),
    checkDatabaseConnection(),
  ]);

  const overallHealthy = redisHealthy && databaseHealthy;

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? "ok" : "degraded",
    service: "email-campaign-api",
    dependencies: {
      redis: redisHealthy ? "up" : "down",
      database: databaseHealthy ? "up" : "down",
    },
  });
});

export default app;