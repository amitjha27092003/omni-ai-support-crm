"use client";

import { motion } from "framer-motion";

export function MeshGradient() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Saffron Glow Orb - Top Left */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#FF9933]/15 dark:bg-[#FF9933]/12 blur-[120px] mix-blend-screen"
      />

      {/* Chakra Navy/Royal Blue Orb - Center / Right */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.9, 1.12, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-[#1E3A8A]/25 dark:bg-[#2563EB]/15 blur-[140px] mix-blend-screen"
      />

      {/* India Green Orb - Bottom Right */}
      <motion.div
        animate={{
          x: [0, 35, -40, 0],
          y: [0, -45, 30, 0],
          scale: [1, 1.1, 0.92, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-32 -right-32 w-[580px] h-[580px] rounded-full bg-[#10B981]/18 dark:bg-[#10B981]/14 blur-[130px] mix-blend-screen"
      />

      {/* Subtle Pearl White Center Shimmer */}
      <motion.div
        animate={{
          opacity: [0.03, 0.08, 0.03],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-white/5 blur-[100px]"
      />
    </div>
  );
}
