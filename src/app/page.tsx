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
  Flame,
} from "lucide-react";

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
    addLog("INFO", `Ticket #${t.id} loaded into active workspace [${t.channel}]`);
  };

  const handleGenerateAI = async (tone = "Professional") => {
    if (!selectedTicket) return;
    setIsLoadingAI(true);
    addLog("AGENT", `Triggering Gemini inference for ${selectedTicket.customer} (Tone: ${tone})`);

    try {
      const res = await fetch("/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerMessage: selectedTicket.message,
          customerName: selectedTicket.customer,
          channel: selectedTicket.channel,
          tone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setReplyText(data.reply);
          setIsLoadingAI(false);
          addLog("AGENT", `Inference complete (Confidence: ${selectedTicket.confidence}%)`);
          showToast(`Reply tuned to ${tone} tone`);
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
    addLog("AGENT", `Simulated fallback draft synthesized`);
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

    addLog("DISPATCH", `Webhook payload sent to ${selectedTicket.customer} via ${selectedTicket.channel}`);
    showToast(`Response dispatched to ${selectedTicket.customer} via ${selectedTicket.channel}!`);
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;

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

    addLog("INFO", `Human escalation: Ticket #${selectedTicket.id} routed to Tier-2`);
    showToast(`Ticket ${selectedTicket.id} escalated to Human Tier-2 Specialists!`);
  };

  const handleAutoPilotResolveAll = async () => {
    setIsAutoPiloting(true);
    addLog("AGENT", `Auto-Pilot sequence initialized for ${stats.pending} pending tickets`);
    showToast("Auto-Pilot active: evaluating pending queue...");

    await new Promise((r) => setTimeout(r, 1200));

    setTickets((prev) =>
      prev.map((t) => (t.status === "Pending" ? { ...t, status: "AI Resolved", slaMinutesLeft: 0 } : t))
    );

    if (selectedTicket && selectedTicket.status === "Pending") {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "AI Resolved", slaMinutesLeft: 0 } : null));
    }

    setIsAutoPiloting(false);
    addLog("DISPATCH", `Auto-Pilot batch resolution completed successfully`);
    showToast("Autonomous sweep complete: Pending tickets resolved!");
  };

  const handleSaveInternalNote = () => {
    if (!selectedTicket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedTicket.id ? { ...t, internal_note: internalNote } : t))
    );
    addLog("INFO", `Internal note committed to ticket #${selectedTicket.id}`);
    showToast("Internal note saved for team");
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
    link.setAttribute("download", `OmniAI_Tickets_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("INFO", "CSV report generation requested and delivered");
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
    addLog("INFO", `Knowledge base indexed: "${article.topic}" added to grounding memory`);
    showToast("Knowledge Base doc added");
  };

  const handleDeleteKB = (id: string) => {
    setKbArticles((prev) => prev.filter((a) => a.id !== id));
    addLog("INFO", `Knowledge vector #${id} unindexed from RAG memory`);
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

  const handleSimulateNewTicket = () => {
    const newTicket = generateRandomTicket();
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    setReplyText(newTicket.suggested_reply);
    setInternalNote("");
    addLog("INFO", `Inbound message received: ${newTicket.customer} [${newTicket.channel}]`);
    showToast(`Incoming ticket from ${newTicket.customer}`);
  };

  const toggleLiveSimulating = () => {
    if (isLiveSimulating) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLiveSimulating(false);
      addLog("INFO", "Real-time inbound webhook simulator suspended");
      showToast("Live ticket engine stopped");
    } else {
      setIsLiveSimulating(true);
      addLog("INFO", "Real-time inbound stream active: listening on port 3000");
      showToast("Live simulation started: auto-receiving tickets every 6s");
      timerRef.current = setInterval(() => {
        const ticket = generateRandomTicket();
        setTickets((prev) => [ticket, ...prev]);
        addLog("INFO", `New inbound event: ${ticket.customer} [${ticket.channel}]`);
      }, 6000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md shadow-blue-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight block">OmniAI Ops</span>
                <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Dispatch
                </span>
              </div>
            </div>
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-400 font-medium cursor-pointer">
                <MessageSquare className="w-5 h-5" /> Tickets Queue
              </div>
              <div
                onClick={() => setShowAnalyticsModal(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
              >
                <BarChart3 className="w-5 h-5" /> Operations Pulse
              </div>
              <div
                onClick={() => setShowKBModal(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
              >
                <Database className="w-5 h-5 text-indigo-400" /> Grounding KB ({kbArticles.length})
              </div>
            </nav>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <button
                onClick={toggleLiveSimulating}
                className={`w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  isLiveSimulating
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {isLiveSimulating ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                    Stop Inbound Traffic
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    Start Inbound Engine
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoPilotResolveAll}
                  disabled={isAutoPiloting || stats.pending === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-semibold shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
                >
                  {isAutoPiloting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Auto-Pilot ({stats.pending})
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                Ops Overview
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="flex justify-center mb-1 text-slate-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-slate-200">{stats.total}</div>
                  <div className="text-[8px] text-slate-500">Total</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="flex justify-center mb-1 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-amber-400">{stats.pending}</div>
                  <div className="text-[8px] text-slate-500">Pending</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="flex justify-center mb-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-emerald-400">{stats.resolved}</div>
                  <div className="text-[8px] text-slate-500">Done</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center">
                  <div className="flex justify-center mb-1 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs font-bold text-rose-400">{stats.escalated}</div>
                  <div className="text-[8px] text-slate-500">Escalated</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Ticket List Stream */}
        <section className="w-96 border-r border-slate-800 flex flex-col bg-slate-900/20">
          <div className="p-4 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                Stream{" "}
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                  {filteredTickets.length}
                </span>
                {isLiveSimulating && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> streaming
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSimulateNewTicket}
                  className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors font-medium"
                >
                  <Plus className="w-3 h-3" /> Simulate
                </button>
                <button onClick={fetchTickets} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-400" : ""}`} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search customer, query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Platform Filter Pills */}
            <div className="flex items-center gap-1 text-[10px] flex-wrap">
              {(["All", "WhatsApp", "Telegram", "Email", "Lark"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setFilterChannel(ch)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    filterChannel === ch
                      ? "bg-blue-600/20 border-blue-500 text-blue-400 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[11px]">
              {(["All", "Pending", "AI Resolved", "Escalated"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`flex-1 py-1 rounded font-medium transition-colors text-[10px] ${
                    filterStatus === st
                      ? "bg-slate-800 text-blue-400 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No tickets found.</div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedTicket?.id === t.id
                      ? "bg-slate-800/60 border-l-2 border-blue-500"
                      : "hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-slate-200">{t.customer}</span>
                    <div className="flex items-center gap-1.5">
                      {t.status === "Pending" && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          t.slaMinutesLeft < 10
                            ? "text-rose-400 bg-rose-950/40 border border-rose-800/40 animate-pulse"
                            : "text-slate-400 bg-slate-850"
                        }`}>
                          {t.slaMinutesLeft}m SLA
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500">
                        {new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 truncate mb-2">{t.message}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      t.channel === "WhatsApp"
                        ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
                        : t.channel === "Telegram"
                        ? "bg-sky-950/30 border-sky-800/40 text-sky-400"
                        : t.channel === "Lark"
                        ? "bg-blue-950/40 border-blue-700/40 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}>
                      {t.channel}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        t.priority === "High"
                          ? "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                          : t.priority === "Medium"
                          ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                          : "text-slate-400 bg-slate-800"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        t.sentiment === "Frustrated"
                          ? "text-red-400 bg-red-950/40 border border-red-800/40"
                          : t.sentiment === "Urgent"
                          ? "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                          : "text-blue-400 bg-blue-950/40 border border-blue-800/40"
                      }`}
                    >
                      ● {t.sentiment || "Neutral"}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ml-auto ${
                        t.status === "AI Resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : t.status === "Escalated"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col bg-slate-950">
          {selectedTicket ? (
            <>
              <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white">{selectedTicket.customer}</h1>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Sentiment: {selectedTicket.sentiment || "Neutral"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: {selectedTicket.id} • Channel: {selectedTicket.channel} • Priority: {selectedTicket.priority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1 rounded-full transition-colors"
                  >
                    <Smartphone className="w-3 h-3 text-blue-400" />
                    Channel Dispatch Preview
                  </button>
                  <button
                    onClick={handleEscalate}
                    disabled={selectedTicket.status === "Escalated"}
                    className="flex items-center gap-1.5 text-xs bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {selectedTicket.status === "Escalated" ? "Escalated to Tier-2" : "Escalate to Human"}
                  </button>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      selectedTicket.status === "AI Resolved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : selectedTicket.status === "Escalated"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    Status: {selectedTicket.status}
                  </span>
                </div>
              </header>

              <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-3 max-w-2xl">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-slate-400 mb-1">Customer Query</p>
                    <p className="text-sm text-slate-200 leading-relaxed">{selectedTicket.message}</p>
                  </div>

                  {selectedTicket.kb_context && (
                    <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3 text-xs flex items-start gap-2.5 text-blue-300">
                      <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-blue-400">Grounding Policy Reference: </span>
                        <span>{selectedTicket.kb_context}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-2.5 text-xs flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                      <span>Inbound from <strong>{selectedTicket.channel}</strong></span>
                    </div>
                    <div className="h-px w-8 bg-slate-800" />
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Sparkles className="w-3 h-3" />
                      <span>Gemini Agent Drafted</span>
                    </div>
                    <div className="h-px w-8 bg-slate-800" />
                    <div className={`flex items-center gap-1.5 ${selectedTicket.status === "AI Resolved" ? "text-emerald-400" : selectedTicket.status === "Escalated" ? "text-rose-400" : "text-amber-400"}`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{selectedTicket.status}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative">
                  <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("reply")}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded transition-colors ${
                          activeTab === "reply"
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI Suggested Reply
                      </button>
                      <button
                        onClick={() => setActiveTab("notes")}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded transition-colors ${
                          activeTab === "notes"
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> Internal Notes
                      </button>
                      <span className="text-[11px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                        {selectedTicket.confidence}% Confidence
                      </span>
                    </div>

                    {activeTab === "reply" && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 text-[11px] mr-1">Tone:</span>
                        {(["Formal", "Concise", "Apologetic"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => handleGenerateAI(t)}
                            disabled={isLoadingAI}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 disabled:opacity-50"
                          >
                            {t}
                          </button>
                        ))}
                        <button
                          onClick={() => handleGenerateAI("Professional")}
                          disabled={isLoadingAI}
                          className="ml-2 flex items-center gap-1 text-[11px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-2.5 py-0.5 rounded border border-blue-500/30 transition-colors disabled:opacity-50"
                        >
                          {isLoadingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Refresh
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
                        placeholder="Type or customize your reply..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none border-blue-500/50 resize-none"
                      />
                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Share2 className="w-3 h-3 text-blue-400" />
                          Outbound Channel: <strong className="text-slate-300">{selectedTicket.channel} API Gateway</strong>
                        </div>
                        <button
                          onClick={handleSend}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
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
                        placeholder="Add an internal note visible only to support teammates..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-amber-200 placeholder-slate-600 focus:outline-none border-amber-500/50 resize-none"
                      />
                      <div className="mt-3 flex justify-end gap-3">
                        <button
                          onClick={handleSaveInternalNote}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors"
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
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a ticket from the stream to start.
            </div>
          )}
        </main>
      </div>

      {/* Collapsible Agent Execution Log Drawer */}
      <footer className="border-t border-slate-800 bg-slate-950/95 flex flex-col z-30 transition-all duration-300">
        <div
          onClick={() => setShowTerminalDrawer(!showTerminalDrawer)}
          className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-850"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Autonomous Core Telemetry</span>
            <span className="text-slate-500 text-[11px]">• Status: Nominal</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span>{showTerminalDrawer ? "Collapse Console" : "Expand Live Logs"}</span>
            {showTerminalDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {showTerminalDrawer && (
          <div className="p-3 bg-slate-950 font-mono text-[11px] space-y-1.5 max-h-44 overflow-y-auto border-t border-slate-900">
            {agentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-slate-500 select-none">[{log.time}]</span>
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    log.level === "DISPATCH"
                      ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                      : log.level === "AGENT"
                      ? "bg-blue-950/80 text-blue-400 border border-blue-800/50"
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

      {/* Knowledge Base Modal */}
      {showKBModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Database className="w-5 h-5 text-indigo-400" /> Autonomous Knowledge Base (RAG Grounding)
              </div>
              <button onClick={() => setShowKBModal(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-indigo-300">Index New Support Rule</span>
              <input
                type="text"
                placeholder="Topic / Tag (e.g. Refund Policy, SLA Breach)"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                rows={2}
                placeholder="Grounding instruction used by Gemini to generate factual answers..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddKBArticle}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Commit Vector
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {kbArticles.map((art) => (
                <div key={art.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-indigo-400 mb-1">{art.topic}</div>
                    <p className="text-xs text-slate-300">{art.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteKB(art.id)}
                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowKBModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Channel Preview Modal */}
      {showPreviewModal && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-[360px] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800/80 p-3 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-semibold text-xs text-slate-100">{selectedTicket.channel} Native Client</span>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex-1 space-y-3 min-h-[300px] flex flex-col justify-end text-xs">
              <div className="bg-slate-800 text-slate-200 p-2.5 rounded-2xl rounded-bl-sm max-w-[85%] self-start shadow-sm">
                <div className="font-semibold text-[10px] text-slate-400 mb-0.5">{selectedTicket.customer}</div>
                {selectedTicket.message}
              </div>

              <div className="bg-blue-600 text-white p-2.5 rounded-2xl rounded-br-sm max-w-[85%] self-end shadow-sm space-y-1">
                <div className="font-semibold text-[10px] text-blue-200 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> OmniAI Dispatcher
                </div>
                <div>{replyText || selectedTicket.suggested_reply}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <BarChart3 className="w-5 h-5 text-blue-400" /> Operations Pulse & SLA
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.resolutionRate}%</div>
                <div className="text-[11px] text-slate-400 mt-1">Autonomous Resolution Rate</div>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">~1.4s</div>
                <div className="text-[11px] text-slate-400 mt-1">Avg Gemini Response Latency</div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Multi-channel Traffic</span>
                <span className="text-slate-200">WhatsApp, Lark, Telegram, Email</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Escalated to Human</span>
                <span className="text-rose-400 font-semibold">{stats.escalated} tickets</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-14 right-6 flex items-center gap-2.5 bg-slate-900 border border-emerald-500/40 text-slate-100 text-xs px-4 py-2.5 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}