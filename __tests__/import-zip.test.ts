import * as fs from "fs";
import * as path from "path";
import JSZip from "jszip";
import { detectAndParse } from "../src/parsers";

const CHAT_FILE_EXTENSIONS = [".txt", ".json"];

async function extractChatFromZipBuffer(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  for (const ext of CHAT_FILE_EXTENSIONS) {
    for (const [filename, file] of Object.entries(zip.files)) {
      if (!file.dir && filename.toLowerCase().endsWith(ext)) {
        return await file.async("string");
      }
    }
  }
  throw new Error("No chat file found in zip");
}

describe("WhatsApp zip import", () => {
  const zipPath = path.join(
    __dirname,
    "fixtures",
    "WhatsApp Chat with Tal Bar On.zip"
  );

  let allMessages: ReturnType<typeof detectAndParse>;

  beforeAll(async () => {
    const buffer = fs.readFileSync(zipPath);
    const chatContent = await extractChatFromZipBuffer(buffer);
    allMessages = detectAndParse(chatContent);
  });

  it("should extract a .txt file from the zip", async () => {
    const buffer = fs.readFileSync(zipPath);
    const content = await extractChatFromZipBuffer(buffer);
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
  });

  it("should detect WhatsApp format", () => {
    expect(allMessages.platform).toBe("whatsapp");
  });

  it("should parse all non-system messages", () => {
    expect(allMessages.messages.length).toBeGreaterThan(0);
    // The file has 20 actual messages (excluding the system message)
    expect(allMessages.messages.length).toBe(20);
  });

  it("should find two participants", () => {
    expect(allMessages.participants).toContain("Uri Shalit");
    expect(allMessages.participants).toContain("Tal Bar On");
    expect(allMessages.participants.length).toBe(2);
  });

  it("should filter messages after Feb 27 2026", () => {
    const cutoff = new Date(2026, 1, 27); // Feb 27 2026
    const filtered = allMessages.messages.filter(
      (m) => m.timestamp > cutoff
    );

    expect(filtered.length).toBe(4);

    // Verify all filtered messages are from Feb 28 2026
    for (const msg of filtered) {
      expect(msg.timestamp.getTime()).toBeGreaterThan(cutoff.getTime());
    }

    // Check specific content
    expect(filtered[0].sender).toBe("Uri Shalit");
    expect(filtered[0].content).toContain("מרוצה");

    expect(filtered[1].sender).toBe("Tal Bar On");

    expect(filtered[2].sender).toBe("Tal Bar On");
    expect(filtered[2].content).toContain("תות או שטות");

    expect(filtered[3].sender).toBe("Uri Shalit");
    expect(filtered[3].content).toContain("לא מנחם");
  });

  it("should handle multi-line messages", () => {
    const multiLine = allMessages.messages.find((m) =>
      m.content.includes("אפשר להזמין")
    );
    expect(multiLine).toBeTruthy();
    // This message spans two lines in the export
    expect(multiLine!.content).toContain("\n");
  });

  it("should skip system messages", () => {
    const systemMsg = allMessages.messages.find((m) =>
      m.content.includes("end-to-end encrypted")
    );
    expect(systemMsg).toBeUndefined();
  });
});
