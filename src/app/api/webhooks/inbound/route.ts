import { NextResponse } from "next/server";
import { executeAgentTool } from "@/lib/agent-tools";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customer =
      body.customer ||
      body.sender?.name ||
      body.from?.first_name ||
      "Inbound Guest";

    const message =
      body.message ||
      body.text ||
      body.content ||
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
      "";

    const rawChannel = (body.channel || body.source || "Email").toLowerCase();
    let channel: "WhatsApp" | "Telegram" | "Email" | "Lark" = "Email";
    if (rawChannel.includes("whatsapp")) channel = "WhatsApp";
    else if (rawChannel.includes("telegram")) channel = "Telegram";
    else if (rawChannel.includes("lark")) channel = "Lark";

    if (!message) {
      return NextResponse.json(
        { error: "Invalid webhook payload: message text is missing" },
        { status: 400 }
      );
    }

    const ticketId = `tck-${Date.now().toString().slice(-4)}`;
    const toolResult = executeAgentTool(message, ticketId);

    const isUrgent =
      message.toLowerCase().includes("urgent") ||
      message.toLowerCase().includes("payment") ||
      message.toLowerCase().includes("502");

    const newTicket = {
      id: ticketId,
      customer,
      channel,
      message,
      status: "Pending",
      priority: isUrgent ? "High" : "Medium",
      sentiment: isUrgent ? "Urgent" : "Neutral",
      confidence: 95,
      slaMinutesLeft: isUrgent ? 10 : 30,
      suggested_reply: `Hi ${customer}, your query regarding "${message.slice(0, 35)}..." is being processed by OmniAI Ops.`,
      tool_action: toolResult,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Webhook event ingested into OmniAI queue",
        ticket: newTicket,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Webhook processing failed", details: error?.message },
      { status: 500 }
    );
  }
}