import { type Variants, type Transition } from "framer-motion";

export const springTransition: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(6px)",
    transition: { duration: 0.2 },
  },
};

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 16,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    filter: "blur(6px)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(6px)",
    transition: { duration: 0.3, ease: "easeIn" },
  },
};
