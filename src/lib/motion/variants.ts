import type { Variants } from "framer-motion";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

export const sidebarVariants: Variants = {
  expanded: {
    width: "15rem",
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  collapsed: {
    width: "4rem",
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const panelHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.005,
    y: -2,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};
