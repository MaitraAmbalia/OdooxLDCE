import React from "react";
import { cn } from "../../lib/utils";

export function Progress({ value = 0, max = 100, className, indicatorClassName, ...props }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-muted border border-border/60 shadow-inner",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-500 ease-out rounded-full",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}
