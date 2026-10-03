import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

const variantStyles = {
  default: "bg-muted border-border/90 text-foreground [&>svg]:text-muted-foreground",
  destructive: "bg-destructive/10/80 border-destructive/30 text-destructive [&>svg]:text-destructive",
  success: "bg-success-soft/80 border-success/30 text-success [&>svg]:text-success",
  warning: "bg-warning-soft/80 border-warning/30 text-warning [&>svg]:text-warning",
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
