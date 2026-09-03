import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";

import { checkRedisConnection } from "./config/redis.js";
import { checkDatabaseConnection } from "./config/database.js";

import testQueueRoutes from "./routes/test.queue.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import recipientRoutes from "./routes/recipient.routes.js";

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
app.use("/api/campaigns", campaignRoutes);
app.use("/api/campaigns", recipientRoutes);

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

// Centralized error handler
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          message:
            "File too large. Maximum allowed size is 5 MB.",
        });
        return;
      }

      res.status(400).json({
        message: error.message,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    next(error);
  },
);

export default app;