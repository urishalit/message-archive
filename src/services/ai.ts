import { getAI, getGenerativeModel, VertexAIBackend } from "@react-native-firebase/ai";
import { ParsedChat, ParsedMessage } from "../parsers/types";

function sampleMessages(parsed: ParsedChat): ParsedMessage[] {
  const msgs = [...parsed.messages].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const total = msgs.length;
  if (total <= 30) return msgs;

  const sampled: ParsedMessage[] = [];
  // 10 from start
  for (let i = 0; i < Math.min(10, total); i++) sampled.push(msgs[i]);
  // 10 from middle
  const mid = Math.floor(total / 2) - 5;
  for (let i = mid; i < mid + 10 && i < total; i++) {
    if (!sampled.includes(msgs[i])) sampled.push(msgs[i]);
  }
  // 10 from end
  for (let i = Math.max(0, total - 10); i < total; i++) {
    if (!sampled.includes(msgs[i])) sampled.push(msgs[i]);
  }
  return sampled;
}

function formatMessages(messages: ParsedMessage[]): string {
  return messages.map((m) => `${m.sender}: ${m.content}`).join("\n");
}

export async function suggestConversationTitle(
  parsed: ParsedChat
): Promise<string | null> {
  try {
    const ai = getAI(undefined, { backend: new VertexAIBackend() });
    const model = getGenerativeModel(ai, {
      model: "gemini-2.0-flash-lite",
    });

    const sampled = sampleMessages(parsed);
    const formatted = formatMessages(sampled);

    const prompt = `להלן קטע משיחה. הצע כותרת קצרה (עד 6 מילים) בשפת השיחה שמתארת את הנושא או ההקשר שלה. החזר רק את הכותרת, בלי גרשיים או סימני פיסוק מיותרים.

${formatted}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim();
    console.log("[AI] suggested title:", text);
    return text || null;
  } catch (e) {
    console.error("[AI] suggestConversationTitle failed:", e);
    return null;
  }
}
