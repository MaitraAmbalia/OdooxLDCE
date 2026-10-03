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
    success: "bg-success-soft text-success border-success/30",
    warning: "bg-warning-soft text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    outline: "text-muted-foreground border-border bg-card",
    gold: "bg-gradient-to-r from-amber-100 to-amber-200 text-warning border-warning/30 font-bold",
    dark: "bg-foreground text-white border-foreground",
  };

  const dotColors = {
    default: "bg-muted-foreground/40",
    secondary: "bg-muted-foreground",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
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
