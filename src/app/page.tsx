"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  Loader2,
  RefreshCw,
  Plus,
  CheckCircle2,
  Search,
  FileText,
  UserCheck,
  GitCommit,
  Zap,
  BookOpen,
  Download,
  X,
  Play,
  Square,
  AlertTriangle,
  Smartphone,
  Terminal,
  ChevronUp,
  ChevronDown,
  Database,
  Trash2,
  Share2,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Ticket = {
  id: string;
  customer: string;
  channel: "WhatsApp" | "Telegram" | "Email" | "Lark";
  message: string;
  status: "Pending" | "AI Resolved" | "Escalated" | "Resolved";
  priority: "High" | "Medium" | "Low";
  sentiment: "Frustrated" | "Urgent" | "Neutral" | "Positive";
  confidence: number;
  slaMinutesLeft: number;
  kb_context?: string;
  internal_note?: string;
  suggested_reply: string;
  created_at: string;
  tool_action?: {
    toolName: string;
    actionTaken: boolean;
    message: string;
  };
};

type AgentLog = {
  id: string;
  time: string;
  level: "INFO" | "AGENT" | "DISPATCH";
  message: string;
};

type KBArticle = {
  id: string;
  topic: string;
  content: string;
  active: boolean;
};

// Map Supabase DB schema to UI structure
const mapDbTicketToUi = (dbRow: any): Ticket => {
  let mappedStatus: Ticket["status"] = "Pending";
  if (dbRow.status === "Resolved") mappedStatus = "Resolved";
  else if (dbRow.status === "AI Resolved") mappedStatus = "AI Resolved";
  else if (dbRow.status === "Escalated") mappedStatus = "Escalated";

  return {
    id: dbRow.id,
    customer: dbRow.customer_name || dbRow.customer_handle || "Telegram User",
    channel: (dbRow.channel as any) || "Telegram",
    message: dbRow.original_message || dbRow.sanitized_message || "",
    status: mappedStatus,
    priority: dbRow.status === "Escalated" ? "High" : "Medium",
    sentiment: (dbRow.sentiment_trajectory as any) || "Neutral",
    confidence: Number(dbRow.confidence_score) || 90,
    slaMinutesLeft: mappedStatus === "Resolved" || mappedStatus === "AI Resolved" ? 0 : 15,
    kb_context: dbRow.zkp_proof_hash ? `ZKP Proof: ${dbRow.zkp_proof_hash}` : undefined,
    suggested_reply: dbRow.ai_reply || "",
    created_at: dbRow.created_at || new Date().toISOString(),
    tool_action: dbRow.executed_tool
      ? {
          toolName: dbRow.executed_tool,
          actionTaken: true,
          message: "Autonomously executed via ops agent",
        }
      : undefined,
  };
};

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [activeTab, setActiveTab] = useState<"reply" | "notes">("reply");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "AI Resolved" | "Escalated" | "Resolved">("All");
  const [filterChannel, setFilterChannel] = useState<"All" | "WhatsApp" | "Telegram" | "Email" | "Lark">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showKBModal, setShowKBModal] = useState(false);
  const [showTerminalDrawer, setShowTerminalDrawer] = useState(false);

  const [kbArticles, setKbArticles] = useState<KBArticle[]>([
    {
      id: "kb-1",
      topic: "Refunds & Upgrades",
      content: "Gateway clearance window is strictly 15 minutes for verified invoice IDs.",
      active: true,
    },
    {
      id: "kb-2",
      topic: "API & Webhooks",
      content: "Webhook rate limit: 120 req/min. Higher limits require Pro+ cluster.",
      active: true,
    },
  ]);
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");

  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    {
      id: "log-1",
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level: "INFO",
      message: "OmniAI Agent Engine booted with Supabase Live Sync.",
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (level: "INFO" | "AGENT" | "DISPATCH", message: string) => {
    const newLog: AgentLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level,
      message,
    };
    setAgentLogs((prev) => [newLog, ...prev.slice(0, 19)]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Direct Supabase Ingestion Query
  const fetchTickets = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("operational_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        const mapped = data.map(mapDbTicketToUi);
        setTickets(mapped);
        if (!selectedTicket) {
          setSelectedTicket(mapped[0]);
          setReplyText(mapped[0].suggested_reply || "");
        }
      }
    } catch (err) {
      console.error("Fetch tickets error:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Supabase Realtime Listener on operational_tickets
    const channel = supabase
      .channel("tickets-realtime-live-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "operational_tickets" },
        (payload) => {
          const newTck = mapDbTicketToUi(payload.new);
          setTickets((prev) => {
            if (prev.some((t) => t.id === newTck.id)) return prev;
            return [newTck, ...prev];
          });
          addLog("INFO", `Realtime Ingest: #${newTck.id.slice(0, 6)} from ${newTck.customer}`);
          showToast(`Inbound: ${newTck.customer} via ${newTck.channel}`);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "operational_tickets" },
        (payload) => {
          const updated = mapDbTicketToUi(payload.new);
          setTickets((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          );
          setSelectedTicket((prev) =>
            prev && prev.id === updated.id ? { ...prev, ...updated } : prev
          );
          addLog("DISPATCH", `State Sync: #${updated.id.slice(0, 6)} is now ${updated.status}`);
          showToast(`Status updated: ${updated.status}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = filterStatus === "All" || t.status === filterStatus;
      const matchesChannel = filterChannel === "All" || t.channel === filterChannel;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        t.customer.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        t.channel.toLowerCase().includes(q);
      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [tickets, filterStatus, filterChannel, searchQuery]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "AI Resolved" || t.status === "Resolved").length;
    const escalated = tickets.filter((t) => t.status === "Escalated").length;
    const pending = tickets.filter((t) => t.status === "Pending").length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, resolved, escalated, pending, resolutionRate };
  }, [tickets]);

  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicket(t);
    setReplyText(t.suggested_reply || "");
    setInternalNote(t.internal_note || "");
    addLog("INFO", `Ticket focused: [${t.channel}] ${t.customer}`);
  };

  const handleSend = async () => {
    if (!selectedTicket) return;

    try {
      await supabase
        .from("operational_tickets")
        .update({ status: "Resolved", ai_reply: replyText })
        .eq("id", selectedTicket.id);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: "Resolved", suggested_reply: replyText, slaMinutesLeft: 0 }
            : t
        )
      );
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: "Resolved", suggested_reply: replyText, slaMinutesLeft: 0 } : null
      );
      addLog("DISPATCH", `Dispatched reply to ${selectedTicket.customer}`);
      showToast(`Response dispatched!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;

    try {
      await supabase
        .from("operational_tickets")
        .update({ status: "Escalated" })
        .eq("id", selectedTicket.id);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: "Escalated", priority: "High" } : t
        )
      );
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: "Escalated", priority: "High" } : null
      );
      addLog("INFO", `Escalated: #${selectedTicket.id.slice(0, 6)} routed to Tier-2`);
      showToast(`Ticket escalated to Tier-2`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoPilotResolveAll = async () => {
    setIsAutoPiloting(true);
    addLog("AGENT", `Auto-Pilot sequence initialized for ${stats.pending} pending tickets`);
    showToast("Auto-Pilot active: resolving queue...");

    try {
      await supabase
        .from("operational_tickets")
        .update({ status: "Resolved" })
        .eq("status", "Open");

      setTickets((prev) =>
        prev.map((t) => (t.status === "Pending" ? { ...t, status: "Resolved", slaMinutesLeft: 0 } : t))
      );
      if (selectedTicket && selectedTicket.status === "Pending") {
        setSelectedTicket((prev) => (prev ? { ...prev, status: "Resolved", slaMinutesLeft: 0 } : null));
      }
    } catch (e) {
      console.error(e);
    }

    setIsAutoPiloting(false);
    addLog("DISPATCH", `Auto-Pilot resolution complete`);
    showToast("All pending tickets autonomously resolved!");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Customer", "Channel", "Priority", "Status", "Confidence", "Query", "Reply"];
    const rows = tickets.map((t) => [
      t.id,
      `"${t.customer}"`,
      t.channel,
      t.priority,
      t.status,
      `${t.confidence}%`,
      `"${t.message.replace(/"/g, '""')}"`,
      `"${t.suggested_reply.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OmniAI_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans relative overflow-hidden flex-col antialiased">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200/80 bg-white p-6 flex flex-col justify-between shadow-[2px_0_12px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/25 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block">OmniAI Ops</span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Dispatch
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100 shadow-sm cursor-pointer">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Tickets Queue
              </div>
              <div
                onClick={() => setShowAnalyticsModal(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all font-medium text-xs cursor-pointer"
              >
                <Activity className="w-4 h-4 text-slate-500" /> Operations Pulse
              </div>
              <div
                onClick={() => setShowKBModal(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all font-medium text-xs cursor-pointer"
              >
                <Database className="w-4 h-4 text-indigo-500" /> Grounding KB ({kbArticles.length})
              </div>
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <button
                onClick={handleAutoPilotResolveAll}
                disabled={isAutoPiloting || stats.pending === 0}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
              >
                {isAutoPiloting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
                Auto-Pilot ({stats.pending})
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors text-xs font-semibold shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Overview</div>
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs font-bold text-slate-800">{stats.total}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Total</div>
                </div>
                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs font-bold text-amber-700">{stats.pending}</div>
                  <div className="text-[9px] text-amber-600 mt-0.5">Pending</div>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs font-bold text-emerald-700">{stats.resolved}</div>
                  <div className="text-[9px] text-emerald-600 mt-0.5">Done</div>
                </div>
                <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs font-bold text-rose-700">{stats.escalated}</div>
                  <div className="text-[9px] text-rose-600 mt-0.5">Escalated</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Ticket List Stream Column */}
        <section className="w-96 border-r border-slate-200/80 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900">Inbound Stream</h2>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                  {filteredTickets.length}
                </span>
              </div>
              <button
                onClick={fetchTickets}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              {(["All", "Telegram", "WhatsApp", "Email", "Lark"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch as any)}
                  className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-medium transition-all ${
                    filterChannel === ch
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No live tickets found. Send a message on Telegram!</div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTicket?.id === t.id
                      ? "bg-blue-50/70 border-l-4 border-blue-600"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-semibold text-xs text-slate-900">{t.customer}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">{t.message}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md border bg-sky-50 border-sky-200 text-sky-700">
                      {t.channel}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ml-auto ${
                        t.status === "Resolved" || t.status === "AI Resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "Escalated"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Workspace Main Column */}
        <main className="flex-1 flex flex-col bg-[#F8FAFC]">
          {selectedTicket ? (
            <>
              <header className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-slate-900">{selectedTicket.customer}</h1>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Sentiment: {selectedTicket.sentiment || "Neutral"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ticket ID: <span className="font-mono text-[11px]">{selectedTicket.id}</span> • Channel: <strong>{selectedTicket.channel}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    Dispatch Preview
                  </button>
                  <button
                    onClick={handleEscalate}
                    disabled={selectedTicket.status === "Escalated"}
                    className="flex items-center gap-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {selectedTicket.status === "Escalated" ? "Escalated to Tier-2" : "Escalate to Human"}
                  </button>
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                      selectedTicket.status === "Resolved" || selectedTicket.status === "AI Resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedTicket.status === "Escalated"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    Status: {selectedTicket.status}
                  </span>
                </div>
              </header>

              <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3.5 max-w-3xl">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Customer Inbound Message
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">{selectedTicket.message}</p>
                  </div>

                  {selectedTicket.kb_context && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs flex items-start gap-2.5 text-indigo-900 shadow-sm">
                      <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-indigo-700">Audit Proof: </span>
                        <span>{selectedTicket.kb_context}</span>
                      </div>
                    </div>
                  )}

                  {selectedTicket.tool_action?.actionTaken && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs flex items-start gap-2.5 text-emerald-900 shadow-sm">
                      <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-800">Autonomous Tool Executed: </span>
                        <span className="font-mono font-semibold text-emerald-900">[{selectedTicket.tool_action.toolName}]</span>
                        <p className="mt-0.5 text-emerald-800/90">{selectedTicket.tool_action.message}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-3.5 border-b border-slate-100 pb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("reply")}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === "reply"
                            ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Suggested Reply
                      </button>
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                        {selectedTicket.confidence}% Confidence
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Customize response before dispatching..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
                  />
                  <div className="mt-3.5 flex justify-between items-center">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Share2 className="w-3.5 h-3.5 text-blue-600" />
                      Target: <span className="text-slate-800 font-semibold">{selectedTicket.channel} API</span>
                    </div>
                    <button
                      onClick={handleSend}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Reply
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a ticket from the queue to start.
            </div>
          )}
        </main>
      </div>

      {/* Telemetry Drawer */}
      <footer className="border-t border-slate-200 bg-white flex flex-col z-30 transition-all duration-300 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div
          onClick={() => setShowTerminalDrawer(!showTerminalDrawer)}
          className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
        >
          <div className="flex items-center gap-2.5 text-xs font-mono text-slate-700">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-bold">Autonomous Core Telemetry</span>
            <span className="text-slate-400 text-[11px]">• Supabase Realtime: Active</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <span>{showTerminalDrawer ? "Hide Console" : "Show Live Agent Logs"}</span>
            {showTerminalDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {showTerminalDrawer && (
          <div className="p-3 bg-slate-900 font-mono text-[11px] space-y-1.5 max-h-44 overflow-y-auto text-slate-200">
            {agentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-slate-500 select-none">[{log.time}]</span>
                <span className="px-1 rounded text-[9px] font-bold bg-blue-950 text-blue-400 border border-blue-800">
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-14 right-6 flex items-center gap-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-medium px-4 py-3 rounded-2xl shadow-xl shadow-slate-300/30 animate-in fade-in slide-in-from-bottom-3 duration-200 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}