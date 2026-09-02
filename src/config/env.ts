import dotenv from "dotenv";

dotenv.config();

function getEnvVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: getEnvVariable("NODE_ENV"),
  port: Number(getEnvVariable("PORT")),
  redis: {
    host: getEnvVariable("REDIS_HOST"),
    port: Number(getEnvVariable("REDIS_PORT")),
  },
};