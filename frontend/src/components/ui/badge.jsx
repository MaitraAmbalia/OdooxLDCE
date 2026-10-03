import React from "react";
import { cn } from "../../lib/utils";

export function Badge({
  className,
  variant = "default",
  children,
  dot = false,
  ...props
}) {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    outline: "text-slate-600 border-slate-300 bg-white",
    gold: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950 border-amber-300 font-bold",
    dark: "bg-slate-900 text-white border-slate-800",
  };

  const dotColors = {
    default: "bg-slate-400",
    secondary: "bg-slate-500",
    primary: "bg-blue-600",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
    destructive: "bg-red-600",
    outline: "bg-slate-400",
    gold: "bg-amber-600",
    dark: "bg-emerald-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant] || "bg-current")} />}
      {children}
    </span>
  );
}
