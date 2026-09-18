"use client";

import React, { useRef, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tiltEnabled?: boolean;
  glowColor?: "saffron" | "chakra" | "green" | "tricolor" | "none";
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  tiltEnabled = true,
  glowColor = "none",
  onClick,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const glowStyles = {
    none: "",
    saffron: "hover:shadow-[0_10px_35px_-8px_rgba(255,153,51,0.25)] hover:border-[#FF9933]/40",
    chakra: "hover:shadow-[0_10px_35px_-8px_rgba(59,130,246,0.25)] hover:border-[#3B82F6]/40",
    green: "hover:shadow-[0_10px_35px_-8px_rgba(16,185,129,0.25)] hover:border-[#10B981]/40",
    tricolor: "hover:shadow-[0_12px_40px_-10px_rgba(255,153,51,0.2),0_0_20px_-5px_rgba(16,185,129,0.2)] hover:border-white/30",
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: tiltEnabled ? 1000 : undefined,
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-2xl transition-all duration-300",
        "bg-slate-900/50 dark:bg-[#12131F]/60 backdrop-blur-xl",
        "border border-white/10 dark:border-white/[0.08]",
        "shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        "light:bg-white/80 light:border-slate-200/80 light:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        glowStyles[glowColor],
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Gloss Reflection Highlight */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500",
          isHovered ? "opacity-100" : ""
        )}
        style={{
          background:
            glowColor === "saffron"
              ? "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,153,51,0.08), transparent 80%)"
              : "radial-gradient(400px circle at 50% 0%, rgba(255,255,255,0.06), transparent 80%)",
        }}
      />
      <div style={{ transform: "translateZ(10px)" }}>{children}</div>
    </motion.div>
  );
}
