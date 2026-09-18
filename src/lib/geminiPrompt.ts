/**
 * Gemini Prompt Builder and JSON Parser for Multilingual OmniChannel Triage
 */

export function buildMultilingualPrompt(message: string, customerName: string): string {
  return `You are OmniAI, a polite, highly capable multilingual customer support agent for an enterprise platform.

Customer name: ${customerName}
Customer message: ${message}

Analyze the customer message and return ONLY a valid raw JSON object (without markdown code blocks, backticks, or other text) with the following structure:
{
  "detected_language": "English",
  "detected_language_iso": "en",
  "english_translation": "Concise English translation of customer message for operations team review",
  "suggested_reply": "Polite, helpful reply addressed to the customer in their native language and script"
}`;
}

export interface ParsedGeminiResponse {
  detected_language: string;
  detected_language_iso: string;
  english_translation: string;
  suggested_reply: string;
}

export function parseGeminiJSON(text: string): ParsedGeminiResponse {
  try {
    if (!text || !text.trim()) throw new Error("Empty text");
    const cleaned = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      detected_language: parsed.detected_language || "English",
      detected_language_iso: parsed.detected_language_iso || "en",
      english_translation: parsed.english_translation || "",
      suggested_reply:
        parsed.suggested_reply ||
        "Thank you for contacting OmniAI Support. Our operations team is reviewing your inquiry.",
    };
  } catch {
    return {
      detected_language: "English",
      detected_language_iso: "en",
      english_translation: text || "",
      suggested_reply:
        "Thank you for reaching out. We have logged your request and our support desk is on it.",
    };
  }
}
