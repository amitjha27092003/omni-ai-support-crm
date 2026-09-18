"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export type TicketStatusType = "Pending" | "Open" | "In Progress" | "AI Resolved" | "Resolved" | "Escalated";

interface StatusPillProps {
  status: TicketStatusType | string;
  className?: string;
  pulse?: boolean;
}

export function StatusPill({ status, className, pulse = true }: StatusPillProps) {
  let style = {
    bg: "bg-amber-500/10 dark:bg-[#FF9933]/15",
    border: "border-amber-500/30 dark:border-[#FF9933]/40",
    text: "text-amber-600 dark:text-[#FFAA55]",
    dot: "bg-[#FF9933]",
  };

  if (status === "Resolved" || status === "AI Resolved") {
    style = {
      bg: "bg-emerald-500/10 dark:bg-[#10B981]/15",
      border: "border-emerald-500/30 dark:border-[#10B981]/40",
      text: "text-emerald-600 dark:text-[#34D399]",
      dot: "bg-[#10B981]",
    };
  } else if (status === "In Progress") {
    style = {
      bg: "bg-blue-500/10 dark:bg-[#3B82F6]/15",
      border: "border-blue-500/30 dark:border-[#3B82F6]/40",
      text: "text-blue-600 dark:text-[#60A5FA]",
      dot: "bg-[#3B82F6]",
    };
  } else if (status === "Escalated") {
    style = {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      border: "border-rose-500/30 dark:border-rose-500/40",
      text: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
    };
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-xs select-none transition-all",
        style.bg,
        style.border,
        style.text,
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              style.dot
            )}
          />
          <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", style.dot)} />
        </span>
      )}
      <span>{status}</span>
    </span>
  );
}
