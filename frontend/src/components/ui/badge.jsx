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
    default: "bg-muted text-foreground border-border",
    secondary: "bg-muted text-foreground border-border",
    primary: "bg-secondary text-primary border-primary/30",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    outline: "text-muted-foreground border-border bg-card",
    gold: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950 border-amber-300 font-bold",
    dark: "bg-foreground text-white border-slate-800",
  };

  const dotColors = {
    default: "bg-muted-foreground/40",
    secondary: "bg-slate-500",
    primary: "bg-primary",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
    destructive: "bg-red-600",
    outline: "bg-muted-foreground/40",
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
