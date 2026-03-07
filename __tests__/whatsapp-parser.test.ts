import { parseWhatsApp } from "../src/parsers/whatsapp";

describe("parseWhatsApp", () => {
  it("parses standard DD/MM/YYYY format", () => {
    const text = `12/1/2023, 10:49 - Alice: Hello
12/1/2023, 10:50 - Bob: Hi there`;
    const result = parseWhatsApp(text);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].sender).toBe("Alice");
    expect(result.messages[0].content).toBe("Hello");
    expect(result.messages[1].sender).toBe("Bob");
    expect(result.participants).toEqual(["Alice", "Bob"]);
  });

  it("parses dot-separated DD.MM.YYYY format (Hebrew WhatsApp)", () => {
    const text = `25.9.2024, 11:54 - Tal: שלום
25.9.2024, 11:55 - אלחי טופר: היי מה קורה`;
    const result = parseWhatsApp(text);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].sender).toBe("Tal");
    expect(result.messages[0].content).toBe("שלום");
    expect(result.messages[1].sender).toBe("אלחי טופר");
    expect(result.messages[1].timestamp.getFullYear()).toBe(2024);
    expect(result.messages[1].timestamp.getMonth()).toBe(8); // September = 8
    expect(result.messages[1].timestamp.getDate()).toBe(25);
  });

  it("filters Hebrew system messages", () => {
    const text = `10.3.2023, 10:49 - \u200Fההודעות והשיחות מוצפנות מקצה לקצה ורק האנשים בצ'אט הזה יכולים לקרוא אותן, להאזין להן ולשתף אותן. *למידע נוסף*
25.9.2024, 11:54 - Tal: הודעה אמיתית`;
    const result = parseWhatsApp(text);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].sender).toBe("Tal");
  });

  it("handles multiline messages", () => {
    const text = `27.6.2025, 7:24 - Tal: אממ כן
מה לכתוב בשלטים?
27.6.2025, 7:30 - Bob: שלום`;
    const result = parseWhatsApp(text);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe("אממ כן\nמה לכתוב בשלטים?");
  });

  it("parses the full test export file", () => {
    const text = `10.3.2023, 10:49 - \u200Fההודעות והשיחות מוצפנות מקצה לקצה ורק האנשים בצ'אט הזה יכולים לקרוא אותן, להאזין להן ולשתף אותן. *למידע נוסף*
25.9.2024, 11:54 - Tal: <המדיה לא נכללה>
25.9.2024, 11:55 - אלחי טופר: תשלחי למוריה אולי כי זה כנראה לא קולט לי
27.6.2025, 7:23 - אלחי טופר: טל יונה מוסרת אם את יכולה להכין את השלטים
27.6.2025, 7:23 - Tal: עוד שולחן?
27.6.2025, 7:24 - Tal: אממ כן
מה לכתוב בשלטים?
27.6.2025, 7:30 - אלחי טופר: לא אנחנו פותחים עוד שולחן לאוכל יש יותר מדי`;
    const result = parseWhatsApp(text);
    expect(result.messages).toHaveLength(6);
    expect(result.participants).toContain("Tal");
    expect(result.participants).toContain("אלחי טופר");
  });
});
