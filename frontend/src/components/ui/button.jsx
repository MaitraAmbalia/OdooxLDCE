import React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "md",
  disabled,
  children,
  type = "button",
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";
  
  const variants = {
    default: "bg-[var(--color-dusk)] text-white hover:bg-[var(--color-dusk-hover)] focus:ring-[var(--color-dusk)] shadow-sm hover:shadow",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-300",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-300 shadow-2xs",
    ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-300",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    gold: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold hover:brightness-105 shadow-md shadow-amber-500/20 focus:ring-amber-400",
    dark: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700 shadow-sm",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
    icon: "w-9 h-9 p-0",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
