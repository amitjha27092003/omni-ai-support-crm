import { NextResponse } from "next/server";

let ticketsStore = [
  {
    id: "tck-01",
    customer: "Rahul Sharma",
    channel: "WhatsApp",
    priority: "High",
    message: "Maine payment kar diya par mera account upgrade nahi hua. Order ID #9821.",
    status: "Pending",
    suggested_reply: "Hi Rahul, Order ID #9821 verify ho gaya hai. Hum aapka plan activate kar rahe hain.",
    created_at: new Date().toISOString(),
  },
  {
    id: "tck-02",
    customer: "Pooja Verma",
    channel: "Email",
    priority: "Medium",
    message: "Do you offer API access for custom CRM integrations on standard plan?",
    status: "Pending",
    suggested_reply: "Hello Pooja, API access standard plan par supported nahi hai, Pro tier par available hai.",
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ tickets: ticketsStore });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ticket, ticketId, status, suggested_reply } = body;

    if (action === "create") {
      const newTicket = {
        ...ticket,
        id: `tck-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString(),
      };
      ticketsStore.unshift(newTicket);
      return NextResponse.json({ success: true, ticket: newTicket });
    }

    if (action === "update") {
      ticketsStore = ticketsStore.map((t) =>
        t.id === ticketId ? { ...t, status, suggested_reply } : t
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}