import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverScale?: number;
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hoverScale = 1.02,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay,
      }}
      whileHover={{
        scale: hoverScale,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating animation for special cards
export function FloatingCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay,
      }}
      whileHover={{
        y: -8,
        rotateY: 5,
        rotateX: 5,
        transition: { type: "spring", stiffness: 300, damping: 15 },
      }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
