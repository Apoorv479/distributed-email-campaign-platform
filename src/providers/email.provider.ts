
export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  provider: string;
}

export interface EmailProvider {
  send(
    input: SendEmailInput,
  ): Promise<SendEmailResult>;
}

