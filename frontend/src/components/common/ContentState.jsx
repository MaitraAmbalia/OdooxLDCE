import { Link } from "react-router-dom";
import { Inbox, CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Empty / error panel: say what will appear here and offer the one action that fills it.
// `action` is a retry callback; `to` + `actionLabel` renders a link instead.
export function ContentState({
  title,
  description,
  error = false,
  icon,
  action,
  actionLabel,
  to,
}) {
  const Icon = error ? CircleAlert : icon ?? Inbox;
  return (
    <div
      role={error ? "alert" : "status"}
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"
    >
      <div className={"mb-4 rounded-full p-3 " + (error ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary")}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {to ? (
        <Button asChild variant="outline" className="mt-5">
          <Link to={to}>{actionLabel}</Link>
        </Button>
      ) : action && (
        <Button variant="outline" className="mt-5" onClick={action}>
          {error && <RotateCcw aria-hidden="true" />}
          {actionLabel || "Try again"}
        </Button>
      )}
    </div>
  );
}
