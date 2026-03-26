"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppMotionProvider({ children }: Props) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: "easeOut" }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}

