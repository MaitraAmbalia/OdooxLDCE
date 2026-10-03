import { CalendarDays, CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContentState({
  title,
  description,
  error = false,
  action,
  actionLabel,
}) {
  const Icon = error ? CircleAlert : CalendarDays;
  return (
    <div
      role={error ? "alert" : "status"}
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"
    >
      <div className="mb-4 rounded-full bg-secondary p-3 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button variant="outline" className="mt-5" onClick={action}>
          {error && <RotateCcw aria-hidden="true" />}
          {actionLabel || "Try again"}
        </Button>
      )}
    </div>
  );
}
