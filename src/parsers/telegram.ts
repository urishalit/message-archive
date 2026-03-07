import { ParsedChat, ParsedMessage } from "./types";

interface TelegramTextEntity {
  type: string;
  text: string;
}

interface TelegramMessage {
  id: number;
  type: string;
  date: string;
  from?: string;
  from_id?: string;
  text: string | (string | TelegramTextEntity)[];
}

interface TelegramExport {
  name?: string;
  type?: string;
  messages: TelegramMessage[];
}

function flattenText(text: string | (string | TelegramTextEntity)[]): string {
  if (typeof text === "string") return text;
  return text
    .map((part) => (typeof part === "string" ? part : part.text))
    .join("");
}

export function parseTelegram(jsonString: string): ParsedChat {
  const data: TelegramExport = JSON.parse(jsonString);
  const messages: ParsedMessage[] = [];
  const participantSet = new Set<string>();

  for (const msg of data.messages) {
    if (msg.type !== "message") continue;

    const sender = msg.from_id || msg.from || "unknown";
    const content = flattenText(msg.text);
    if (!content.trim()) continue;

    const timestamp = new Date(msg.date);
    messages.push({ sender, content, timestamp });
    participantSet.add(sender);
  }

  return {
    platform: "telegram",
    messages,
    participants: Array.from(participantSet),
  };
}
