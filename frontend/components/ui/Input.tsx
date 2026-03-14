"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-text-muted">{label}</label>}
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-subtle",
        "focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all",
        error && "border-danger",
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
));

Input.displayName = "Input";
export default Input;
