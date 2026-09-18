import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { executeAgentTool } from "@/lib/agent-tools";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { 
      query, 
      customerMessage, 
      customerName = "Customer", 
      channel = "Email", 
      tone = "Concise", 
      groundingContext = "",
      ticketId = "tck-gen"
    } = await req.json();

    const actualQuery = query || customerMessage;

    if (!actualQuery) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Step A: Agentic Tool Evaluation
    const toolResult = executeAgentTool(actualQuery, ticketId);

    // Step B: Gemini Context-Grounded Reply Synthesis
    const prompt = `You are OmniAI Ops Autonomous Support Agent.
Customer Name: ${customerName}
Channel: ${channel}
Tone: ${tone}

Active Policies (Grounding Context):
${groundingContext || "Standard enterprise support guidelines apply."}

Tool Execution Status:
- Executed Tool: ${toolResult.toolName}
- Action Performed: ${toolResult.message}

Instructions:
1. Write a professional, direct 1-2 sentence response to the customer.
2. If an autonomous tool was executed, confirm it clearly to the customer with specific details.
3. Match language (Hinglish/English) as used by the user. Do not add markdown formatting or greetings like "Dear sir/madam".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const reply = response.text || "Ticket processed by OmniAI autonomous core.";

    return NextResponse.json({
      reply,
      toolExecuted: toolResult,
    });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return NextResponse.json(
      { error: "Generation failed", details: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}