import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = (val) => {
    if (!isControlled) setInternalValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground border border-border/60 shadow-2xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children, ...props }) {
  const { value: activeValue, setValue } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive
          ? "bg-white text-foreground shadow-sm font-bold scale-[1.01]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const { value: activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;

  return (
    <div
      className={cn("mt-4 ring-offset-white focus-visible:outline-none animate-in fade-in-50 duration-200", className)}
      {...props}
    >
      {children}
    </div>
  );
}
