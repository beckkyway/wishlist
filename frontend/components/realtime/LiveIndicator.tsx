"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <AnimatePresence>
      <motion.div
        className="flex items-center gap-1.5 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={`relative flex h-2 w-2`}>
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              connected ? "bg-success" : "bg-danger"
            }`}
          />
        </span>
        <span className={connected ? "text-success" : "text-danger"}>
          {connected ? "Live" : "Переподключение..."}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
