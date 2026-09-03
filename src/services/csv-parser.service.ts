import { parse } from "csv-parse/sync";

export interface ParsedRecipient {
  email: string;
  name?: string;
}

export function parseRecipientsCsv(
  buffer: Buffer,
): ParsedRecipient[] {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rows.map((row) => ({
    email: row.email?.trim() ?? "",
    name: row.name?.trim() || undefined,
  }));
}