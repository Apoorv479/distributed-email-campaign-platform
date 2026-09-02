import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";

const server = app.listen(env.port, () => {
  console.log(
    `Email Campaign API running on http://localhost:${env.port}`,
  );
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();

    console.log("Server shutdown complete");

    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});