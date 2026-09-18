import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { customerMessage, customerName, channel, tone = "Professional" } = await req.json();

    if (!customerMessage) {
      return NextResponse.json({ error: "Missing customer message" }, { status: 400 });
    }

    const systemInstruction = `
You are an autonomous customer support agent for OmniAI Ops.
Tone style to apply: ${tone}.
Format guidelines:
- Address the customer naturally if their name is available.
- Tailor the wording to the channel (${channel || "Support Channel"}).
- Provide concise, ready-to-send support prose without markdown headings.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Customer: ${customerName || "Customer"}
Channel: ${channel || "Chat"}
Tone: ${tone}
Query: "${customerMessage}"

Draft the response:`,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const reply = response.text || "Thank you for reaching out. We are resolving your query.";
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: err.message || "AI reply generation failed" },
      { status: 500 }
    );
  }
}