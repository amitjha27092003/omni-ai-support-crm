import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { query, tone = "Concise", groundingContext = "" } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const systemInstruction = `You are OmniAI Ops Autonomous Core, an enterprise customer support agent.
Match tone: ${tone}.
Grounding Knowledge / Policies provided:
${groundingContext || "Standard enterprise support guidelines apply."}

Task:
1. Answer the customer directly in 1-2 sentences using grounding knowledge if relevant.
2. If the user query matches a policy, strictly follow that policy.
3. Respond in natural language (Hinglish/English as prompted).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nCustomer Query: "${query}"` }],
        },
      ],
    });

    const reply = response.text || "Ticket logged. Support team will inspect.";
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Generation failed", details: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}