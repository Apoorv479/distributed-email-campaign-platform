import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import {
  type EmailProvider,
  type SendEmailInput,
  type SendEmailResult,
} from "./email.provider.js";

export class SmtpEmailProvider
  implements EmailProvider
{
  private readonly transporter;

  constructor() {
    if (
      !env.smtp.host ||
      !env.smtp.user ||
      !env.smtp.password ||
      !env.smtp.from
    ) {
      throw new Error(
        "SMTP configuration is incomplete",
      );
    }

    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.password,
      },
    });
  }

  async send(
    input: SendEmailInput,
  ): Promise<SendEmailResult> {
    const info = await this.transporter.sendMail({
      from: env.smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });

    return {
      messageId: info.messageId,
      provider: "smtp",
    };
  }
}