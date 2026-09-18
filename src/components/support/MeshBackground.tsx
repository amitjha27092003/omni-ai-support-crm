"use client";

import React from "react";
import { motion } from "framer-motion";

export function MeshBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#0A0A0F]">
      {/* Deep Void Ambient Base */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#0A0A0F]/80 to-[#0A0A0F]" />

      {/* Blob 1: Saffron Top-Left */}
      <motion.div
        animate={{
          x: [-30, 40, -20, -30],
          y: [-20, 30, 10, -20],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -left-32 w-[480px] sm:w-[640px] h-[480px] sm:h-[640px] rounded-full bg-[#FF9933]/20 blur-[130px] mix-blend-screen"
      />

      {/* Blob 2: Chakra Blue Center */}
      <motion.div
        animate={{
          x: [20, -40, 30, 20],
          y: [30, -30, 20, 30],
          scale: [0.9, 1.1, 1, 0.9],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] sm:w-[700px] h-[520px] sm:h-[700px] rounded-full bg-[#1E3A8A]/35 blur-[150px] mix-blend-screen"
      />

      {/* Blob 3: India Green Bottom-Right */}
      <motion.div
        animate={{
          x: [30, -30, 20, 30],
          y: [20, -40, 10, 20],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-32 -right-32 w-[500px] sm:w-[680px] h-[500px] sm:h-[680px] rounded-full bg-[#138808]/20 blur-[140px] mix-blend-screen"
      />

      {/* Subtle Grain Overlay Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
