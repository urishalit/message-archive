import { Platform } from "../types/firestore";

export interface ParsedMessage {
  sender: string; // original identifier (phone number, telegram ID, or name)
  content: string;
  timestamp: Date;
}

export interface ParsedChat {
  platform: Platform;
  messages: ParsedMessage[];
  participants: string[]; // unique sender identifiers
}
