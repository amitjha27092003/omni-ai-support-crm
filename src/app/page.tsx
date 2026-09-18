"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTickets, type Ticket } from "@/hooks/useTickets";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { HeroContent } from "@/components/hero/HeroContent";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { TicketsTable } from "@/components/dashboard/TicketsTable";
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

export default function Dashboard() {
  const { tickets, setTickets, loading, error, refetch, syncMode } = useTickets();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "AI Resolved" | "Escalated" | "Resolved">("All");
  const [filterChannel, setFilterChannel] = useState<"All" | "Telegram" | "WhatsApp" | "Email" | "Lark">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
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
  const [isToastError, setIsToastError] = useState(false);

  const addLog = (level: "INFO" | "AGENT" | "DISPATCH", message: string) => {
    const newLog: AgentLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level,
      message,
    };
    setAgentLogs((prev) => [newLog, ...prev.slice(0, 24)]);
  };

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => {
      setToastMessage(null);
      setIsToastError(false);
    }, 4000);
  };

  // Keep selected ticket in sync with loaded tickets
  useEffect(() => {
    if (tickets.length > 0) {
      setSelectedTicket((curr) => {
        if (!curr) {
          setReplyText(tickets[0].ai_reply || tickets[0].suggested_reply || "");
          return tickets[0];
        }
        const found = tickets.find((t) => t.id === curr.id);
        return found || tickets[0];
      });
    }
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus = filterStatus === "All" || t.status === filterStatus;
      const matchesChannel = filterChannel === "All" || t.channel === filterChannel;
      const q = searchQuery.toLowerCase().trim();
      const msg = (t.sanitized_message || t.original_message || "").toLowerCase();
      const cust = (t.customer_name || "").toLowerCase();
      const handle = (t.customer_handle || "").toLowerCase();
      const cat = (t.category_slug || "").toLowerCase();
      const ch = (t.channel || "").toLowerCase();

      const matchesSearch =
        q === "" ||
        cust.includes(q) ||
        handle.includes(q) ||
        msg.includes(q) ||
        cat.includes(q) ||
        ch.includes(q);
      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [tickets, filterStatus, filterChannel, searchQuery]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "AI Resolved" || t.status === "Resolved").length;
    const escalated = tickets.filter((t) => t.status === "Escalated").length;
    const pending = tickets.filter(
      (t) => t.status === "Pending" || t.status === "Open" || t.status === "AI In-Progress" || t.status === "In Progress"
    ).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, resolved, escalated, pending, resolutionRate };
  }, [tickets]);

  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicket(t);
    setReplyText(t.ai_reply || t.suggested_reply || "");
    addLog("INFO", `Ticket focused: [${t.channel}] ${t.customer_name || t.customer}`);
  };

  const handleSend = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSending(true);

    try {
      // 1. Dispatch reply via /api/dispatch-reply
      const res = await fetch("/api/dispatch-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          chatId: selectedTicket.customer_handle,
          message: replyText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reply");
      }

      // 2. Update local state with resolved status
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? {
                ...t,
                status: "Resolved",
                ai_reply: replyText,
                suggested_reply: replyText,
                slaMinutesLeft: 0,
                resolved_at: now,
              }
            : t
        )
      );
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "Resolved",
              ai_reply: replyText,
              suggested_reply: replyText,
              slaMinutesLeft: 0,
              resolved_at: now,
            }
          : null
      );

      addLog("DISPATCH", `Dispatched response to ${selectedTicket.customer_name || selectedTicket.customer}`);
      showToast("Reply sent to Telegram");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dispatch failed";
      console.error("[handleSend] Error:", err);
      showToast(`Dispatch failed: ${msg}`, true);
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
    const headers = [
      "ID",
      "Customer Name",
      "Customer Handle",
      "Channel",
      "Category",
      "Status",
      "Confidence",
      "Query",
      "AI Reply",
    ];
    const rows = tickets.map((t) => [
      t.id,
      `"${t.customer_name || ""}"`,
      `"${t.customer_handle || ""}"`,
      t.channel,
      `"${t.category_slug || "Uncategorized"}"`,
      t.status,
      `${t.confidence_score}%`,
      `"${(t.sanitized_message || t.original_message || "").replace(/"/g, '""')}"`,
      `"${(t.ai_reply || "").replace(/"/g, '""')}"`,
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
                    isFetching={loading}
                    error={error}
                    onRefresh={refetch}
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
                    onShowToast={showToast}
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
      <ToastNotification message={toastMessage} isError={isToastError} />
    </div>
  );
}