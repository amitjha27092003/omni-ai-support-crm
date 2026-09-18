import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ tickets: [] });
    }

    return NextResponse.json({ tickets: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, tickets: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ticketId, status, suggested_reply, internal_note } = body;

    // Action: Update existing ticket status/reply
    if (action === "update" && ticketId) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (suggested_reply) updateData.suggested_reply = suggested_reply;
      if (internal_note !== undefined) updateData.internal_note = internal_note;

      const { data, error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", ticketId)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, ticket: data?.[0] });
    }

    // Action: Insert new ticket
    const { data, error } = await supabase
      .from("tickets")
      .upsert([body])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, ticket: data?.[0] }, { status: 201 });
  } catch (err: any) {
    console.error("Supabase mutation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}