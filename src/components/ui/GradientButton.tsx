"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "saffron" | "chakra" | "green" | "glass" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
}

export function GradientButton({
  children,
  className,
  variant = "saffron",
  size = "md",
  isLoading = false,
  icon,
  disabled,
  ...props
}: GradientButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2.5 text-xs font-semibold rounded-xl gap-2",
    lg: "px-6 py-3.5 text-sm font-semibold rounded-2xl gap-2.5",
  };

  const variantStyles = {
    saffron:
      "bg-gradient-to-r from-[#FF9933] via-[#FF8008] to-[#EA580C] text-white shadow-lg shadow-[#FF9933]/25 hover:shadow-[#FF9933]/40 border border-[#FFB066]/30",
    chakra:
      "bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 border border-blue-400/30",
    green:
      "bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-300/30",
    glass:
      "bg-white/10 dark:bg-white/5 backdrop-blur-md text-slate-100 hover:text-white border border-white/15 hover:border-white/25 shadow-md shadow-black/20 hover:bg-white/15",
    ghost:
      "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center font-medium transition-all duration-200 outline-none select-none shimmer-btn",
        "focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        sizeStyles[size],
        variantStyles[variant],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  );
}
