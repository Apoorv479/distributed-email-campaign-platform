import validator from "validator";
import type { ParsedRecipient } from "./csv-parser.service.js";

export interface ValidatedRecipient {
  email: string;
  name?: string;
}

export interface InvalidRecipient {
  row: number;
  email: string;
  reason: string;
}

export interface RecipientValidationResult {
  valid: ValidatedRecipient[];
  invalid: InvalidRecipient[];
  duplicates: InvalidRecipient[];
}

export function validateRecipients(
  recipients: ParsedRecipient[],
): RecipientValidationResult {
  const valid: ValidatedRecipient[] = [];
  const invalid: InvalidRecipient[] = [];
  const duplicates: InvalidRecipient[] = [];

  const seenEmails = new Set<string>();

  recipients.forEach((recipient, index) => {
    const row = index + 2;
    const email = recipient.email.trim().toLowerCase();

    if (!email) {
      invalid.push({
        row,
        email,
        reason: "Email is required",
      });
      return;
    }

    if (!validator.isEmail(email)) {
      invalid.push({
        row,
        email,
        reason: "Invalid email format",
      });
      return;
    }

    if (seenEmails.has(email)) {
      duplicates.push({
        row,
        email,
        reason: "Duplicate email in CSV",
      });
      return;
    }

    seenEmails.add(email);

    valid.push({
      email,
      name: recipient.name?.trim() || undefined,
    });
  });

  return {
    valid,
    invalid,
    duplicates,
  };
}