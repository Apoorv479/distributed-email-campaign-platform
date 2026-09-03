
import {
  type EmailProvider,
  type SendEmailInput,
  type SendEmailResult,
} from "./email.provider.js";

export class MockEmailProvider
  implements EmailProvider
{
  async send(
    input: SendEmailInput,
  ): Promise<SendEmailResult> {
    console.log("Mock email provider sending email...");

    console.log({
      to: input.to,
      subject: input.subject,
      body: input.body,
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    const messageId = `mock-${Date.now()}`;

    console.log(
      `Mock email sent successfully: ${messageId}`,
    );

    return {
      messageId,
      provider: "mock",
    };
  }
}

