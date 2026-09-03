import dotenv from "dotenv";

dotenv.config();

function getEnvVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnvVariable(
  name: string,
): string | undefined {
  return process.env[name];
}

export const env = {
  nodeEnv: getEnvVariable("NODE_ENV"),
  port: Number(getEnvVariable("PORT")),

  redis: {
    host: getEnvVariable("REDIS_HOST"),
    port: Number(getEnvVariable("REDIS_PORT")),
  },

  database: {
    url: getEnvVariable("DATABASE_URL"),
  },

  smtp: {
    host: getOptionalEnvVariable("SMTP_HOST"),
    port: Number(
      getOptionalEnvVariable("SMTP_PORT") ?? 587,
    ),
    secure:
      getOptionalEnvVariable("SMTP_SECURE") === "true",
    user: getOptionalEnvVariable("SMTP_USER"),
    password: getOptionalEnvVariable("SMTP_PASSWORD"),
    from: getOptionalEnvVariable("SMTP_FROM"),
  },
};