"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** 부드러운 감속 (ease-out 강조) */
const easePage = [0.22, 1, 0.36, 1] as const;

export function AppMotionProvider({ children }: Props) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pathname}
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{
              duration: 0.26,
              ease: easePage,
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
