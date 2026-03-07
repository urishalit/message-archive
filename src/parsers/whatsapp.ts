import { ParsedChat, ParsedMessage } from "./types";

// Matches common WhatsApp export timestamp formats:
// DD/MM/YYYY, HH:MM - Sender: Message
// MM/DD/YY, HH:MM AM/PM - Sender: Message
// [DD/MM/YYYY, HH:MM:SS] Sender: Message
const TIMESTAMP_PATTERNS = [
  // With brackets: [DD/MM/YYYY, HH:MM:SS]
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*/,
  // Without brackets: DD/MM/YYYY, HH:MM -
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*/,
];

const SYSTEM_MESSAGE_INDICATORS = [
  "Messages and calls are end-to-end encrypted",
  "created group",
  "added you",
  "changed the subject",
  "changed this group",
  "changed the group",
  "left",
  "removed",
  "joined using",
  "security code changed",
  "disappeared",
  "message timer",
];

function parseTimestamp(dateStr: string, timeStr: string): Date | null {
  const parts = dateStr.split("/").map(Number);
  if (parts.length !== 3) return null;

  let [a, b, year] = parts;
  if (year < 100) year += 2000;

  // Heuristic: if first number > 12, it's DD/MM/YYYY
  // Otherwise, try MM/DD/YYYY
  let month: number, day: number;
  if (a > 12) {
    day = a;
    month = b;
  } else if (b > 12) {
    month = a;
    day = b;
  } else {
    // Ambiguous — default to DD/MM (more common globally)
    day = a;
    month = b;
  }

  let time = timeStr.trim();
  let hours = 0,
    minutes = 0,
    seconds = 0;
  const isPM = /[Pp][Mm]/.test(time);
  const isAM = /[Aa][Mm]/.test(time);
  time = time.replace(/\s*[APap][Mm]/, "");

  const timeParts = time.split(":").map(Number);
  hours = timeParts[0];
  minutes = timeParts[1];
  seconds = timeParts[2] || 0;

  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function isSystemMessage(content: string): boolean {
  return SYSTEM_MESSAGE_INDICATORS.some((indicator) =>
    content.toLowerCase().includes(indicator.toLowerCase())
  );
}

export function parseWhatsApp(text: string): ParsedChat {
  const lines = text.split("\n");
  const messages: ParsedMessage[] = [];
  const participantSet = new Set<string>();

  let currentMessage: ParsedMessage | null = null;

  for (const line of lines) {
    let matched = false;

    for (const pattern of TIMESTAMP_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const dateStr = match[1];
        const timeStr = match[2];
        const rest = line.slice(match[0].length);

        const colonIdx = rest.indexOf(": ");
        if (colonIdx === -1) {
          // System message (no sender)
          matched = true;
          break;
        }

        const sender = rest.slice(0, colonIdx).trim();
        const content = rest.slice(colonIdx + 2);

        if (isSystemMessage(content) || isSystemMessage(sender)) {
          matched = true;
          break;
        }

        const timestamp = parseTimestamp(dateStr, timeStr);
        if (!timestamp) break;

        if (currentMessage) {
          messages.push(currentMessage);
        }

        currentMessage = { sender, content, timestamp };
        participantSet.add(sender);
        matched = true;
        break;
      }
    }

    if (!matched && currentMessage) {
      // Continuation of previous message (multi-line)
      currentMessage.content += "\n" + line;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return {
    platform: "whatsapp",
    messages,
    participants: Array.from(participantSet),
  };
}
