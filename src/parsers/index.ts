import { ParsedChat } from "./types";
import { parseWhatsApp } from "./whatsapp";
import { parseTelegram } from "./telegram";

export type { ParsedChat, ParsedMessage } from "./types";

export function detectAndParse(content: string): ParsedChat {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseTelegram(trimmed);
  }
  return parseWhatsApp(trimmed);
}
