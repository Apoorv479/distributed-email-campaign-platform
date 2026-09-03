import type { EmailProvider } from "./email.provider.js";
import { MockEmailProvider } from "./mock-email.provider.js";
import { SmtpEmailProvider } from "./smtp-email.provider.js";

export function createEmailProvider(
  provider: string,
): EmailProvider {
  switch (provider) {
    case "mock":
      return new MockEmailProvider();

    case "smtp":
      return new SmtpEmailProvider();

    default:
      throw new Error(
        `Unsupported email provider: ${provider}`,
      );
  }
}