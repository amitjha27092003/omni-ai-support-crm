"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const springConfig = { damping: 28, stiffness: 450, mass: 0.5 };
  const cursorX = useSpring(-100, springConfig);
  const cursorY = useSpring(-100, springConfig);

  const haloConfig = { damping: 35, stiffness: 220, mass: 0.8 };
  const haloX = useSpring(-100, haloConfig);
  const haloY = useSpring(-100, haloConfig);

  useEffect(() => {
    // Only activate for non-touch devices with fine cursor
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      haloX.set(e.clientX);
      haloY.set(e.clientY);

      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest("button, a, input, textarea, [role='button'], .cursor-pointer");
        setIsPointer(!!interactive);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);
    document.body.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [cursorX, cursorY, haloX, haloY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* Saffron Outer Halo */}
      <motion.div
        style={{
          x: haloX,
          y: haloY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isPointer ? 1.6 : 1,
          opacity: isPointer ? 0.7 : 0.45,
        }}
        transition={{ duration: 0.2 }}
        className="absolute w-8 h-8 rounded-full border border-[#FF9933]/60 bg-[#FF9933]/15 blur-[2px] shadow-[0_0_15px_rgba(255,153,51,0.5)]"
      />

      {/* Chakra Blue Core Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isPointer ? 0.8 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-[#60A5FA] shadow-[0_0_8px_rgba(59,130,246,0.9)]"
      />
    </div>
  );
}
