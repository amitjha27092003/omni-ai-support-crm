"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { HeroContent } from "@/components/hero/HeroContent";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { TicketsTable, type Ticket } from "@/components/dashboard/TicketsTable";
import { AIInbox } from "@/components/dashboard/AIInbox";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import {
  PreviewModal,
  KBModal,
  TelemetryDrawer,
  ToastNotification,
  type AgentLog,
  type KBArticle,
} from "@/components/dashboard/Modals";

// Map Supabase DB schema to UI structure cleanly
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
    confidence: Number(dbRow.confidence_score) || 92,
    slaMinutesLeft: mappedStatus === "Resolved" || mappedStatus === "AI Resolved" ? 0 : 15,
    kb_context: dbRow.zkp_proof_hash ? `ZKP Hash: ${dbRow.zkp_proof_hash}` : undefined,
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
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "AI Resolved" | "Escalated" | "Resolved">("All");
  const [filterChannel, setFilterChannel] = useState<"All" | "Telegram" | "WhatsApp" | "Email" | "Lark">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Layout & Modals
  const [currentView, setCurrentView] = useState<"tickets" | "analytics" | "kb" | "customers">("tickets");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showKBModal, setShowKBModal] = useState(false);
  const [showTerminalDrawer, setShowTerminalDrawer] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Knowledge base
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

  // Telemetry logs
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([
    {
      id: "log-1",
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level: "INFO",
      message: "OmniAI Agent Engine booted with Supabase Live Sync & Gemini 2.5.",
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addLog = (level: "INFO" | "AGENT" | "DISPATCH", message: string) => {
    const newLog: AgentLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level,
      message,
    };
    setAgentLogs((prev) => [newLog, ...prev.slice(0, 24)]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Pure Supabase Database Fetch
  const fetchTickets = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("operational_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        const mapped = data.map(mapDbTicketToUi);
        setTickets(mapped);
        if (mapped.length > 0) {
          setSelectedTicket((curr) => {
            if (!curr) return mapped[0];
            const found = mapped.find((m) => m.id === curr.id);
            return found || mapped[0];
          });
          setReplyText((curr) => (!curr && mapped[0] ? mapped[0].suggested_reply : curr));
        }
      } else if (error) {
        console.error("Supabase Query Error:", error);
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
      .channel("tickets-realtime-live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "operational_tickets" },
        (payload) => {
          const newTck = mapDbTicketToUi(payload.new);
          setTickets((prev) => [newTck, ...prev.filter((t) => t.id !== newTck.id)]);
          addLog("INFO", `Realtime Inbound: [${newTck.channel}] from ${newTck.customer}`);
          showToast(`New Inbound: ${newTck.customer}`);
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
          addLog("DISPATCH", `State Sync: #${updated.id.slice(0, 6)} -> ${updated.status}`);
          showToast(`Status updated: ${updated.status}`);
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchTickets();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
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
    addLog("INFO", `Ticket focused: [${t.channel}] ${t.customer}`);
  };

  const handleSend = async () => {
    if (!selectedTicket) return;
    setIsSending(true);

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
      addLog("DISPATCH", `Dispatched response to ${selectedTicket.customer}`);
      showToast(`Response dispatched to ${selectedTicket.channel}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
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
    addLog("AGENT", `Auto-Pilot sequence initialized for ${stats.pending} tickets`);
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

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OmniAI_Tricolor_Live_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report generated & downloaded");
  };

  const handleAddKBArticle = (topic: string, content: string) => {
    const newArt: KBArticle = {
      id: `kb-${Date.now()}`,
      topic,
      content,
      active: true,
    };
    setKbArticles((prev) => [newArt, ...prev]);
    showToast(`Knowledge policy "${topic}" created`);
    addLog("AGENT", `New grounding policy registered: "${topic}"`);
  };

  const handleDeleteKBArticle = (id: string) => {
    setKbArticles((prev) => prev.filter((a) => a.id !== id));
    showToast("Policy removed");
  };

  return (
    <div className="min-h-screen flex flex-col relative font-sans antialiased text-slate-100">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={currentView}
        onTabSelect={(tab) => {
          if (tab === "analytics") setCurrentView("analytics");
          else if (tab === "inbox" || tab === "tickets") setCurrentView("tickets");
          else if (tab === "customers") setCurrentView("tickets");
          else if (tab === "settings") setShowKBModal(true);
        }}
        pendingCount={stats.pending}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto px-2 sm:px-6 py-4 gap-6 relative">
        {/* Left Glass Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            if (view === "kb") setShowKBModal(true);
            else setCurrentView(view);
          }}
          pendingCount={stats.pending}
          totalCount={stats.total}
          resolvedCount={stats.resolved}
          escalatedCount={stats.escalated}
          isAutoPiloting={isAutoPiloting}
          onAutoPilot={handleAutoPilotResolveAll}
          onExportCSV={handleExportCSV}
          onToggleTerminal={() => setShowTerminalDrawer(!showTerminalDrawer)}
          isTerminalOpen={showTerminalDrawer}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Main Dashboard Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-16">
          {/* 3D Cinematic Hero Section */}
          <HeroContent
            onOpenInbox={() => setCurrentView("tickets")}
            onOpenAnalytics={() => setCurrentView("analytics")}
            onOpenAutoPilot={handleAutoPilotResolveAll}
            pendingCount={stats.pending}
          />

          {/* KPI Metrics Grid */}
          <KPIGrid
            totalTickets={stats.total}
            pendingTickets={stats.pending}
            resolvedTickets={stats.resolved}
            escalatedTickets={stats.escalated}
            resolutionRate={stats.resolutionRate}
          />

          {/* View Conditional Rendering */}
          {currentView === "analytics" ? (
            <div className="space-y-6">
              <AnalyticsCharts
                totalTickets={stats.total}
                resolvedTickets={stats.resolved}
                pendingTickets={stats.pending}
                escalatedTickets={stats.escalated}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Work Area: Inbound Stream (Left) + AI Inbox / Conversation (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
                {/* Tickets Table / Inbound Stream */}
                <div className="lg:col-span-5 xl:col-span-4 h-[580px]">
                  <TicketsTable
                    tickets={filteredTickets}
                    selectedTicket={selectedTicket}
                    onSelectTicket={handleSelectTicket}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterChannel={filterChannel}
                    onFilterChannelChange={setFilterChannel}
                    filterStatus={filterStatus}
                    onFilterStatusChange={setFilterStatus}
                    isFetching={isFetching}
                    onRefresh={fetchTickets}
                  />
                </div>

                {/* AI Inbox / Active Resolution Workspace */}
                <div className="lg:col-span-7 xl:col-span-8 h-[580px]">
                  <AIInbox
                    ticket={selectedTicket}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onSendReply={handleSend}
                    onEscalate={handleEscalate}
                    onPreviewDispatch={() => setShowPreviewModal(true)}
                    isSending={isSending}
                  />
                </div>
              </div>

              {/* Integrated Operations Chart Below Queue */}
              <AnalyticsCharts
                totalTickets={stats.total}
                resolvedTickets={stats.resolved}
                pendingTickets={stats.pending}
                escalatedTickets={stats.escalated}
              />
            </div>
          )}
        </main>
      </div>

      {/* Global Minimal Glass Footer with Tricolor Hairline */}
      <Footer />

      {/* Mobile Dispatch Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        ticket={selectedTicket}
        replyText={replyText}
      />

      {/* Grounding Knowledge Base Modal */}
      <KBModal
        isOpen={showKBModal}
        onClose={() => setShowKBModal(false)}
        articles={kbArticles}
        onAddArticle={handleAddKBArticle}
        onDeleteArticle={handleDeleteKBArticle}
      />

      {/* Telemetry Agent Logs Drawer */}
      <TelemetryDrawer
        isOpen={showTerminalDrawer}
        onToggle={() => setShowTerminalDrawer(!showTerminalDrawer)}
        logs={agentLogs}
      />

      {/* Toast Notification */}
      <ToastNotification message={toastMessage} />
    </div>
  );
}