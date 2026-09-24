import { prisma } from "../config/database.js";
import { generateAccessToken } from "./jwt.services.js";

export async function findOrCreateUser(
  email: string,
  name?: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  return prisma.user.create({
    data: {
      email,
      name,
    },
  });
}

export function createAuthToken(
  user: {
    id: string;
    email: string;
  },
): string {
  return generateAccessToken({
    userId: user.id,
    email: user.email,
  });
}