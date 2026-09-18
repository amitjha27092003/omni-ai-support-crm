'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Ticket {
  id: string;
  channel: string;
  customer_name: string;
  customer_handle: string;
  original_message: string;
  status: string;
  confidence_score: number;
  ai_reply: string;
  created_at: string;
}

export default function TicketFeed() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    // 1. Initial tickets fetch
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('operational_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setTickets(data);
      }
    };

    fetchTickets();

    // 2. Realtime listener for new tickets & status changes
    const channel = supabase
      .channel('realtime_support_tickets')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'operational_tickets' },
        (payload) => {
          setTickets((prev) => [payload.new as Ticket, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'operational_tickets' },
        (payload) => {
          setTickets((prev) =>
            prev.map((item) => (item.id === payload.new.id ? (payload.new as Ticket) : item))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Live Operations Feed</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Real-time Telegram & Omnichannel Tickets</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Realtime Live
        </span>
      </div>

      <div className="space-y-2.5">
        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">No tickets found.</p>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-zinc-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">{t.customer_name}</span>
                  <span className="text-xs text-zinc-400">{t.customer_handle}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase font-mono">
                    {t.channel}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{t.original_message}</p>
              </div>

              <div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                    t.status === 'Resolved'
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                      : t.status === 'Escalated'
                      ? 'bg-rose-950/50 text-rose-400 border-rose-800/50'
                      : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}