import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const adapter = new PrismaPg({
  connectionString: env.database.url,
});

export const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return true;
  } catch (error) {
    console.error("Database health check failed:", error);

    return false;
  }
}