"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  target: number;
  className?: string;
}

export default function ProgressBar({ current, target, className }: ProgressBarProps) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const color = pct === 0 ? "bg-border" : pct >= 100 ? "bg-success" : "bg-accent";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-xs text-text-muted mb-1">
        <span>{Math.round(pct)}%</span>
        <span>{current.toLocaleString("ru-RU")} / {target.toLocaleString("ru-RU")} ₽</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
