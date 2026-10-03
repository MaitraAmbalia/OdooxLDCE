import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(({
  className,
  type = "text",
  error,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[var(--color-dusk)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";

export const Textarea = React.forwardRef(({
  className,
  error,
  rows = 3,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <textarea
        rows={rows}
        className={cn(
          "flex w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[var(--color-dusk)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

Textarea.displayName = "Textarea";
