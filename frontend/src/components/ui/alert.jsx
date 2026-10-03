import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

const variantStyles = {
  default: "bg-muted border-border/90 text-foreground [&>svg]:text-muted-foreground",
  destructive: "bg-red-50/80 border-red-200 text-red-900 [&>svg]:text-red-600",
  success: "bg-emerald-50/80 border-emerald-200 text-emerald-900 [&>svg]:text-emerald-600",
  warning: "bg-amber-50/80 border-amber-200 text-amber-900 [&>svg]:text-amber-600",
  info: "bg-secondary/80 border-primary/30 text-primary [&>svg]:text-primary",
};

export function Alert({ className, variant = "default", children, ...props }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-2xl border p-4 shadow-2xs [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:w-5 [&>svg]:h-5 [&>div]:pl-7",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, children, ...props }) {
  return (
    <h5
      className={cn("mb-1 font-semibold leading-none tracking-tight text-sm", className)}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children, ...props }) {
  return (
    <div
      className={cn("text-xs leading-relaxed opacity-90", className)}
      {...props}
    >
      {children}
    </div>
  );
}
