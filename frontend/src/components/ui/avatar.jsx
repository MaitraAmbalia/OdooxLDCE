import React from "react";
import { cn } from "../../lib/utils";

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-200/80 shadow-2xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = "", className, ...props }) {
  const [error, setError] = React.useState(!src);

  if (error || !src) return null;

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground font-mono uppercase",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
