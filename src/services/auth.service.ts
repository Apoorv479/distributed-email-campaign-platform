import { prisma } from "../config/database.js";
import { generateAccessToken } from "./jwt.services.js";

export async function findOrCreateUser(
  email: string,
  name?: string,
  githubId?: string,
) {
  if (githubId) {
    const githubUser =
      await prisma.user.findUnique({
        where: {
          githubId,
        },
      });

    if (githubUser) {
      return githubUser;
    }
  }

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existingUser) {
    if (
      githubId &&
      existingUser.githubId!== githubId
    ) {
      return prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          githubId,
        },
      });
    }

    return existingUser;
  }

  return prisma.user.create({
    data: {
      email,
      name,
      githubId,
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