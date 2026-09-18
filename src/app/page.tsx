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
  Clock,
  Layers,
  Search,
  FileText,
  UserCheck,
  GitCommit,
  Zap,
  BookOpen,
  Download,
  BarChart3,
  X,
  Play,
  Square,
  AlertTriangle,
  ShieldAlert,
  Smartphone,
  Terminal,
  ChevronUp,
  ChevronDown,
  Database,
  Trash2,
  Share2,
  ArrowUpRight,
  Sun,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Ticket = {
  id: string;
  customer: string;
  channel: "WhatsApp" | "Telegram" | "Email" | "Lark";
  message: string;
  status: "Pending" | "AI Resolved" | "Escalated";
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

const initialFallbackTickets: Ticket[] = [
  {
    id: "tck-01",
    customer: "Rahul Sharma",
    channel: "WhatsApp",
    message: "Maine payment kar diya par mera account upgrade nahi hua. Order ID #9821.",
    status: "Pending",
    priority: "High",
    sentiment: "Urgent",
    confidence: 96,
    slaMinutesLeft: 8,
    kb_context: "Billing Doc §4.2: Manual gateway recon clears inside 15 mins.",
    internal_note: "Razorpay webhook check required.",
    suggested_reply:
      "Hi Rahul, humne Order ID #9821 verify kar liya hai. Aapka plan manually activate kar diya gaya hai. Kripya check kar lijiye.",
    created_at: new Date().toISOString(),
  },
  {
    id: "tck-02",
    customer: "Pooja Verma",
    channel: "Email",
    message: "Do you offer API access for custom CRM integrations on standard plan?",
    status: "AI Resolved",
    priority: "Medium",
    sentiment: "Neutral",
    confidence: 92,
    slaMinutesLeft: 0,
    kb_context: "API Tier Matrix: Standard includes webhooks; bidirectional REST is Pro+.",
    suggested_reply:
      "Hello Pooja, standard plans include REST webhook triggers. For full bi-directional CRM sync, you can upgrade to the Pro plan directly from your billing tab.",
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [activeTab, setActiveTab] = useState<"reply" | "notes">("reply");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "AI Resolved" | "Escalated">("All");
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
    {
      id: "kb-3",
      topic: "Tax & GST",
      content: "GST invoices can be downloaded or updated directly within 30 days of billing.",
      active: true,
    },
  ]);
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");

  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    {
      id: "log-1",
      time: "12:00:04",
      level: "INFO",
      message: "OmniAI Agent Engine booted with Gemini 2.5 Flash model.",
    },
    {
      id: "log-2",
      time: "12:01:20",
      level: "AGENT",
      message: "Knowledge base index mapped: 3 active vectors synchronized.",
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

  const fetchTickets = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const json = await res.json();
        if (json.tickets && json.tickets.length > 0) {
          setTickets(json.tickets);
          if (!selectedTicket) {
            setSelectedTicket(json.tickets[0]);
            setReplyText(json.tickets[0].suggested_reply || "");
            setInternalNote(json.tickets[0].internal_note || "");
          }
          setIsFetching(false);
          return;
        }
      }
    } catch {
      // offline fallback
    }

    setTickets((prev) => (prev.length > 0 ? prev : initialFallbackTickets));
    if (!selectedTicket) {
      setSelectedTicket(initialFallbackTickets[0]);
      setReplyText(initialFallbackTickets[0].suggested_reply || "");
      setInternalNote(initialFallbackTickets[0].internal_note || "");
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchTickets();

    // Supabase Realtime Listener
    const channel = supabase
      .channel("tickets-db-changes-light")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTck = payload.new as Ticket;
            setTickets((prev) => {
              if (prev.some((t) => t.id === newTck.id)) return prev;
              return [newTck, ...prev];
            });
            addLog("INFO", `Realtime Ingest: #${newTck.id} from ${newTck.customer}`);
            showToast(`New Inbound: ${newTck.customer} via ${newTck.channel}`);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Ticket;
            setTickets((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
            setSelectedTicket((prev) =>
              prev && prev.id === updated.id ? { ...prev, ...updated } : prev
            );
          }
        }
      )
      .subscribe();

    // High availability Polling Fallback
    const pollInterval = setInterval(() => {
      fetchTickets();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
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
    const resolved = tickets.filter((t) => t.status === "AI Resolved").length;
    const escalated = tickets.filter((t) => t.status === "Escalated").length;
    const pending = tickets.filter((t) => t.status === "Pending").length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, resolved, escalated, pending, resolutionRate };
  }, [tickets]);

  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicket(t);
    setReplyText(t.suggested_reply || "");
    setInternalNote(t.internal_note || "");
    addLog("INFO", `Ticket #${t.id} focused: [${t.channel}] ${t.customer}`);
  };

  const handleGenerateAI = async (tone = "Professional") => {
    if (!selectedTicket) return;
    setIsLoadingAI(true);
    addLog("AGENT", `Synthesizing reply for ${selectedTicket.customer} [Tone: ${tone}]`);

    const groundingContext = kbArticles
      .filter((a) => a.active)
      .map((a) => `[${a.topic}]: ${a.content}`)
      .join("\n");

    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: selectedTicket.message,
          customerMessage: selectedTicket.message,
          customerName: selectedTicket.customer,
          channel: selectedTicket.channel,
          tone,
          groundingContext,
          ticketId: selectedTicket.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generated = data.reply || data.suggested_reply;
        const toolExecuted = data.toolExecuted;

        if (toolExecuted?.actionTaken) {
          addLog("DISPATCH", `Autonomous Executed: ${toolExecuted.toolName} -> ${toolExecuted.message}`);
        }

        if (generated) {
          setReplyText(generated);
          setTickets((prev) =>
            prev.map((t) =>
              t.id === selectedTicket.id
                ? { ...t, suggested_reply: generated, tool_action: toolExecuted }
                : t
            )
          );
          setSelectedTicket((prev) =>
            prev ? { ...prev, suggested_reply: generated, tool_action: toolExecuted } : null
          );
          setIsLoadingAI(false);
          addLog("AGENT", `Response tuned with ${selectedTicket.confidence}% confidence`);
          showToast(
            toolExecuted?.actionTaken
              ? `Executed: ${toolExecuted.toolName}`
              : `Draft updated to ${tone}`
          );
          return;
        }
      }
    } catch (err) {
      console.warn("AI generation fallback triggered:", err);
    }

    if (tone === "Concise") {
      setReplyText(`Hi ${selectedTicket.customer}, logged and resolving: "${selectedTicket.message.slice(0, 30)}...". Update soon.`);
    } else if (tone === "Apologetic") {
      setReplyText(`Dear ${selectedTicket.customer}, we sincerely apologize for the disruption caused by "${selectedTicket.message.slice(0, 30)}...". Our priority support team is resolving this immediately.`);
    } else {
      setReplyText(
        `Hello ${selectedTicket.customer}, thank you for reaching out via ${selectedTicket.channel}. Our automated system has logged your request: "${selectedTicket.message.slice(0, 45)}...". Our team is addressing it immediately.`
      );
    }
    addLog("AGENT", `Fallback draft synthesized`);
    showToast(`Draft generated (${tone})`);
    setIsLoadingAI(false);
  };

  const handleSend = async () => {
    if (!selectedTicket) return;

    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ticketId: selectedTicket.id,
          status: "AI Resolved",
          suggested_reply: replyText,
        }),
      });
    } catch {
      // offline fallback
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, status: "AI Resolved", suggested_reply: replyText, internal_note: internalNote, slaMinutesLeft: 0 }
          : t
      )
    );
    setSelectedTicket((prev) =>
      prev ? { ...prev, status: "AI Resolved", suggested_reply: replyText, internal_note: internalNote, slaMinutesLeft: 0 } : null
    );

    addLog("DISPATCH", `Payload dispatched to ${selectedTicket.customer} via ${selectedTicket.channel}`);
    showToast(`Response dispatched to ${selectedTicket.customer}!`);
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;

    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ticketId: selectedTicket.id,
          status: "Escalated",
        }),
      });
    } catch (err) {
      console.error("Escalate error:", err);
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, status: "Escalated", priority: "High" }
          : t
      )
    );
    setSelectedTicket((prev) =>
      prev ? { ...prev, status: "Escalated", priority: "High" } : null
    );

    addLog("INFO", `Human escalation: #${selectedTicket.id} routed to Tier-2`);
    showToast(`Ticket #${selectedTicket.id} escalated to Tier-2`);
  };

  const handleAutoPilotResolveAll = async () => {
    setIsAutoPiloting(true);
    addLog("AGENT", `Auto-Pilot sequence initialized for ${stats.pending} pending tickets`);
    showToast("Auto-Pilot active: resolving queue...");

    await new Promise((r) => setTimeout(r, 1000));

    const pendingTickets = tickets.filter((t) => t.status === "Pending");
    for (const t of pendingTickets) {
      try {
        await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            ticketId: t.id,
            status: "AI Resolved",
          }),
        });
      } catch {
        // continue
      }
    }

    setTickets((prev) =>
      prev.map((t) => (t.status === "Pending" ? { ...t, status: "AI Resolved", slaMinutesLeft: 0 } : t))
    );

    if (selectedTicket && selectedTicket.status === "Pending") {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "AI Resolved", slaMinutesLeft: 0 } : null));
    }

    setIsAutoPiloting(false);
    addLog("DISPATCH", `Auto-Pilot resolution complete`);
    showToast("All pending tickets autonomously resolved!");
  };

  const handleSaveInternalNote = async () => {
    if (!selectedTicket) return;

    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ticketId: selectedTicket.id,
          internal_note: internalNote,
        }),
      });
    } catch (err) {
      console.error("Note save error:", err);
    }

    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, internal_note: internalNote } : t))
    );
    addLog("INFO", `Internal note saved to #${selectedTicket.id}`);
    showToast("Internal note saved successfully");
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Customer", "Channel", "Priority", "Sentiment", "Status", "Confidence", "Query", "Reply"];
    const rows = tickets.map((t) => [
      t.id,
      `"${t.customer}"`,
      t.channel,
      t.priority,
      t.sentiment,
      t.status,
      `${t.confidence}%`,
      `"${t.message.replace(/"/g, '""')}"`,
      `"${t.suggested_reply.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OmniAI_Light_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("INFO", "CSV report exported");
    showToast("Tickets export CSV downloaded");
  };

  const handleAddKBArticle = () => {
    if (!newTopic.trim() || !newContent.trim()) return;
    const article: KBArticle = {
      id: `kb-${Date.now().toString().slice(-4)}`,
      topic: newTopic.trim(),
      content: newContent.trim(),
      active: true,
    };
    setKbArticles((prev) => [article, ...prev]);
    setNewTopic("");
    setNewContent("");
    addLog("INFO", `Knowledge base indexed: "${article.topic}"`);
    showToast("Knowledge article added");
  };

  const handleDeleteKB = (id: string) => {
    setKbArticles((prev) => prev.filter((a) => a.id !== id));
    addLog("INFO", `Knowledge document removed: #${id}`);
    showToast("Knowledge doc removed");
  };

  const generateRandomTicket = (): Ticket => {
    const samplePool = [
      {
        customer: "Vikram Malhotra",
        channel: "Lark" as const,
        priority: "High" as const,
        sentiment: "Urgent" as const,
        confidence: 94,
        slaMinutesLeft: 12,
        kb_context: "Integrations §12: Webhooks require TLS 1.3 verification endpoint.",
        message: "Can we integrate your webhook with our Lark bot for real-time dispatch?",
        reply: "Hello Vikram, our webhook endpoint supports custom header secrets for Lark bot integrations directly.",
      },
      {
        customer: "Ananya Iyer",
        channel: "Email" as const,
        priority: "Medium" as const,
        sentiment: "Neutral" as const,
        confidence: 97,
        slaMinutesLeft: 25,
        kb_context: "Tax Matrix: GST invoices can be refreshed via Portal within 30 days.",
        message: "Invoice for August payment is missing GSTIN details. Please regenerate and send.",
        reply: "Hi Ananya, your GSTIN credentials have been appended to invoice #INV-889. The PDF is dispatched.",
      },
      {
        customer: "Kunal Shah",
        channel: "Telegram" as const,
        priority: "High" as const,
        sentiment: "Frustrated" as const,
        confidence: 89,
        slaMinutesLeft: 4,
        kb_context: "Infrastructure §8: 502 indicates burst concurrency limit hit.",
        message: "Receiving 502 bad gateway error on API webhook trigger during spike hours.",
        reply: "Hello Kunal, rate-limit thresholds have been dynamically widened for your cluster. Service is normal.",
      },
      {
        customer: "Neha Taneja",
        channel: "WhatsApp" as const,
        priority: "Low" as const,
        sentiment: "Positive" as const,
        confidence: 98,
        slaMinutesLeft: 45,
        kb_context: "RBAC Docs: Admin, Agent, and Viewer definitions inside Settings.",
        message: "Where can I find documentation for user role permissions inside the dashboard?",
        reply: "Hi Neha, you can access the RBAC matrix directly under Settings > Team Management.",
      },
      {
        customer: "Siddharth Mehta",
        channel: "Telegram" as const,
        priority: "High" as const,
        sentiment: "Urgent" as const,
        confidence: 91,
        slaMinutesLeft: 6,
        kb_context: "Security Matrix §2: Two-factor SMS sync retry limits.",
        message: "OTP verification code is not arriving for my login session.",
        reply: "Hi Siddharth, SMS gateway routes have been toggled to secondary. Please retry now.",
      },
    ];

    const pick = samplePool[Math.floor(Math.random() * samplePool.length)];
    return {
      ...pick,
      id: `tck-${Date.now().toString().slice(-4)}`,
      status: "Pending",
      suggested_reply: pick.reply,
      created_at: new Date().toISOString(),
    };
  };

  const handleSimulateNewTicket = async () => {
    const newTicket = generateRandomTicket();
    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
    } catch {
      // continue locally
    }

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    setReplyText(newTicket.suggested_reply);
    setInternalNote("");
    addLog("INFO", `Inbound ticket added: ${newTicket.customer} [${newTicket.channel}]`);
    showToast(`Inbound message: ${newTicket.customer}`);
  };

  const toggleLiveSimulating = () => {
    if (isLiveSimulating) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLiveSimulating(false);
      addLog("INFO", "Traffic generator paused");
      showToast("Live inbound generator paused");
    } else {
      setIsLiveSimulating(true);
      addLog("INFO", "Live traffic streaming active: interval 6s");
      showToast("Streaming tickets every 6s");
      timerRef.current = setInterval(async () => {
        const ticket = generateRandomTicket();
        try {
          await fetch("/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticket),
          });
        } catch {
          // continue locally
        }
        setTickets((prev) => [ticket, ...prev]);
        addLog("INFO", `Inbound: ${ticket.customer} [${ticket.channel}]`);
      }, 6000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans relative overflow-hidden flex-col antialiased">
      <div className="flex flex-1 overflow-hidden">
        {/* Sleek Light Sidebar */}
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

          {/* Sidebar Ops Dashboard Action Area */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <button
                onClick={toggleLiveSimulating}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isLiveSimulating
                    ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                }`}
              >
                {isLiveSimulating ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                    Stop Live Inbound
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    Start Live Inbound
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoPilotResolveAll}
                  disabled={isAutoPiloting || stats.pending === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
                >
                  {isAutoPiloting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
                  Auto-Pilot ({stats.pending})
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Live Overview
              </div>
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSimulateNewTicket}
                  className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Simulate
                </button>
                <button
                  onClick={fetchTickets}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket, customer or intent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Channel Filters */}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              {(["All", "WhatsApp", "Telegram", "Email", "Lark"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch)}
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

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-[11px]">
              {(["All", "Pending", "AI Resolved", "Escalated"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`flex-1 py-1 rounded-lg font-semibold transition-all text-[10px] ${
                    filterStatus === st
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Stream Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No tickets found in current filter.</div>
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
                    <div className="flex items-center gap-1.5">
                      {t.status === "Pending" && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            t.slaMinutesLeft < 10
                              ? "text-rose-700 bg-rose-100 border border-rose-200 animate-pulse"
                              : "text-slate-600 bg-slate-100"
                          }`}
                        >
                          {t.slaMinutesLeft}m SLA
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">{t.message}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                        t.channel === "WhatsApp"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : t.channel === "Telegram"
                          ? "bg-sky-50 border-sky-200 text-sky-700"
                          : t.channel === "Lark"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      {t.channel}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                        t.priority === "High"
                          ? "text-rose-700 bg-rose-50 border border-rose-200"
                          : t.priority === "Medium"
                          ? "text-amber-700 bg-amber-50 border border-amber-200"
                          : "text-slate-600 bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[9px] font-medium text-slate-500">
                      ● {t.sentiment || "Neutral"}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ml-auto ${
                        t.status === "AI Resolved"
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
              {/* Workspace Header */}
              <header className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-slate-900">{selectedTicket.customer}</h1>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Sentiment: {selectedTicket.sentiment || "Neutral"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ticket ID: <span className="font-mono">{selectedTicket.id}</span> • Channel: <strong>{selectedTicket.channel}</strong> • Priority: <strong>{selectedTicket.priority}</strong>
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
                      selectedTicket.status === "AI Resolved"
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

              {/* Workspace Body */}
              <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3.5 max-w-3xl">
                  {/* Customer Query Card */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Customer Inbound Message
                    </p>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">{selectedTicket.message}</p>
                  </div>

                  {/* Grounding Context */}
                  {selectedTicket.kb_context && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs flex items-start gap-2.5 text-indigo-900 shadow-sm">
                      <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-indigo-700">RAG Policy Grounding: </span>
                        <span>{selectedTicket.kb_context}</span>
                      </div>
                    </div>
                  )}

                  {/* Autonomous Tool Execution Badge */}
                  {selectedTicket.tool_action && selectedTicket.tool_action.actionTaken && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs flex items-start gap-2.5 text-emerald-900 shadow-sm">
                      <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-800">Autonomous Tool Executed: </span>
                        <span className="font-mono font-semibold text-emerald-900">[{selectedTicket.tool_action.toolName}]</span>
                        <p className="mt-0.5 text-emerald-800/90">{selectedTicket.tool_action.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Pipeline Stepper */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between text-slate-500 shadow-sm">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <GitCommit className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ingest: <strong>{selectedTicket.channel}</strong></span>
                    </div>
                    <div className="h-px w-8 bg-slate-200" />
                    <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Gemini 2.5 Flash</span>
                    </div>
                    <div className="h-px w-8 bg-slate-200" />
                    <div
                      className={`flex items-center gap-1.5 font-semibold ${
                        selectedTicket.status === "AI Resolved"
                          ? "text-emerald-700"
                          : selectedTicket.status === "Escalated"
                          ? "text-rose-700"
                          : "text-amber-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedTicket.status}</span>
                    </div>
                  </div>
                </div>

                {/* AI Draft & Dispatch Card */}
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
                      <button
                        onClick={() => setActiveTab("notes")}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === "notes"
                            ? "bg-amber-50 text-amber-800 border border-amber-200 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" /> Internal Notes
                      </button>
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                        {selectedTicket.confidence}% Confidence
                      </span>
                    </div>

                    {activeTab === "reply" && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 text-[11px] mr-1">Tone:</span>
                        {(["Formal", "Concise", "Apologetic"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => handleGenerateAI(t)}
                            disabled={isLoadingAI}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 transition-all disabled:opacity-50"
                          >
                            {t}
                          </button>
                        ))}
                        <button
                          onClick={() => handleGenerateAI("Professional")}
                          disabled={isLoadingAI}
                          className="ml-1.5 flex items-center gap-1 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-lg border border-blue-200 transition-all disabled:opacity-50"
                        >
                          {isLoadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Re-generate
                        </button>
                      </div>
                    )}
                  </div>

                  {activeTab === "reply" ? (
                    <>
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
                          Target Gateway: <span className="text-slate-800 font-semibold">{selectedTicket.channel} API Outbound</span>
                        </div>
                        <button
                          onClick={handleSend}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> Dispatch via {selectedTicket.channel}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <textarea
                        rows={4}
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Add internal notes visible only to operations agents..."
                        className="w-full bg-amber-50/40 border border-amber-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none transition"
                      />
                      <div className="mt-3.5 flex justify-end">
                        <button
                          onClick={handleSaveInternalNote}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Save Private Note
                        </button>
                      </div>
                    </>
                  )}
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

      {/* Collapsible Telemetry Drawer */}
      <footer className="border-t border-slate-200 bg-white flex flex-col z-30 transition-all duration-300 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div
          onClick={() => setShowTerminalDrawer(!showTerminalDrawer)}
          className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
        >
          <div className="flex items-center gap-2.5 text-xs font-mono text-slate-700">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-bold">Autonomous Core Telemetry</span>
            <span className="text-slate-400 text-[11px]">• Realtime WebSocket: Active</span>
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
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    log.level === "DISPATCH"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : log.level === "AGENT"
                      ? "bg-blue-950 text-blue-400 border border-blue-800"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </footer>

      {/* RAG Knowledge Base Modal */}
      {showKBModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Database className="w-4 h-4 text-indigo-600" /> Autonomous Knowledge Grounding (RAG)
              </div>
              <button
                onClick={() => setShowKBModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-indigo-900">Index New Support Policy Rule</span>
              <input
                type="text"
                placeholder="Topic Tag (e.g. Refund Policy, SLA Breach)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                rows={2}
                placeholder="Grounding instruction for Gemini model inferences..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddKBArticle}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Commit Vector
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {kbArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-sm"
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-700 mb-0.5">{art.topic}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{art.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteKB(art.id)}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowKBModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Channel Mobile Preview Modal */}
      {showPreviewModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-[360px] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-xs text-slate-800">{selectedTicket.channel} Client View</span>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-100/60 flex-1 space-y-3 min-h-[320px] flex flex-col justify-end text-xs">
              <div className="bg-white text-slate-800 p-3 rounded-2xl rounded-bl-sm max-w-[85%] self-start shadow-sm border border-slate-200/60">
                <div className="font-bold text-[10px] text-slate-400 mb-0.5">{selectedTicket.customer}</div>
                {selectedTicket.message}
              </div>

              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-br-sm max-w-[85%] self-end shadow-md shadow-blue-500/20 space-y-1">
                <div className="font-semibold text-[10px] text-blue-100 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> OmniAI Dispatcher
                </div>
                <div>{replyText || selectedTicket.suggested_reply}</div>
              </div>
            </div>

            <div className="p-3.5 bg-white border-t border-slate-100 text-center">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operations Pulse & SLA Telemetry Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Operations Pulse & SLA Telemetry</h3>
                  <p className="text-xs text-slate-500">Live multi-channel telemetry and autonomous agent throughput</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core KPIs */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.resolutionRate}%</div>
                <div className="text-[11px] font-medium text-slate-600 mt-1">Autonomous Resolution</div>
                <div className="text-[10px] text-emerald-600 font-semibold font-mono mt-0.5">Target: &gt;85%</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-blue-600 font-mono">1.18s</div>
                <div className="text-[11px] font-medium text-slate-600 mt-1">Gemini Inference Latency</div>
                <div className="text-[10px] text-blue-600 font-semibold font-mono mt-0.5">p95 SLA: 2.0s</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-center">
                <div className="text-2xl font-bold text-amber-600 font-mono">
                  {tickets.filter((t) => t.slaMinutesLeft > 0 && t.slaMinutesLeft < 15).length}
                </div>
                <div className="text-[11px] font-medium text-slate-600 mt-1">At-Risk SLA Tickets</div>
                <div className="text-[10px] text-rose-600 font-semibold font-mono mt-0.5">
                  {stats.escalated} escalated
                </div>
              </div>
            </div>

            {/* Ingestion Distribution */}
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-3.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Channel Volume Distribution
              </div>
              <div className="space-y-3 text-xs">
                {(["WhatsApp", "Telegram", "Email", "Lark"] as const).map((channel) => {
                  const count = tickets.filter((t) => t.channel === channel).length;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={channel} className="space-y-1.5">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-semibold">{channel}</span>
                        <span className="text-slate-500 font-mono">
                          {count} tickets ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            channel === "WhatsApp"
                              ? "bg-emerald-500"
                              : channel === "Telegram"
                              ? "bg-sky-500"
                              : channel === "Lark"
                              ? "bg-blue-600"
                              : "bg-indigo-600"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sentiment & Gateway Health */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Customer Sentiment Pulse
                </div>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Frustrated / Urgent:</span>
                    <span className="text-rose-600 font-mono font-bold">
                      {tickets.filter((t) => t.sentiment === "Frustrated" || t.sentiment === "Urgent").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neutral / Positive:</span>
                    <span className="text-emerald-600 font-mono font-bold">
                      {tickets.filter((t) => t.sentiment === "Neutral" || t.sentiment === "Positive").length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Autonomous Agent Tools
                </div>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Active Ingest Gateway:</span>
                    <span className="text-emerald-600 font-mono font-bold">200 OK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RAG Grounding Sync:</span>
                    <span className="text-blue-600 font-mono font-bold">{kbArticles.length} active docs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">Engine: Gemini 2.5 Flash Autonomous Stream</span>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Clean Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-14 right-6 flex items-center gap-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-medium px-4 py-3 rounded-2xl shadow-xl shadow-slate-300/30 animate-in fade-in slide-in-from-bottom-3 duration-200 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}