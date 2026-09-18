"use client";

import React from "react";

export function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 relative overflow-hidden"
        >
          {/* Shimmer sweep bar */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

          <div className="flex items-center justify-between">
            <div className="h-3.5 w-28 bg-white/10 rounded-md" />
            <div className="h-3 w-14 bg-white/5 rounded-md" />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-white/5 rounded-md" />
            <div className="h-3 w-3/4 bg-white/5 rounded-md" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="h-4 w-16 bg-[#FF9933]/15 rounded-md" />
            <div className="h-4 w-20 bg-[#10B981]/15 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
